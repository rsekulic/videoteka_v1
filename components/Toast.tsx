import React, { useEffect } from 'react';
import { CheckCircle, Info, X, AlertCircle } from 'lucide-react';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  message: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(message.id), 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  const getIcon = () => {
    switch (message.type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="flex items-center gap-3 bg-black text-white px-4 py-3 shadow-2xl min-w-[200px] max-w-sm border border-white/10">
      {getIcon()}
      <span className="text-[12px] font-bold tracking-tight leading-snug">{message.text}</span>
      <button onClick={() => onClose(message.id)} className="ml-auto pl-4 opacity-50 hover:opacity-100">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};

export default Toast;