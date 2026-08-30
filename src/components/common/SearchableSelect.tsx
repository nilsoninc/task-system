'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  color?: string;
  avatar?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  allowClear?: boolean;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Type to search (min 2 chars)...',
  label,
  required = false,
  disabled = false,
  className = '',
  dropdownClassName = '',
  allowClear = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    const labelMatch = opt.label.toLowerCase().includes(query);
    const subLabelMatch = opt.subLabel ? opt.subLabel.toLowerCase().includes(query) : false;
    return labelMatch || subLabelMatch;
  });

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchQuery('');
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="font-bold text-zinc-700 block mb-1 text-xs">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full px-3 py-2 text-xs bg-white border border-zinc-200 rounded-xl flex items-center justify-between text-left transition-all ${
          isOpen ? 'border-brand-500 ring-2 ring-brand-500/20' : 'hover:border-zinc-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-zinc-50' : 'cursor-pointer'}`}
      >
        <div className="flex items-center space-x-2 truncate flex-1 min-w-0 mr-2">
          {selectedOption ? (
            <>
              {selectedOption.avatar && (
                <img
                  src={selectedOption.avatar}
                  alt={selectedOption.label}
                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                />
              )}
              {selectedOption.color && (
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: selectedOption.color }}
                />
              )}
              {selectedOption.icon && (
                <span className="flex-shrink-0 text-zinc-500">{selectedOption.icon}</span>
              )}
              <span className="font-semibold text-zinc-900 truncate">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-[10px] text-zinc-400 truncate">({selectedOption.subLabel})</span>
              )}
            </>
          ) : (
            <span className="text-zinc-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center space-x-1 flex-shrink-0">
          {allowClear && selectedOption && !disabled && (
            <span
              onClick={handleClear}
              className="p-0.5 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180 text-brand-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1 w-full bg-white rounded-xl border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 ${dropdownClassName}`}
        >
          {/* Search Box */}
          <div className="p-2 border-b border-zinc-100 bg-zinc-50/70">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:border-brand-500 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {searchQuery.length > 0 && searchQuery.length < 2 && (
              <p className="text-[10px] text-zinc-400 mt-1 px-1">Type 2+ characters to refine matches</p>
            )}
          </div>

          {/* Options List */}
          <div ref={listRef} className="max-h-56 overflow-y-auto p-1 space-y-0.5 text-xs">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-zinc-400 text-xs">
                No matching records found.
              </div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-50 text-brand-900 font-bold'
                        : isHighlighted
                        ? 'bg-zinc-100 text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate flex-1 min-w-0">
                      {opt.avatar && (
                        <img
                          src={opt.avatar}
                          alt={opt.label}
                          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                        />
                      )}
                      {opt.color && (
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      {opt.icon && (
                        <span className="flex-shrink-0 text-zinc-500">{opt.icon}</span>
                      )}
                      <div className="truncate">
                        <span className="truncate block font-medium">{opt.label}</span>
                        {opt.subLabel && (
                          <span className="text-[10px] text-zinc-400 block truncate">
                            {opt.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-600 flex-shrink-0 ml-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
