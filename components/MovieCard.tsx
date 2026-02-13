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
  // Asymmetric spans only on desktop to avoid mobile layout breaking
  const isLarge = parseInt(item.id) % 6 === 0;

  return (
    <div 
      className={`group cursor-pointer flex flex-col bauhaus-transition relative ${isLarge ? 'md:col-span-2 md:row-span-1' : ''}`}
      onClick={() => onClick(item)}
    >
      {/* Bauhaus Frame */}
      <div className="relative border-2 border-black bg-white p-1 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group-hover:shadow-[10px_10px_0px_0px_#FFD700] md:group-hover:shadow-[12px_12px_0px_0px_#FFD700] transition-all">
        <div className={`relative overflow-hidden bg-neutral-200 ${isLarge ? 'aspect-video md:aspect-[3/2]' : 'aspect-[3/4]'}`}>
          <img 
            src={item.poster} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          
          {/* Top Pick Triangle */}
          {item.is_favorite && (
            <div 
              className="absolute top-0 right-0 w-12 h-12 md:w-16 md:h-16 bg-[#E30613] flex items-center justify-center"
              style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
            >
              <Star className="w-3 h-3 md:w-4 md:h-4 text-white fill-current absolute top-1.5 md:top-2 right-1.5 md:right-2" />
            </div>
          )}

          {/* Type Label (Geometric) */}
          <div className="absolute bottom-4 left-0 bg-black text-white px-3 py-1 text-[8px] md:text-[9px] font-black uppercase tracking-widest">
            {item.type === 'Movie' ? 'MOD_F' : 'MOD_S'}
          </div>
        </div>

        {/* Admin Layer */}
        {isAdmin && (
          <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(item.id, e); }}
              className="w-10 h-10 bg-[#E30613] border-2 border-black flex items-center justify-center text-white hover:bg-black transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(item.id, e); }}
              className={`w-10 h-10 border-2 border-black flex items-center justify-center ${item.is_favorite ? 'bg-[#FFD700]' : 'bg-white hover:bg-[#FFD700]'}`}
            >
              <Star className={`w-4 h-4 ${item.is_favorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Metadata - Asymmetric Placement */}
      <div className="mt-4 md:mt-6 flex flex-col gap-1 pr-4">
        <div className="flex items-baseline gap-3">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter leading-none group-hover:text-[#005A9C]">
            {item.title}
          </h3>
          <span className="mono text-[8px] md:text-[10px] font-bold text-neutral-400">
            /{item.year}
          </span>
        </div>
        <div className="flex gap-2 items-center mt-1.5">
           <div className="h-0.5 w-6 md:w-8 bg-[#005A9C]" />
           <p className="mono text-[8px] md:text-[9px] font-bold uppercase tracking-widest text-neutral-500">
             {item.genre[0]} // CAT_{item.id.slice(0,3)}
           </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;