"use client";
import { useState, useEffect } from 'react';

export function useViewPreference(defaultView: 'modern'|'classic' = 'modern', storageKey: string = 'erp-view-preference') {
  const [view, setViewState] = useState<'modern'|'classic'>(defaultView);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'modern' || saved === 'classic') {
        setViewState(saved as any);
      }
    } catch {}
  }, [storageKey]);

  const setView = (v: 'modern'|'classic') => {
    setViewState(v);
    try {
      localStorage.setItem(storageKey, v);
    } catch {}
  };

  return { view, setView };
}
