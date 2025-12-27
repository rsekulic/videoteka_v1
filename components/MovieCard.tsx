
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
              title="Remove from directory"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {onToggleFavorite && (
            <button
              onClick={(e) => onToggleFavorite(item.id, e)}
              className={`p-2 bg-white/90 backdrop-blur-md transition-all border border-black/5 ${item.is_favorite ? 'text-yellow-500 hover:text-yellow-600' : 'text-neutral-400 hover:text-yellow-500'}`}
              title={item.is_favorite ? 'Remove from favorites' : 'Mark as favorite'}
            >
              <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      )}

      {/* Favorite Badge (always visible if fav) */}
      {!isAdmin && item.is_favorite && (
        <div className="absolute top-2 left-2 z-20 p-1.5 bg-black/60 backdrop-blur-md text-yellow-400 border border-white/10 rounded-full shadow-lg">
          <Star className="w-3.5 h-3.5 fill-current" />
        </div>
      )}

      {/* Mask Container */}
      <div className="relative aspect-square w-full overflow-hidden bg-transparent rounded-none">
        <div className="w-full h-full overflow-hidden transition-transform duration-[650ms] ease-out group-hover:scale-[0.8]">
          <img 
            src={item.poster} 
            alt={item.title}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectPosition: 'center center',
              objectFit: 'cover',
              opacity: 1,
              willChange: 'transform'
            }}
            className="transition-transform duration-[650ms] ease-out group-hover:scale-[1.25]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>

      {/* Info Block */}
      <div className="flex flex-col items-start gap-1 px-1 transition-all duration-300">
        <div className="flex items-center gap-2 w-full">
          <h3 className="text-[13px] font-semibold tracking-tight leading-tight text-black group-hover:text-neutral-600 transition-colors flex-1 truncate">
            {item.title}
          </h3>
          {item.is_favorite && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 shrink-0" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-neutral-500">
            {item.year}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
