'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, Theme } from '@/context/ThemeContext';
import { Icons } from '@/components/ui/Icons';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ปิดเมนูเมื่อคลิกนอกพื้นที่
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    {
      value: 'light',
      label: 'โหมดสว่าง (Light)',
      icon: <Icons.Sun className="w-4 h-4 text-amber-500" />,
    },
    {
      value: 'dark',
      label: 'โหมดมืด (Dark)',
      icon: <Icons.Moon className="w-4 h-4 text-cyan-400" />,
    },
    {
      value: 'system',
      label: 'ตามระบบ (System)',
      icon: <Icons.Monitor className="w-4 h-4 text-slate-400" />,
    },
  ];

  const currentIcon = () => {
    if (theme === 'system') {
      return <Icons.Monitor className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
    if (theme === 'dark') {
      return <Icons.Moon className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />;
    }
    return <Icons.Sun className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="เปลี่ยนธีมหน้าจอ (สว่าง/มืด/ตามระบบ)"
        aria-expanded={isOpen}
        title={`ธีมปัจจุบัน: ${
          theme === 'system'
            ? `ตามระบบ (${resolvedTheme === 'dark' ? 'มืด' : 'สว่าง'})`
            : theme === 'dark'
            ? 'โหมดมืด'
            : 'โหมดสว่าง'
        }`}
        className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer flex items-center justify-center"
      >
        {currentIcon()}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-fadeIn">
          <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/80 mb-1">
            ปรับแต่งธีมหน้าจอ
          </div>
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setTheme(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {opt.icon}
                  <span>{opt.label}</span>
                </div>
                {isSelected && <Icons.Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

