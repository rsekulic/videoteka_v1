import React, { useState } from 'react';
import { X, Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin?: (password: string) => boolean | void; 
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    } else {
      onClose();
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-white shadow-2xl">
        <div className="p-8 text-xs">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Admin Access</h2>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-neutral-100">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className={`w-full bg-neutral-50 border ${error ? 'border-red-500' : 'border-black/5'} p-4 pl-12 outline-none focus:border-black/20 text-sm`}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full bg-neutral-50 border ${error ? 'border-red-500' : 'border-black/5'} p-4 pl-12 outline-none focus:border-black/20 text-sm`}
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-[11px] font-bold text-center uppercase tracking-tight">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-4 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:bg-neutral-400"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4" />
              ) : (
                <>
                  Unlock Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-[10px] text-neutral-400 text-center uppercase tracking-widest">
            Identity Verified via Supabase
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;