import React from 'react';
import { ToastNotification } from '../types';

interface ToastProps {
  toasts: ToastNotification[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-center justify-between gap-3 animate-fadeIn text-xs font-semibold ${
            t.type === 'success'
              ? 'bg-white border-pink-200 text-slate-800 shadow-pink-100/70'
              : t.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-purple-50 border-purple-200 text-purple-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">
              {t.type === 'success' ? '🌸' : t.type === 'warning' ? '⚠️' : '✨'}
            </span>
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};
