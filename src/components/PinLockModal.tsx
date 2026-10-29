import React, { useState } from 'react';

interface PinLockModalProps {
  isOpen: boolean;
  correctPin: string;
  onUnlock: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  correctPin,
  onUnlock,
}) => {
  if (!isOpen) return null;

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorShake, setErrorShake] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (enteredPin.length < 4) {
      const next = enteredPin + digit;
      setEnteredPin(next);
      if (next.length === 4) {
        if (next === correctPin) {
          onUnlock();
          setEnteredPin('');
        } else {
          setErrorShake(true);
          setTimeout(() => {
            setErrorShake(false);
            setEnteredPin('');
          }, 800);
        }
      }
    }
  };

  const handleDelete = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handleBiometricSimulate = () => {
    onUnlock();
    setEnteredPin('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-pink-100/90 via-purple-100/95 to-indigo-100/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl max-w-sm w-full p-8 border border-pink-200 shadow-2xl text-center space-y-6 ${
        errorShake ? 'animate-shake' : ''
      }`}>
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-pink-200">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">CycleCare Vault Locked</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enter your 4-digit PIN code or use simulated Face ID
          </p>
        </div>

        {/* 4 Pin Indicators */}
        <div className="flex justify-center gap-3 py-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                idx < enteredPin.length
                  ? 'bg-pink-600 border-pink-600 scale-110'
                  : 'border-slate-300 bg-transparent'
              } ${errorShake ? 'border-rose-500 bg-rose-500' : ''}`}
            />
          ))}
        </div>

        {errorShake && (
          <p className="text-xs text-rose-600 font-bold">Incorrect PIN code. Try again.</p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-pink-50 border border-slate-200/80 text-xl font-bold text-slate-700 active:scale-95 transition-all shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBiometricSimulate}
            className="w-16 h-16 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-xs font-bold text-purple-700 flex flex-col items-center justify-center active:scale-95 transition-all"
            title="Biometric Unlock"
          >
            <span>✨</span>
            <span className="text-[10px]">Face ID</span>
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-pink-50 border border-slate-200/80 text-xl font-bold text-slate-700 active:scale-95 transition-all shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="w-16 h-16 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 font-bold text-sm flex items-center justify-center active:scale-95 transition-all"
          >
            ⌫
          </button>
        </div>

        <p className="text-[11px] text-slate-400">
          Default demo PIN: <span className="font-mono font-bold text-slate-600">1234</span>
        </p>
      </div>
    </div>
  );
};
