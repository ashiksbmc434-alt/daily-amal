import React from 'react';
import { motion } from 'framer-motion';

interface CheckboxProps {
  checked: boolean;
  onChange: (val: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
        checked 
          ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-200' 
          : 'bg-white border-slate-200 hover:border-emerald-300'
      }`}
    >
      {checked && (
        <motion.svg
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-4 h-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </motion.svg>
      )}
    </button>
  );
};
