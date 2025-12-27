
import React, { useEffect, useState } from 'react';
import { MediaItem } from '../types';
import { X, Share2, TrendingUp, Users, Clock, List, Play, Check, RefreshCw, Loader2 } from 'lucide-react';
import { fetchMovieDetails } from '../services/geminiService';

interface MovieModalProps {
  item: MediaItem | null;
  onClose: () => void;
  isAdmin?: boolean;
  onUpdate?: (item: MediaItem) => void;
  onToast?: (msg: string, type: 'success' | 'info' | 'error') => void;
}

const getSlug = (title: string) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

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
      if (onToast) onToast('Link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);

      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `Check out ${item.title} on Videoteka`,
          url: shareUrl,
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  const handleRefresh = async () => {
    if (!isAdmin || !onUpdate) return;
    
    setIsRefreshing(true);
    if (onToast) onToast(`Refreshing metadata for ${item.title}...`, 'info');

    try {
      const freshDetails = await fetchMovieDetails(item.title);
      if (freshDetails) {
        // Merge the fresh details with current ID and favorite status
        const updated = {
          ...item,
          ...freshDetails,
          id: item.id,
          is_favorite: item.is_favorite
        } as MediaItem;
        
        onUpdate(updated);
        if (onToast) onToast('Metadata updated successfully!', 'success');
      } else {
        throw new Error("Could not fetch new data.");
      }
    } catch (err: any) {
      if (onToast) onToast(err.message || 'Refresh failed.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Content Container */}
      <div className="relative w-full max-w-6xl bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-2 rounded-full bg-black/5 backdrop-blur-md border border-black/5 hover:bg-black/10 transition-colors"
        >
          <X className="w-5 h-5 text-black" />
        </button>

        {/* Left: Image */}
        <div className="w-full md:w-2/5 h-64 md:h-auto relative">
          <img 
            src={item.poster} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent md:hidden" />
          
          {isRefreshing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-black animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-black">Syncing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Content */}
        <div className="flex-1 p-8 md:p-14 overflow-y-auto bg-white text-black">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-8">
            <span className="px-3 py-1 rounded-full bg-black/5 text-[10px] font-bold uppercase tracking-widest border border-black/5">
              {item.type}
            </span>
            
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <TrendingUp className="w-4 h-4 text-red-500" />
              <span className="text-[10px] uppercase font-bold text-neutral-400">Critics:</span>
              <span className="text-sm font-bold">{item.tomatoMeter || 'N/A'}</span>
            </div>

            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] uppercase font-bold text-neutral-400">Audience:</span>
              <span className="text-sm font-bold">{item.audienceScore || 'N/A'}</span>
            </div>

            {isAdmin && (
               <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-black hover:text-neutral-500 transition-colors disabled:opacity-30"
                title="Refresh scores and data"
               >
                 <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                 <span className="text-[10px] uppercase font-bold border-b border-black/10">Refresh Data</span>
               </button>
            )}

            {item.runtime && (
              <div className="flex items-center gap-1.5 text-black/60 text-sm whitespace-nowrap">
                <Clock className="w-4 h-4" />
                <span className="font-bold text-[12px]">{item.runtime}</span>
              </div>
            )}
            
            {item.seasons && (
              <div className="flex items-center gap-1.5 text-black/60 text-sm whitespace-nowrap">
                <List className="w-4 h-4" />
                <span className="font-bold text-[12px]">{item.seasons} Seasons</span>
              </div>
            )}
            
            <span className="text-black/60 text-[12px] font-bold whitespace-nowrap">{item.year}</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tighter text-black leading-none">
            {item.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-10">
            {item.genre.map(g => (
              <span key={g} className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                {g}
              </span>
            ))}
          </div>

          <p className="text-xl text-black/70 leading-relaxed mb-12 max-w-3xl">
            {item.description}
          </p>

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

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            {item.trailerUrl && (
              <a 
                href={item.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 bg-black hover:bg-neutral-800 transition-all text-white px-8 py-4 font-bold text-xs uppercase tracking-widest shadow-xl"
              >
                <Play className="w-5 h-5 fill-current" />
                Watch Trailer
              </a>
            )}
            
            <button 
              className={`flex items-center justify-center gap-3 transition-all px-6 py-4 font-bold text-xs uppercase tracking-widest ${copied ? 'bg-green-500 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-black'}`}
              onClick={handleShare}
            >
              {copied ? <Check className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
              {copied ? 'Copied Link' : 'Share this find'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieModal;
