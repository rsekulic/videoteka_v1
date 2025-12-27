
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
import { Star, Loader2, Lock } from 'lucide-react';

const STORAGE_KEY = 'videoteka_v3_core';

// Helper to check if a string is a valid UUID
const isUUID = (str: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

const getSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

const App: React.FC = () => {
  const [items, setItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
      return INITIAL_DATA;
    }
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

  const addToast = useCallback((msg: any, type: 'success' | 'info' | 'error' = 'success') => {
    let text = typeof msg === 'string' ? msg : msg?.message || 'Update failed';
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, text, type }]);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
        const normalizedData = data.map(item => ({
          ...item,
          is_favorite: !!item.is_favorite
        }));
        setItems(normalizedData);
        setIsUsingDemoData(false);
      } else {
        setIsUsingDemoData(true);
      }
    } catch (err: any) {
      console.warn("Sync issue:", err);
      setIsUsingDemoData(true);
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(!!session);
    });
    return () => subscription.unsubscribe();
  }, [fetchData]);

  useEffect(() => {
    if (isInitialLoad) return;
    const path = window.location.pathname.slice(1);
    if (path) {
      const linked = items.find(i => getSlug(i.title) === path);
      if (linked) setSelectedItem(linked);
    }
  }, [isInitialLoad, items]);

  const handleSelectItem = useCallback((item: MediaItem | null) => {
    setSelectedItem(item);
    if (item) {
      window.history.pushState({ itemId: item.id }, '', `/${getSlug(item.title)}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newFavStatus = !item.is_favorite;

    // 1. Optimistic Update (UI feels fast)
    setItems(prevItems => prevItems.map(i => i.id === id ? { ...i, is_favorite: newFavStatus } : i));
    
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, is_favorite: newFavStatus } : null);
    }

    // 2. Cloud Sync logic
    // We only attempt sync if it's a valid UUID (meaning it's in Supabase)
    if (isUsingDemoData || !isUUID(id)) {
      addToast(newFavStatus ? 'Added to local favorites' : 'Removed from local favorites', 'info');
      return;
    }

    if (!isAdmin) {
      addToast('Admin login required to sync with cloud.', 'info');
      // Revert if not admin but trying to sync
      setItems(prevItems => prevItems.map(i => i.id === id ? { ...i, is_favorite: !newFavStatus } : i));
      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, is_favorite: !newFavStatus } : null);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('media_items')
        .update({ is_favorite: newFavStatus })
        .eq('id', id);

      if (error) throw error;
      addToast(newFavStatus ? 'Synced to cloud' : 'Removed from cloud');
    } catch (err: any) {
      // Revert state on actual API failure
      setItems(prevItems => prevItems.map(i => i.id === id ? { ...i, is_favorite: !newFavStatus } : i));
      if (selectedItem?.id === id) {
        setSelectedItem(prev => prev ? { ...prev, is_favorite: !newFavStatus } : null);
      }
      addToast('Sync failed: ' + err.message, 'error');
    }
  };

  const handleUpdateItem = async (updatedItem: MediaItem) => {
    const { id, ...updates } = updatedItem;
    setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
    setSelectedItem(updatedItem);

    if (isUsingDemoData || !isUUID(id)) return;

    try {
      const { error } = await supabase.from('media_items').update(updates).eq('id', id);
      if (error) throw error;
      addToast('Metadata synced');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const handleAddItem = async (newItem: MediaItem) => {
    try {
      const { id: _id, ...toInsert } = { ...newItem, is_favorite: false };
      const { data, error } = await supabase.from('media_items').insert([toInsert]).select();
      if (error) throw error;
      if (data) {
        setItems(prev => [data[0], ...prev]);
        setIsUsingDemoData(false);
        addToast(`${newItem.title} added to cloud`);
      }
    } catch (err) {
      const local = { ...newItem, id: Math.random().toString(36).substr(2, 9), is_favorite: false };
      setItems(prev => [local, ...prev]);
      addToast('Added locally (Cloud offline)', 'info');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this entry?')) return;
    
    setItems(prev => prev.filter(i => i.id !== id));
    if (isUsingDemoData || !isUUID(id)) return;

    try {
      const { error } = await supabase.from('media_items').delete().eq('id', id);
      if (error) throw error;
      addToast('Deleted from cloud');
    } catch (err: any) {
      addToast(err.message, 'error');
    }
  };

  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Fix for Sci-Fi including Science Fiction tags
      let matchesGenre = activeGenre === 'All';
      if (!matchesGenre) {
        if (activeGenre === 'Sci-Fi') {
          matchesGenre = item.genre.includes('Sci-Fi') || item.genre.includes('Science Fiction');
        } else {
          matchesGenre = item.genre.includes(activeGenre);
        }
      }
      
      let matchesCategory = true;
      if (activeCategory === 'Movies') matchesCategory = item.type === 'Movie';
      else if (activeCategory === 'TV Series') matchesCategory = item.type === 'TV Series';
      else if (activeCategory === 'Favorites') matchesCategory = !!item.is_favorite;

      return matchesSearch && matchesGenre && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      const favA = a.is_favorite ? 1 : 0;
      const favB = b.is_favorite ? 1 : 0;
      if (favA !== favB) return favB - favA;
      return a.title.localeCompare(b.title);
    });
  }, [items, activeCategory, activeGenre, searchQuery]);

  const favoritesCount = useMemo(() => items.filter(i => !!i.is_favorite).length, [items]);

  return (
    <div className="min-h-screen bg-[#f7f7f7] text-[#171717]">
      <Navbar onSearch={setSearchQuery} onOpenAddModal={() => setIsAddModalOpen(true)} isAdmin={isAdmin} />

      <main className="max-w-[1440px] mx-auto px-3 py-16">
        <section className="mb-20 flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="flex-1">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tighter leading-[0.9] mb-8">
              A selection of things <br /> worth watching.
            </h1>
            <p className="text-[14px] text-neutral-600 leading-relaxed max-w-md">
              From under-the-radar finds to classic favorites, it's a simple, no-fuss list for anyone looking for something good to watch.
            </p>
          </div>
          
          {isAdmin && (
            <div className="bg-white border border-black/5 p-6 shadow-sm min-w-[280px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Database Sync</span>
              <div className="text-3xl font-bold tracking-tighter my-1">{items.length} Items</div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-600 uppercase">
                <Star className="w-3 h-3 fill-current" /> {favoritesCount} Favorites
              </div>
              <div className="mt-4 pt-4 border-t border-black/5">
                 <button onClick={() => fetchData()} className="w-full bg-neutral-100 text-[10px] font-bold uppercase py-2 hover:bg-neutral-200 transition-colors">Force Refresh</button>
              </div>
            </div>
          )}
        </section>

        <div className="flex flex-col gap-8 mb-16">
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {(['All', 'Movies', 'TV Series', 'Favorites'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 text-[12px] font-bold transition-all flex items-center gap-2 ${activeCategory === cat ? 'bg-black text-white' : 'bg-white text-neutral-500 border border-black/5'}`}
              >
                {cat === 'Favorites' && <Star className={`w-3 h-3 ${activeCategory === 'Favorites' ? 'fill-white' : ''}`} />}
                {cat}
              </button>
            ))}
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
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4 opacity-20" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">Loading Directory...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-2 gap-y-8">
            {filteredItems.map(item => (
              <MovieCard 
                key={item.id} 
                item={item} 
                onClick={handleSelectItem} 
                isAdmin={isAdmin} 
                onDelete={handleDeleteItem} 
                onToggleFavorite={handleToggleFavorite} 
              />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-black/10">
            <p className="text-neutral-400 text-sm">No results found.</p>
          </div>
        )}
      </main>

      <MovieModal 
        item={selectedItem} 
        onClose={() => handleSelectItem(null)} 
        isAdmin={isAdmin} 
        onUpdate={handleUpdateItem} 
        onToast={addToast} 
      />
      {isAdmin && <AddContentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddItem} />}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-2">
        {toasts.map(toast => <Toast key={toast.id} message={toast} onClose={removeToast} />)}
      </div>

      <footer className="border-t border-black/5 mt-32 py-16 px-3 bg-white">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-black font-bold text-lg">Videoteka</div>
          <button 
            onClick={() => isAdmin ? supabase.auth.signOut() : setIsLoginModalOpen(true)} 
            className="text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100"
          >
            {isAdmin ? 'Logout' : 'Admin Login'}
          </button>
        </div>
      </footer>

      {!isAdmin && (
        <button onClick={() => setIsLoginModalOpen(true)} className="fixed bottom-6 left-6 text-neutral-200 hover:text-black transition-colors">
          <Lock className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default App;
