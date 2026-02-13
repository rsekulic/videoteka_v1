import React from 'react';
import { Search, Plus } from 'lucide-react';

interface NavbarProps {
  onSearch: (query: string) => void;
  onOpenAddModal: () => void;
  isAdmin: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onSearch, onOpenAddModal, isAdmin }) => {
  return (
    <nav className="sticky top-0 z-50 w-full bg-white border-b-4 border-black px-6 py-4">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        {/* Bauhaus Logo Block */}
        <div className="flex items-center gap-0">
          <div className="w-12 h-12 bg-[#E30613] flex items-center justify-center text-white font-black text-xl italic">
            V
          </div>
          <div className="w-12 h-12 bg-black flex items-center justify-center text-white font-black text-xl">
            T
          </div>
        </div>

        {/* Asymmetric Search */}
        <div className="flex-1 max-w-xl mx-12">
          <div className="relative group border-2 border-black p-1 bg-white">
            <input
              type="text"
              placeholder="SEARCH_DIRECTORY"
              className="w-full bg-transparent py-2 pl-4 pr-12 outline-none font-bold text-sm uppercase tracking-tighter placeholder:text-neutral-300"
              onChange={(e) => onSearch(e.target.value)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-[#FFD700] border-l-2 border-black flex items-center justify-center">
              <Search className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAdmin && (
            <button 
              onClick={onOpenAddModal}
              className="bg-[#005A9C] text-white px-8 py-3 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black transition-colors flex items-center gap-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add_Entry</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;