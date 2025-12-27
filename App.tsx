
import React, { useState, useMemo, useEffect } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import MovieModal from './components/MovieModal';
import AddContentModal from './components/AddContentModal';
import LoginModal from './components/LoginModal';
import Toast, { ToastMessage } from './components/Toast';
import { INITIAL_DATA, GENRES } from './constants';
import { MediaItem, Category } from './types';
import { supabase } from './services/supabaseClient';
import { Database, Cloud, AlertCircle, Sparkles, Star, Trash2 } from 'lucide-react';

const App: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [activeGenre, setActiveGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isUsingDemoData, setIsUsingDemoData] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  // Toast Helper
  const addToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type: type === 'error' ? 'info' : type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setItems(data);
        setIsUsingDemoData(false);
      } else {
        setItems(INITIAL_DATA);
        setIsUsingDemoData(true);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setItems(INITIAL_DATA);
      setIsUsingDemoData(true);
    } finally {
      setIsInitialLoad(false);
    }
  };

  useEffect(() => {
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleAddItem = async (newItem: MediaItem) => {
    try {
      const { id, ...itemToInsert } = newItem;
      const { data, error } = await supabase
        .from('media_items')
        .insert([itemToInsert])
        .select();

      if (error) throw error;

      if (data) {
        if (isUsingDemoData) {
          setItems([data[0]]);
          setIsUsingDemoData(false);
        } else {
          setItems(prev => [data[0], ...prev]);
        }
        addToast(`${newItem.title} added successfully.`);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to save.', 'error');
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin || isUsingDemoData) return;

    const item = items.find(i => i.id === id);
    if (!item) return;

    const newFavStatus = !item.is_favorite;

    try {
      const { error } = await supabase
        .from('media_items')
        .update({ is_favorite: newFavStatus })
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: newFavStatus } : i));
      addToast(newFavStatus ? 'Added to favorites.' : 'Removed from favorites.', 'success');
    } catch (err: any) {
      addToast('Update failed.', 'error');
    }
  };

  const handleBootstrap = async () => {
    if (!isAdmin) return;
    setIsBootstrapping(true);
    addToast('Bootstrapping your database...', 'info');

    try {
      const itemsToBootstrap = INITIAL_DATA.map(({ id, ...rest }) => rest);
      const { error } = await supabase
        .from('media_items')
        .insert(itemsToBootstrap);

      if (error) throw error;

      addToast('Database successfully initialized!', 'success');
      await fetchData();
    } catch (err: any) {
      addToast(err.message || 'Bootstrap failed.', 'error');
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!isAdmin || isUsingDemoData) return;
    if (!window.confirm('WARNING: This will delete ALL entries in your database. Proceed?')) return;

    try {
      const { error } = await supabase
        .from('media_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      setItems(INITIAL_DATA);
      setIsUsingDemoData(true);
      addToast('Database cleared. Returned to demo mode.', 'info');
    } catch (err: any) {
      addToast('Clear failed.', 'error');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUsingDemoData) {
      setItems(prev => prev.filter(item => item.id !== id));
      addToast('Demo item hidden.', 'info');
      return;
    }

    const item = items.find(i => i.id === id);
    if (window.confirm(`Remove "${item?.title}" permanently?`)) {
      try {
        const { error } = await supabase
          .from('media_items')
          .delete()
          .eq('id', id);
        if (error) throw error;
        setItems(prev => prev.filter(item => item.id !== id));
        addToast('Item removed.', 'info');
      } catch (err: any) {
        addToast(err.message || 'Delete failed.', 'error');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    addToast('Logged out.', 'info');
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = false;
      if (activeCategory === 'All' || activeCategory === 'Trending') {
        matchesCategory = true;
      } else if (activeCategory === 'Movies') {
        matchesCategory = item.type === 'Movie';
      } else if (activeCategory === 'TV Series') {
        matchesCategory = item.type === 'TV Series';
      } else if (activeCategory === 'Favorites') {
        matchesCategory = !!item.is_favorite;
      }

      const matchesGenre = activeGenre === 'All' || item.genre.includes(activeGenre);
      return matchesSearch && matchesCategory && matchesGenre;
    });
  }, [items, activeCategory, activeGenre, searchQuery]);

  const favoritesCount = useMemo(() => items.filter(i => i.is_favorite).length, [items]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#171717]">
      <Navbar 
        onSearch={setSearchQuery} 
        onOpenAddModal={() => setIsAddModalOpen(true)} 
        isAdmin={isAdmin}
      />

      <main className="max-w-[1440px] mx-auto px-3 py-16">
        <section className="mb-20">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.9] mb-8 max-w-xl text-[#171717]">
                A selection of things <br /> worth watching.
              </h1>
              <p className="text-[14px] text-neutral-600 leading-relaxed max-w-md">
              From under-the-radar finds to classic favorites, it's a simple, no-fuss list for anyone looking for something good to watch.
              </p>
            </div>
            {isAdmin && (
              <div className="bg-white border border-black/5 p-6 shadow-sm flex flex-col gap-4 animate-in slide-in-from-top-2 duration-500 w-full md:w-auto min-w-[320px]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Inventory Status</span>
                    <div className="text-3xl font-bold tracking-tighter">{items.length} Items</div>
                    <div className="flex items-center gap-2 text-[10px] text-black/40 font-bold uppercase mt-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {favoritesCount} Favorites
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${isUsingDemoData ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                    {isUsingDemoData ? 'Demo Mode' : 'Live Sync'}
                  </div>
                </div>

                {isUsingDemoData ? (
                  <div className="pt-4 border-t border-black/5">
                    <p className="text-[11px] text-neutral-500 mb-3 leading-snug">
                      Your database is currently empty. Initialize it with the sample set?
                    </p>
                    <button 
                      onClick={handleBootstrap}
                      disabled={isBootstrapping}
                      className="w-full bg-black text-white py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all disabled:bg-neutral-200"
                    >
                      {isBootstrapping ? (
                        <span className="animate-pulse">Writing to Cloud...</span>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          Bootstrap Database
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-black/5 flex flex-col gap-3">
                    <p className="text-[11px] text-green-600/60 font-medium flex items-center gap-1.5">
                      <Cloud className="w-3 h-3" />
                      Securely connected to Supabase
                    </p>
                    <button 
                      onClick={handleClearDatabase}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 flex items-center gap-2 transition-colors self-start"
                    >
                      <Trash2 className="w-3 h-3" />
                      Wipe Database
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-8 mb-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {(['All', 'Movies', 'TV Series', 'Favorites'] as Category[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-none text-[12px] font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                    activeCategory === cat 
                      ? 'bg-black text-white' 
                      : 'bg-white text-[#737373] hover:bg-neutral-50 hover:text-black border border-black/5 shadow-sm'
                  }`}
                >
                  {cat === 'Favorites' && <Star className={`w-3 h-3 ${activeCategory === 'Favorites' ? 'fill-white text-white' : 'text-neutral-400'}`} />}
                  {cat}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
              {isUsingDemoData ? <AlertCircle className="w-3 h-3" /> : <Database className="w-3 h-3" />}
              {isUsingDemoData ? 'Viewing Local Samples' : 'Live Records'}
            </div>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto pb-4 border-b border-black/5">
            {GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`text-[12px] font-bold transition-all whitespace-nowrap ${
                  activeGenre === genre ? 'text-black' : 'text-neutral-400 hover:text-black'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {isInitialLoad ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-500 text-[12px] uppercase tracking-widest font-bold">Synchronizing Database...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
            {filteredItems.map(item => (
              <MovieCard 
                key={item.id} 
                item={item} 
                onClick={setSelectedItem}
                isAdmin={isAdmin}
                onDelete={handleDeleteItem}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-black/10">
            <p className="text-neutral-500 text-[14px]">No matches for your current selection.</p>
            <button 
              onClick={() => { setActiveCategory('All'); setActiveGenre('All'); setSearchQuery(''); }}
              className="mt-4 text-black text-[12px] font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

      <MovieModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      
      {isAdmin && (
        <AddContentModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddItem}
        />
      )}

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast key={toast.id} message={toast} onClose={removeToast} />
        ))}
      </div>

      <footer className="border-t border-black/5 mt-32 py-16 px-3 bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="text-black font-bold text-lg mb-2 tracking-tight">Videoteka</div>
            <p className="text-[11px] text-neutral-400 font-medium">© {new Date().getFullYear()} — Curated with passion.</p>
          </div>
          <div className="flex items-center gap-10 text-[12px] font-bold text-neutral-500">
            {isAdmin ? (
              <button onClick={handleLogout} className="text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest text-[10px] font-bold">
                Exit Management
              </button>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="hover:text-black transition-colors uppercase tracking-widest text-[10px]">
                Admin Login
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
