/**
 * Course Search Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, Clock } from 'lucide-react';
import { useCourseSearch } from '../shared/hooks';
import { SearchSuggestion } from '../shared/types';

interface CourseSearchProps {
  placeholder?: string;
  initialValue?: string;
  onSearch: (query: string) => void;
  showSuggestions?: boolean;
  showPopular?: boolean;
  className?: string;
}

export function CourseSearch({
  placeholder = 'Search courses, instructors, topics...',
  initialValue = '',
  onSearch,
  showSuggestions = true,
  showPopular = true,
  className = '',
}: CourseSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { suggestions, isLoading } = useCourseSearch(query);

  // Mock popular searches - in real app, this would come from API
  const popularSearches = [
    'React Development',
    'Machine Learning',
    'UI/UX Design',
    'Python Programming',
    'Digital Marketing',
    'Data Science',
  ];

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowDropdown(true);

    // Debounced search
    if (value.length >= 3) {
      onSearch(value);
    } else if (value.length === 0) {
      onSearch('');
    }
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    onSearch('');
    inputRef.current?.focus();
  };

  // Handle focus/blur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Recent searches from localStorage
  const getRecentSearches = (): string[] => {
    if (typeof window === 'undefined') {return [];}
    try {
      return JSON.parse(localStorage.getItem('miyabi-recent-searches') || '[]');
    } catch {
      return [];
    }
  };

  const saveRecentSearch = (searchQuery: string) => {
    if (typeof window === 'undefined' || !searchQuery.trim()) {return;}

    const recent = getRecentSearches();
    const updated = [searchQuery, ...recent.filter(q => q !== searchQuery)].slice(0, 5);
    localStorage.setItem('miyabi-recent-searches', JSON.stringify(updated));
  };

  const recentSearches = getRecentSearches();

  // Save search when submitting
  const handleSearchSubmit = (searchQuery: string) => {
    saveRecentSearch(searchQuery);
    onSearch(searchQuery);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              setIsFocused(true);
              setShowDropdown(true);
            }}
            placeholder={placeholder}
            className="
              w-full pl-12 pr-12 py-3
              bg-gray-800 border border-gray-600 rounded-lg
              text-white placeholder-gray-400
              focus:ring-2 focus:ring-miyabi-blue focus:border-transparent
              transition-all duration-200
            "
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </form>

      {/* Search Dropdown */}
      {showDropdown && (isFocused || query.length > 0) && (
        <div
          ref={dropdownRef}
          className="
            absolute top-full left-0 right-0 mt-2
            bg-gray-800 border border-gray-600 rounded-lg
            shadow-2xl z-50 max-h-96 overflow-y-auto
          "
        >
          {/* Loading */}
          {isLoading && query.length > 2 && (
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2 text-gray-400">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-miyabi-blue rounded-full animate-spin" />
                <span>Searching...</span>
              </div>
            </div>
          )}

          {/* Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="border-b border-gray-700">
              <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Suggestions
              </div>
              {suggestions.slice(0, 6).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.title)}
                  className="
                    w-full px-4 py-2 text-left hover:bg-gray-700
                    flex items-center gap-3 transition-colors
                  "
                >
                  <Search size={16} className="text-gray-400 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <div className="text-white text-sm truncate">
                      {suggestion.title}
                    </div>
                    {suggestion.subtitle && (
                      <div className="text-gray-400 text-xs truncate">
                        {suggestion.subtitle}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 capitalize">
                    {suggestion.type}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && query.length === 0 && (
            <div className="border-b border-gray-700">
              <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Recent Searches
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="
                    w-full px-4 py-2 text-left hover:bg-gray-700
                    flex items-center gap-3 transition-colors
                  "
                >
                  <Clock size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-white text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Searches */}
          {showPopular && query.length === 0 && (
            <div>
              <div className="p-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Popular Searches
              </div>
              {popularSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(search)}
                  className="
                    w-full px-4 py-2 text-left hover:bg-gray-700
                    flex items-center gap-3 transition-colors
                  "
                >
                  <TrendingUp size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-white text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}

          {/* No results */}
          {query.length > 2 && !isLoading && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-400">
              No suggestions found for "{query}"
            </div>
          )}

          {/* Quick actions */}
          {query.length > 0 && (
            <div className="border-t border-gray-700 p-3">
              <button
                onClick={() => handleSearchSubmit(query)}
                className="
                  w-full py-2 px-3 text-left text-sm
                  text-miyabi-blue hover:bg-miyabi-blue hover:text-white
                  rounded-lg transition-colors flex items-center gap-2
                "
              >
                <Search size={16} />
                <span>Search for "{query}"</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CourseSearch;
