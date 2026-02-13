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
import { Loader2, Lock, LogOut } from 'lucide-react';
import { getSlug, isUUID } from './utils';

const STORAGE_KEY = 'videoteka_bauhaus_v2';

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
    let text = typeof msg === 'string' ? msg : msg?.message || 'Action failed';
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
        setItems(data.map(i => ({ ...i, is_favorite: !!i.is_favorite })));
        setIsUsingDemoData(false);
      } else {
        setIsUsingDemoData(true);
      }
    } catch (err: any) {
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

  const handleSelectItem = useCallback((item: MediaItem | null) => {
    setSelectedItem(item);
    if (item) {
      window.history.pushState({ itemId: item.id }, '', `/${getSlug(item.title)}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  }, []);

  const handleAddItem = async (newItem: MediaItem) => {
    try {
      if (!isAdmin || isUsingDemoData) {
        // Local only fallback
        const itemWithId = { ...newItem, id: Math.random().toString(36).substr(2, 9) };
        setItems(prev => [itemWithId, ...prev]);
        addToast('ENTRY_CREATED_LOCAL');
        return;
      }

      // If ID isn't a UUID, remove it so Supabase can generate one
      const { id, ...dataToInsert } = newItem;
      const finalData = isUUID(id) ? newItem : dataToInsert;

      const { error } = await supabase
        .from('media_items')
        .insert([finalData]);

      if (error) throw error;

      addToast('ENTRY_INDEXED');
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'FAILED_TO_INDEX', 'error');
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Confirm deletion of this record?')) return;

    try {
      if (!isAdmin || isUsingDemoData || !isUUID(id)) {
        setItems(prev => prev.filter(i => i.id !== id));
        addToast('ENTRY_REMOVED_LOCAL');
        return;
      }

      const { error } = await supabase
        .from('media_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addToast('ENTRY_DELETED');
      fetchData();
    } catch (err: any) {
      addToast(err.message || 'DELETE_FAILED', 'error');
    }
  };

  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    const newStatus = !item.is_favorite;
    
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_favorite: newStatus } : i));
    if (!isAdmin || isUsingDemoData || !isUUID(id)) return;

    try {
      await supabase.from('media_items').update({ is_favorite: newStatus }).eq('id', id);
      addToast(newStatus ? 'MOD_FAV_ENABLED' : 'MOD_FAV_DISABLED');
    } catch (err) {
      addToast('SYNC_ERROR', 'error');
    }
  };

  const filteredItems = useMemo(() => {
    const filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenre = activeGenre === 'All' || item.genre.some(g => g === activeGenre);
      let matchesCategory = true;
      if (activeCategory === 'Movies') matchesCategory = item.type === 'Movie';
      else if (activeCategory === 'TV Series') matchesCategory = item.type === 'TV Series';
      else if (activeCategory === 'Favorites') matchesCategory = !!item.is_favorite;
      return matchesSearch && matchesGenre && matchesCategory;
    });

    // Favorites always first, maintaining the existing relative (chronological) order
    return [...filtered].sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0; // Keep relative order from 'items' state (which is date-sorted from Supabase)
    });
  }, [items, activeCategory, activeGenre, searchQuery]);

  return (
    <div className="min-h-screen pb-32">
      <Navbar onSearch={setSearchQuery} onOpenAddModal={() => setIsAddModalOpen(true)} isAdmin={isAdmin} />
      
      <main className="max-w-[1440px] mx-auto px-6 py-8 md:py-24">
        {/* Asymmetric Bauhaus Header */}
        <section className="mb-20 md:mb-32 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          <div className="md:col-span-8">
            <h1 className="text-5xl md:text-[9rem] font-black uppercase tracking-tighter leading-[0.8] mb-6 md:mb-8">
              things worth<br />
              <span className="text-[#E30613]">watching.</span>
            </h1>
            <div className="h-2 md:h-3 w-32 md:w-48 bg-[#005A9C] mb-6 md:mb-8" />
            <p className="max-w-xl text-lg md:text-xl font-bold uppercase leading-tight tracking-tight">
              a selection of cinema and episodic storytelling <br className="hidden md:block" />
              curated for visual and narrative excellence.
            </p>
          </div>
          <div className="md:col-span-4 flex flex-col justify-end">
             <div className="border-l-4 md:border-l-8 border-black pl-6 md:pl-8 py-4">
                <span className="mono text-[10px] md:text-sm font-black uppercase tracking-[0.3em] text-[#005A9C]">Archive_Index</span>
                <div className="text-2xl md:text-4xl font-black mt-2">V.3_2024</div>
             </div>
          </div>
        </section>

        {/* Modular Navigation Tabs */}
        <div className="flex flex-col gap-10 mb-20 md:mb-24 sticky top-20 md:top-24 z-40 bg-white/90 backdrop-blur-md py-6 border-y-2 border-black">
          <div className="flex flex-wrap items-center gap-2">
            {(['All', 'Movies', 'TV Series', 'Favorites'] as Category[]).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 md:px-8 py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest border-2 border-black transition-all ${activeCategory === cat ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#FFD700]'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-8 md:gap-10 overflow-x-auto scrollbar-hide pb-2">
            {GENRES.map(genre => (
              <button 
                key={genre} 
                onClick={() => setActiveGenre(genre)} 
                className={`mono text-[10px] md:text-[11px] font-bold uppercase tracking-tighter whitespace-nowrap transition-colors ${activeGenre === genre ? 'text-[#E30613] border-b-2 border-[#E30613] pb-1' : 'text-neutral-300 hover:text-black'}`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* The Grid: Asymmetric & Dense */}
        {isInitialLoad ? (
          <div className="py-48 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-[#005A9C]" />
            <p className="mono text-[11px] font-black uppercase tracking-widest">Compiling_Geometry...</p>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-16 md:gap-12">
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
          <div className="py-32 md:py-48 flex flex-col items-center border-4 border-black bg-[#F9F9F9]">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-[#E30613] mb-8 rotate-45" />
            <p className="mono font-black uppercase tracking-[0.5em] text-lg md:text-2xl">Null_Result</p>
          </div>
        )}
      </main>

      <MovieModal 
        item={selectedItem} 
        onClose={() => handleSelectItem(null)} 
        isAdmin={isAdmin} 
        onUpdate={(updated) => setItems(prev => prev.map(i => i.id === updated.id ? updated : i))}
        onToast={addToast}
      />
      
      {isAdmin && <AddContentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddItem} />}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />

      <div className="fixed bottom-12 right-12 z-[200] flex flex-col gap-4">
        {toasts.map(toast => <Toast key={toast.id} message={toast} onClose={removeToast} />)}
      </div>

      <footer className="mt-64 border-t-8 border-black bg-white pt-24 pb-48 px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFD700] -mr-32 -mt-32 rounded-full opacity-10" />
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-24">
          <div>
             <span className="mono text-[10px] font-bold uppercase tracking-[0.8em] text-neutral-400">Videoteka // Archival Structure</span>
          </div>
          <div className="flex flex-col justify-between items-start md:items-end gap-12">
             <div className="flex flex-col gap-4 md:items-end">
                {!isAdmin ? (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)} 
                    className="flex items-center gap-3 text-neutral-400 hover:text-black transition-colors px-2 py-4"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="mono text-[11px] font-black uppercase tracking-[0.4em]">Sys_Login</span>
                  </button>
                ) : (
                  <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="flex items-center gap-3 text-[#E30613] hover:text-black transition-colors px-2 py-4"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="mono text-[11px] font-black uppercase tracking-[0.4em]">Terminate_Session</span>
                  </button>
                )}
             </div>
            <div className="flex gap-4">
               <div className="w-8 h-8 bg-[#E30613]" />
               <div className="w-8 h-8 bg-[#005A9C]" />
               <div className="w-8 h-8 bg-[#FFD700]" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;