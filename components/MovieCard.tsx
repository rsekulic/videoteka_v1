
import React from 'react';
import { Trash2, Star } from 'lucide-react';
import { MediaItem } from '../types';

interface MovieCardProps {
  item: MediaItem;
  onClick: (item: MediaItem) => void;
  isAdmin?: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onToggleFavorite?: (id: string, e: React.MouseEvent) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ item, onClick, isAdmin, onDelete, onToggleFavorite }) => {
  return (
    <div 
      className="flex flex-col gap-3 w-full cursor-pointer group relative"
      onClick={() => onClick(item)}
      style={{ height: 'min-content', overflow: 'visible' }}
    >
      {/* Admin Actions */}
      {isAdmin && (
        <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
          {onDelete && (
            <button
              onClick={(e) => onDelete(item.id, e)}
              className="p-2 bg-white/90 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white transition-all border border-black/5"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onToggleFavorite && (
            <button
              onClick={(e) => onToggleFavorite(item.id, e)}
              className={`p-2 bg-white/90 backdrop-blur-md transition-all border border-black/5 ${item.is_favorite ? 'text-yellow-500' : 'text-neutral-400 hover:text-yellow-500'}`}
              title="Favorite"
            >
              <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Favorite Badge (Public) */}
      {!isAdmin && item.is_favorite && (
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2 py-1 bg-black/80 backdrop-blur-md text-yellow-400 border border-white/10 shadow-xl pointer-events-none">
          <Star className="w-2.5 h-2.5 fill-current" />
          <span className="text-[9px] font-black uppercase tracking-[0.15em] leading-none">Top Pick</span>
        </div>
      )}

      {/* Poster Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-transparent rounded-none">
        <div className="w-full h-full overflow-hidden transition-transform duration-[650ms] ease-out group-hover:scale-[0.8]">
          <img 
            src={item.poster} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-[650ms] ease-out group-hover:scale-[1.25]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col items-start px-1">
        <h3 className="text-[13px] font-semibold tracking-tight leading-tight text-black group-hover:text-neutral-600 transition-colors truncate w-full">
          {item.title}
        </h3>
        <span className="text-[11px] font-medium text-neutral-400">
          {item.year}
        </span>
      </div>
    </div>
  );
};

export default MovieCard;
