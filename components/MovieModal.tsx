import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types';
import { X, Share2, Clock, List, Play, Check, RefreshCw, Loader2, Star } from 'lucide-react';
import { fetchMovieDetails } from '../services/geminiService';
import { getSlug } from '../utils';

interface MovieModalProps {
  item: MediaItem | null;
  onClose: () => void;
  isAdmin?: boolean;
  onUpdate?: (item: MediaItem) => void;
  onToast?: (msg: any, type: 'success' | 'info' | 'error') => void;
}

const MovieModal: React.FC<MovieModalProps> = ({ item, onClose, isAdmin, onUpdate, onToast }) => {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (item) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setCopied(false);
      setIsRefreshing(false);
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [item]);

  if (!item) return null;

  const handleShare = async () => {
    const slug = getSlug(item.title);
    const shareUrl = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (onToast) onToast('Link copied!', 'success');
      setTimeout(() => setCopied(false), 2000);
      if (navigator.share) {
        await navigator.share({ title: item.title, text: `Check out ${item.title}`, url: shareUrl }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const handleRefresh = async () => {
    if (!isAdmin || !onUpdate) return;
    setIsRefreshing(true);
    if (onToast) onToast(`Updating metadata...`, 'info');
    try {
      const freshDetails = await fetchMovieDetails(item.title);
      if (freshDetails) {
        const updated = { ...item, ...freshDetails, id: item.id, is_favorite: item.is_favorite } as MediaItem;
        onUpdate(updated);
        if (onToast) onToast('Refresh complete.', 'success');
      } else {
        throw new Error("Sync failed.");
      }
    } catch (err: any) {
      if (onToast) onToast(err, 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/5 border border-black/5 hover:bg-black/10">
          <X className="w-5 h-5 text-black" />
        </button>

        {/* Poster Section */}
        <div className="w-full md:w-2/5 h-64 md:h-auto relative">
          <img src={item.poster} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent md:hidden" />
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-black" />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 p-8 md:p-14 overflow-y-auto bg-white text-black text-xs">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8">
            <span className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-widest border border-black/5">
              {item.type}
            </span>
            
            <span className="text-black/60 text-[12px] font-bold">{item.year}</span>

            {item.runtime && (
              <div className="flex items-center gap-1.5 text-black/60 text-sm">
                <Clock className="w-4 h-4" />
                <span className="font-bold text-[12px]">{item.runtime}</span>
              </div>
            )}
            
            {item.seasons && (
              <div className="flex items-center gap-1.5 text-black/60 text-sm">
                <List className="w-4 h-4" />
                <span className="font-bold text-[12px]">{item.seasons} Seasons</span>
              </div>
            )}

            {item.is_favorite && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-400 text-black rounded-sm">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-wider">Top Pick</span>
              </div>
            )}

            {isAdmin && (
               <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 text-black/40 hover:text-black disabled:opacity-30">
                 <RefreshCw className="w-3.5 h-3.5" />
                 <span className="text-[10px] uppercase font-bold border-b border-black/10">Sync Data</span>
               </button>
            )}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter leading-none">{item.title}</h1>

          <div className="flex flex-wrap gap-2 mb-10">
            {item.genre.map(g => <span key={g} className="px-3 py-1 bg-black/5 border border-black/5 text-black text-[10px] font-bold uppercase tracking-widest">{g}</span>)}
          </div>

          <p className="text-xl text-black/70 leading-relaxed mb-12 max-w-3xl">{item.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-14 text-sm border-b border-black/5 pb-12">
            <div>
              <h4 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-4">Director</h4>
              <p className="text-black font-bold text-lg">{item.director || 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-black/40 uppercase tracking-widest text-[10px] font-bold mb-4">Principal Cast</h4>
              <p className="text-black font-bold text-lg leading-snug">{item.cast.join(', ')}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {item.trailerUrl && (
              <a href={item.trailerUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-black hover:bg-neutral-800 text-white px-8 py-4 font-bold text-xs uppercase tracking-widest shadow-xl">
                <Play className="w-5 h-5 fill-current" /> Watch Trailer
              </a>
            )}
            <button className={`flex items-center justify-center gap-3 px-6 py-4 font-bold text-xs uppercase tracking-widest ${copied ? 'bg-green-500 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}`} onClick={handleShare}>
              {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              {copied ? 'Copied' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;