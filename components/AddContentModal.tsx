
import React, { useState } from 'react';
import { X, Sparkles, Loader2, Link as LinkIcon, Database } from 'lucide-react';
import { fetchMovieDetails } from '../services/geminiService';
import { MediaItem } from '../types';

interface AddContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: MediaItem) => void;
}

const AddContentModal: React.FC<AddContentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setIsLoading(true);
    setError('');

    const details = await fetchMovieDetails(inputValue);
    
    if (details) {
      onAdd(details as MediaItem);
      setInputValue('');
      onClose();
    } else {
      setError('Could not find metadata. Try a more specific title or a direct link.');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-bold tracking-tight">Add to Directory</h2>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold uppercase tracking-widest">
                <Database className="w-3 h-3" />
                Powered by TMDB & Gemini
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                Search Title or Paste RT Link
              </label>
              <div className="relative">
                <input
                  autoFocus
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. Severance or rottentomatoes.com/m/inception"
                  className="w-full bg-neutral-50 border border-black/5 p-4 pr-12 outline-none focus:border-black/20 transition-all text-sm"
                  disabled={isLoading}
                />
                <LinkIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-[11px] font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="w-full bg-black text-white py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:bg-neutral-200 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Fetching High-Res Metadata...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Entry
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-neutral-400 leading-relaxed">
            We'll fetch official posters and backdrops from TMDB. If you provide a Rotten Tomatoes link, we'll specifically sync those scores too.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddContentModal;
