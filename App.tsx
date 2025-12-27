
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import MovieCard from './components/MovieCard';
import MovieModal from './components/MovieModal';
import AddContentModal from './components/AddContentModal';
import LoginModal from './components/LoginModal';
import Toast, { ToastMessage } from './components/Toast';
import { INITIAL_DATA, GENRES } from './constants';
import { MediaItem, Category } from './types';
import { supabase } from './services/supabaseClient';
import { Database, Cloud, AlertCircle, Sparkles, Star, Trash2, Terminal } from 'lucide-react';

const STORAGE_KEY = 'videoteka_items_v2';

const getSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const App: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>(() => {
    // Initial load from LocalStorage for immediate UI
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  });
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

  const addToast = useCallback((msg: any, type: 'success' | 'info' | 'error' = 'success') => {
    let text = 'An unknown error occurred';
    if (typeof msg === 'string') {
      text = msg;
    } else if (msg && typeof msg === 'object') {
      if (msg.message?.includes("is_favorite") || msg.details?.includes("is_favorite")) {
        text = "Database Error: The 'is_favorite' column is missing. Use the 'Setup SQL' button in Admin panel.";
      } else {
        text = msg.message || msg.error_description || msg.details || JSON.stringify(msg);
      }
    }

    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Persist to LocalStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const fetchData = useCallback(async () => {
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
        // If Supabase is connected but table empty, keep LocalStorage/INITIAL data but flag it
        setIsUsingDemoData(true);
      }

      // Handle deep linking on initial fetch
      const path = window.location.pathname.slice(1);
      if (path && path !== '') {
        const currentItems = data && data.length > 0 ? data : items;
        const linkedItem = currentItems.find(i => getSlug(i.title) === path);
        if (linkedItem) setSelectedItem(linkedItem);
      }
    } catch (err: any) {
      console.warn("Fetch issue:", err);
      setIsUsingDemoData(true);
    } finally {
      setIsInitialLoad(false);
    }
  }, [items]);

  useEffect(() => {
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAdmin(!!session);
    });

    const handlePopState = () => {
      const path = window.location.pathname.slice(1);
      if (!path) {
        setSelectedItem(null);
      } else {
        setItems(prev => {
           const linkedItem = prev.find(i => getSlug(i.title) === path);
           if (linkedItem) setSelectedItem(linkedItem);
           return prev;
        });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
    };
  }, [fetchData]);

  const handleSelectItem = useCallback((item: MediaItem | null) => {
    setSelectedItem(item);
    if (item) {
      const slug = getSlug(item.title);
      window.history.pushState({ itemId: item.id }, '', `/${slug}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleAddItem = async (newItem: MediaItem) => {
    try {
      const { id, ...itemToInsert } = newItem;
      const finalItem = { ...itemToInsert, is_favorite: false };
      
      const { data, error } = await supabase
        .from('media_items')
        .insert([finalItem])
        .select();

      if (error) throw error;

      if (data) {
        setItems(prev => [data[0], ...prev]);
        setIsUsingDemoData(false);
        addToast(`${newItem.title} added.`);
      }
    } catch (err: any) {
      // Local fallback if DB fails
      const localItem = { ...newItem, id: Math.random().toString(36).substr(2, 9), is_favorite: false };
      setItems(prev => [localItem, ...prev]);
      addToast('Added locally (Supabase Sync Failed)', 'info');
    }
  };

  const handleUpdateItem = async (updatedItem: MediaItem) => {
    const { id, ...updates } = updatedItem;
    
    if (isUsingDemoData) {
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
      setSelectedItem(updatedItem);
      addToast('Metadata updated locally.', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
      setSelectedItem(updatedItem);
      addToast('Metadata updated.');
    } catch (err: any) {
      addToast(err, 'error');
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newFavStatus = !item.is_favorite;

    // Apply local state update immediately for snappy UI
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: newFavStatus } : i));

    if (isUsingDemoData) {
      addToast(newFavStatus ? 'Added to favorites (Local).' : 'Removed from favorites (Local).', 'info');
      return;
    }

    if (!isAdmin) {
      addToast('Admin login required to save to database.', 'info');
      return;
    }

    try {
      const { error } = await supabase
        .from('media_items')
        .update({ is_favorite: newFavStatus })
        .eq('id', id);

      if (error) throw error;
      addToast(newFavStatus ? 'Added to favorites.' : 'Removed from favorites.');
    } catch (err: any) {
      addToast(err, 'error');
    }
  };

  const handleCopySQL = () => {
    const sql = `ALTER TABLE media_items ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;`;
    navigator.clipboard.writeText(sql);
    addToast("SQL command copied!", "success");
  };

  const handleBootstrap = async () => {
    if (!isAdmin) return;
    setIsBootstrapping(true);
    addToast('Initializing database...', 'info');

    try {
      const itemsToBootstrap = INITIAL_DATA.map(({ id, ...rest }) => ({
        ...rest,
        is_favorite: false
      }));

      const { error } = await supabase
        .from('media_items')
        .insert(itemsToBootstrap);

      if (error) throw error;

      addToast('Database initialized!', 'success');
      await fetchData();
    } catch (err: any) {
      addToast(err, 'error');
    } finally {
      setIsBootstrapping(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!isAdmin || isUsingDemoData) return;
    if (!window.confirm('Wipe everything?')) return;

    try {
      const { error } = await supabase.from('media_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setItems(INITIAL_DATA);
      setIsUsingDemoData(true);
      addToast('Database wiped.');
    } catch (err: any) {
      addToast(err, 'error');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUsingDemoData) {
      setItems(prev => prev.filter(item => item.id !== id));
      return;
    }
    if (window.confirm('Permanently delete?')) {
      try {
        const { error } = await supabase.from('media_items').delete().eq('id', id);
        if (error) throw error;
        setItems(prev => prev.filter(item => item.id !== id));
        addToast('Deleted.');
      } catch (err: any) {
        addToast(err, 'error');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    addToast('Logged out.', 'info');
  };

  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (activeCategory === 'Movies') {
        matchesCategory = item.type === 'Movie';
      } else if (activeCategory === 'TV Series') {
        matchesCategory = item.type === 'TV Series';
      } else if (activeCategory === 'Favorites') {
        matchesCategory = !!item.is_favorite;
      }

      const matchesGenre = activeGenre === 'All' || item.genre.includes(activeGenre);
      return matchesSearch && matchesCategory && matchesGenre;
    });

    // Priority Sorting: Favorites first, then rest
    return [...filtered].sort((a, b) => {
      const favA = !!a.is_favorite;
      const favB = !!b.is_favorite;
      if (favA === favB) return 0;
      return favA ? -1 : 1;
    });
  }, [items, activeCategory, activeGenre, searchQuery]);

  const favoritesCount = useMemo(() => items.filter(i => !!i.is_favorite).length, [items]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#171717]">
      <Navbar onSearch={setSearchQuery} onOpenAddModal={() => setIsAddModalOpen(true)} isAdmin={isAdmin} />

      <main className="max-w-[1440px] mx-auto px-3 py-16">
        <section className="mb-20">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-12">
            <div className="flex-1">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.9] mb-8 max-w-xl">
                A selection of things <br /> worth watching.
              </h1>
              <p className="text-[14px] text-neutral-600 leading-relaxed max-w-md">
                Simple, curated, and without the noise. No scores, no ratings, just the essentials.
              </p>
            </div>
            {isAdmin && (
              <div className="bg-white border border-black/5 p-6 shadow-sm flex flex-col gap-4 w-full md:w-auto min-w-[320px]">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Inventory</span>
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

                <div className="pt-4 border-t border-black/5 flex flex-col gap-2">
                  {isUsingDemoData ? (
                    <button onClick={handleBootstrap} disabled={isBootstrapping} className="w-full bg-black text-white py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:bg-neutral-200">
                      {isBootstrapping ? 'Initializing...' : <><Sparkles className="w-3 h-3" /> Bootstrap Database</>}
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button onClick={handleCopySQL} className="w-full bg-neutral-100 text-black py-3 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-200 transition-colors">
                        <Terminal className="w-3.5 h-3.5" /> Setup SQL Helper
                      </button>
                      <button onClick={handleClearDatabase} className="text-[10px] font-bold uppercase tracking-widest text-red-500/50 hover:text-red-500 flex items-center gap-2 transition-colors">
                        <Trash2 className="w-3 h-3" /> Wipe Records
                      </button>
                    </div>
                  )}
                </div>
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
                  className={`px-5 py-2 text-[12px] font-bold transition-all whitespace-nowrap flex items-center gap-2 ${activeCategory === cat ? 'bg-black text-white' : 'bg-white text-[#737373] border border-black/5'}`}
                >
                  {cat === 'Favorites' && <Star className={`w-3 h-3 ${activeCategory === 'Favorites' ? 'fill-white' : ''}`} />}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 overflow-x-auto pb-4 border-b border-black/5">
            {GENRES.map(genre => (
              <button key={genre} onClick={() => setActiveGenre(genre)} className={`text-[12px] font-bold whitespace-nowrap ${activeGenre === genre ? 'text-black' : 'text-neutral-400 hover:text-black'}`}>
                {genre}
              </button>
            ))}
          </div>
        </div>

        {isInitialLoad ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-500 text-[10px] uppercase font-bold tracking-widest">Syncing...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-4">
            {filteredItems.map(item => (
              <MovieCard key={item.id} item={item} onClick={handleSelectItem} isAdmin={isAdmin} onDelete={handleDeleteItem} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-black/10">
            <p className="text-neutral-500 text-[14px]">
              {activeCategory === 'Favorites' ? "You haven't favorited anything yet." : "Empty set."}
            </p>
          </div>
        )}
      </main>

      <MovieModal item={selectedItem} onClose={() => handleSelectItem(null)} isAdmin={isAdmin} onUpdate={handleUpdateItem} onToast={addToast} />
      {isAdmin && <AddContentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddItem} />}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-2">
        {toasts.map(toast => <Toast key={toast.id} message={toast} onClose={removeToast} />)}
      </div>

      <footer className="border-t border-black/5 mt-32 py-16 px-3 bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-black font-bold text-lg">Videoteka</div>
          <button onClick={isAdmin ? handleLogout : () => setIsLoginModalOpen(true)} className="text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100">
            {isAdmin ? 'Exit Admin' : 'Admin Login'}
          </button>
        </div>
      </footer>
    </div>
  );
};

export default App;
