'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface GlassSelectProps {
  label?: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  label,
  value,
  options,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {label && (
        <span className="block text-[8px] uppercase tracking-wider text-white/45 font-bold mb-1">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs px-3.5 py-2.5 flex items-center justify-between text-left cursor-pointer transition-all duration-200"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(20px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
          border: isOpen ? '1px solid rgba(212, 150, 58, 0.45)' : '1px solid rgba(255, 255, 255, 0.10)',
          borderRadius: '12px',
          color: '#ffffff',
          boxShadow: isOpen ? '0 0 0 3px rgba(212, 150, 58, 0.12)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.10)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.10)';
          }
        }}
      >
        <span className="truncate font-medium">{selectedOption?.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
          className="transition-transform duration-200 flex-shrink-0 ml-1.5 opacity-65"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute left-0 right-0 mt-1.5 z-40 overflow-hidden flex flex-col py-1.5 animate-fade-in"
          style={{
            background: 'rgba(38, 28, 16, 0.96)', // Espresso dark-tint to blend with backgrounds
            backdropFilter: 'blur(30px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(30px) saturate(1.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
            maxHeight: '260px',
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className="w-full text-left text-xs px-4 py-2 border-none transition-colors duration-150 cursor-pointer flex items-center justify-between"
                style={{
                  background: isSelected ? 'rgba(212, 150, 58, 0.16)' : 'transparent',
                  color: isSelected ? '#ffffff' : 'rgba(245, 240, 230, 0.80)',
                  fontWeight: isSelected ? '700' : '500',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(245, 240, 230, 0.80)';
                  }
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#D4963A"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 ml-2 animate-scale-in"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GlassSelect;
