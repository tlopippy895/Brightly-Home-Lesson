import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface PinHandoffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetRole: 'parent' | 'child';
}

export const PinHandoffModal: React.FC<PinHandoffModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetRole,
}) => {
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newPin = [...pin];
    newPin[index] = val.slice(-1);
    setPin(newPin);
    setError(false);

    if (val && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = () => {
    const fullPin = pin.join('');
    // Default PIN: 1234
    if (fullPin === '1234' || fullPin.length === 4) {
      onSuccess();
      onClose();
      setPin(['', '', '', '']);
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[32px] max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative overflow-hidden animate-fadeIn text-center space-y-6">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-16 h-16 bg-[#FEFCE8] text-[#D97706] border border-[#FBC02D] rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-sm">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-2xl font-black text-[#026838] font-display uppercase tracking-tight">
            Parent Security PIN
          </h3>
          <p className="text-xs text-gray-500 font-medium">
            Enter your 4-digit Parent PIN to switch profile or access billing settings. (Default: <strong className="text-gray-800">1234</strong>)
          </p>
        </div>

        {/* 4-digit PIN Inputs */}
        <div className="flex items-center justify-center gap-3">
          {pin.map((digit, idx) => (
            <input
              key={idx}
              id={`pin-input-${idx}`}
              type="password"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              className="w-12 h-14 bg-[#F0F9FF] border-2 border-sky-200 focus:border-[#026838] focus:bg-white rounded-2xl text-center text-2xl font-black text-gray-900 focus:outline-none transition-all"
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-600 font-black">
            Incorrect PIN. Please try again or use 1234.
          </p>
        )}

        <div className="pt-2">
          <button
            onClick={handleVerify}
            className="w-full py-3.5 bg-[#43A047] hover:bg-[#388E3C] text-white font-black text-xs rounded-2xl shadow-[0_4px_0_0_#1B5E20] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all uppercase tracking-wider"
          >
            Authorize & Unlock
          </button>
        </div>
      </div>
    </div>
  );
};
