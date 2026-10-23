import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    warning: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Standalone event emitter for triggering toasts outside React context if needed
type ToastListener = (toast: Omit<ToastItem, 'id'>) => void;
const listeners: Set<ToastListener> = new Set();

export const toast = {
  success: (message: string, title?: string) => {
    listeners.forEach((l) => l({ type: 'success', message, title }));
  },
  error: (message: string, title?: string) => {
    listeners.forEach((l) => l({ type: 'error', message, title }));
  },
  warning: (message: string, title?: string) => {
    listeners.forEach((l) => l({ type: 'warning', message, title }));
  },
  info: (message: string, title?: string) => {
    listeners.forEach((l) => l({ type: 'info', message, title }));
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newItem: ToastItem = { ...t, id, duration: t.duration ?? 4000 };
    setToasts((prev) => [...prev.slice(-4), newItem]); // Max 5 toasts visible

    if (newItem.duration && newItem.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newItem.duration);
    }
  }, [removeToast]);

  useEffect(() => {
    const listener: ToastListener = (t) => addToast(t);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
      {/* Toast Viewport Container */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in ${
              item.type === 'success'
                ? 'bg-white border-emerald-200 text-emerald-950'
                : item.type === 'error'
                ? 'bg-white border-red-200 text-red-950'
                : item.type === 'warning'
                ? 'bg-white border-amber-200 text-amber-950'
                : 'bg-white border-indigo-200 text-slate-900'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {item.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
              {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
              {item.type === 'info' && <Info className="w-5 h-5 text-indigo-600" />}
            </div>

            <div className="flex-1 text-xs">
              {item.title && <p className="font-bold text-slate-900 mb-0.5">{item.title}</p>}
              <p className="text-slate-600 leading-relaxed">{item.message}</p>
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="shrink-0 text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
              aria-label="Close toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return { toast };
  }
  return context;
};
