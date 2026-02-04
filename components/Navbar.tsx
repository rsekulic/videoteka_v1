import React from 'react';
import { Search, Clapperboard, Plus, Shield } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onOpenAddModal: () => void;
  isAdmin: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onOpenAddModal, isAdmin }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-[#f7f7f7]/80 border-b border-black/5 px-3 py-4 backdrop-blur-md">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-black flex items-center justify-center">
              <Clapperboard className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block text-black">Videoteka</span>
          </div>
          
          {isAdmin && (
            <div className="hidden lg:flex items-center gap-2 bg-black/5 px-3 py-1">
              <Shield className="w-3 h-3 text-black" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/60">Admin Mode</span>
            </div>
          )}
        </div>

        <div className="flex-1 max-w-md mx-6">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/20 group-focus-within:text-black" />
            <input
              type="text"
              placeholder="Search directory..."
              className="w-full bg-white/50 border border-black/5 rounded-none py-2 pl-10 pr-4 outline-none focus:border-black/10 focus:bg-white text-sm text-black"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button 
              onClick={onOpenAddModal}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 text-[12px] font-bold hover:bg-neutral-800"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Content</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;