
import React, { useEffect } from 'react';
import { CheckCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info';
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(message.id), 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="flex items-center gap-3 bg-black text-white px-4 py-3 shadow-2xl animate-in slide-in-from-right-4 fade-in duration-300 min-w-[200px]">
      {message.type === 'success' ? (
        <CheckCircle className="w-4 h-4 text-green-400" />
      ) : (
        <Info className="w-4 h-4 text-blue-400" />
      )}
      <span className="text-[12px] font-bold tracking-tight">{message.text}</span>
      <button onClick={() => onClose(message.id)} className="ml-auto pl-4 opacity-50 hover:opacity-100">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default Toast;
