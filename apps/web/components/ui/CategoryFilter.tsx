'use client';
import React from 'react';

/**
 * Amateur sub-category filter (C1 / C2).
 *
 * The amateur commission (CAA) is scoped to both C1 and C2 on the backend.
 * This control lets it narrow the listing to a single sub-category while the
 * empty value keeps the full scope. The chosen value is meant to be sent as the
 * `category` query param ('' → both C1 & C2 via the role scope, 'C1', or 'C2').
 */
export const C1C2_FILTER_OPTIONS = [
  { value: 'C1', label: 'Amateur C1' },
  { value: 'C2', label: 'Amateur C2' },
];

interface CategoryC1C2FilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const CategoryC1C2Filter = ({ value, onChange, className = '' }: CategoryC1C2FilterProps) => (<>
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label="Filtrer par catégorie amateur"
    className={`px-3 py-2 text-sm border border-gray-200 dark:border-flashscore-border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ce1126] bg-white dark:bg-flashscore-card ${className}`}
  >
    {C1C2_FILTER_OPTIONS.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
  </>
);
