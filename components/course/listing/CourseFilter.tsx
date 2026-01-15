/**
 * Course Filter Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, DollarSign, Clock, Star } from 'lucide-react';
import { useCategories } from '../shared/hooks';
import type {
  CourseQuery,
  CourseLevel,
  CourseStatus,
  BaseComponentProps,
} from '../shared/types';

interface CourseFilterProps extends BaseComponentProps {
  currentFilters: CourseQuery;
  onFilterChange: (filters: Partial<CourseQuery>) => void;
  onClose?: () => void;
}

interface FilterSection {
  id: string;
  title: string;
  isOpen: boolean;
}

export function CourseFilter({
  currentFilters,
  onFilterChange,
  onClose,
  className = '',
}: CourseFilterProps) {
  const { data: categoriesResponse } = useCategories();
  const categories = categoriesResponse?.data || [];

  const [sections, setSections] = useState<FilterSection[]>([
    { id: 'categories', title: 'Categories', isOpen: true },
    { id: 'level', title: 'Difficulty Level', isOpen: true },
    { id: 'price', title: 'Price Range', isOpen: true },
    { id: 'duration', title: 'Duration', isOpen: false },
    { id: 'rating', title: 'Rating', isOpen: false },
    { id: 'features', title: 'Features', isOpen: false },
  ]);

  const [localFilters, setLocalFilters] = useState<Partial<CourseQuery>>(currentFilters);

  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? { ...section, isOpen: !section.isOpen }
          : section,
      ),
    );
  };

  // Update local filters
  const updateFilter = (key: keyof CourseQuery, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      status: 'PUBLISHED' as CourseStatus,
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  // Price range state
  const [priceRange, setPriceRange] = useState({
    min: localFilters.minPrice || 0,
    max: localFilters.maxPrice || 500,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (priceRange.min !== localFilters.minPrice || priceRange.max !== localFilters.maxPrice) {
        updateFilter('minPrice', priceRange.min);
        updateFilter('maxPrice', priceRange.max);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [priceRange, localFilters.minPrice, localFilters.maxPrice]);

  const levels: CourseLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  const durationRanges = [
    { label: '< 2 hours', min: 0, max: 120 },
    { label: '2-10 hours', min: 120, max: 600 },
    { label: '10-20 hours', min: 600, max: 1200 },
    { label: '20+ hours', min: 1200, max: null },
  ];

  const ratings = [5, 4, 3, 2, 1];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Filter Courses</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearFilters}
            className="text-sm text-gray-400 hover:text-white underline"
          >
            Clear all
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('categories')}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-white">Categories</span>
          {sections.find(s => s.id === 'categories')?.isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {sections.find(s => s.id === 'categories')?.isOpen && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFilters.category === category.slug}
                  onChange={(e) => {
                    updateFilter('category', e.target.checked ? category.slug : undefined);
                  }}
                  className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
                />
                <span className="text-sm text-gray-300 hover:text-white transition-colors">
                  {category.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Difficulty Level */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('level')}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-white">Difficulty Level</span>
          {sections.find(s => s.id === 'level')?.isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {sections.find(s => s.id === 'level')?.isOpen && (
          <div className="space-y-2">
            {levels.map((level) => (
              <label key={level} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="level"
                  checked={localFilters.level === level}
                  onChange={() => updateFilter('level', level)}
                  className="border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
                />
                <span className="text-sm text-gray-300 hover:text-white transition-colors">
                  {level.charAt(0) + level.slice(1).toLowerCase()}
                </span>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="level"
                checked={!localFilters.level}
                onChange={() => updateFilter('level', undefined)}
                className="border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300 hover:text-white transition-colors">
                All levels
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('price')}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-white flex items-center gap-2">
            <DollarSign size={16} />
            Price Range
          </span>
          {sections.find(s => s.id === 'price')?.isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {sections.find(s => s.id === 'price')?.isOpen && (
          <div className="space-y-4">
            {/* Free courses toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.maxPrice === 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setPriceRange({ min: 0, max: 0 });
                    updateFilter('minPrice', 0);
                    updateFilter('maxPrice', 0);
                  } else {
                    setPriceRange({ min: 0, max: 500 });
                    updateFilter('minPrice', 0);
                    updateFilter('maxPrice', 500);
                  }
                }}
                className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300">Free courses only</span>
            </label>

            {/* Price range sliders */}
            {localFilters.maxPrice !== 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Min Price</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">$</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-sm text-white w-12 text-right">{priceRange.min}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-400 mb-1">Max Price</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">$</span>
                      <input
                        type="range"
                        min="0"
                        max="500"
                        step="10"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) }))}
                        className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-sm text-white w-12 text-right">{priceRange.max}</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-gray-400">
                  ${priceRange.min} - ${priceRange.max}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Duration */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('duration')}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-white flex items-center gap-2">
            <Clock size={16} />
            Duration
          </span>
          {sections.find(s => s.id === 'duration')?.isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {sections.find(s => s.id === 'duration')?.isOpen && (
          <div className="space-y-2">
            {durationRanges.map((range, index) => (
              <label key={index} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={false} // TODO: Implement duration filtering
                  onChange={() => {}} // TODO: Implement duration filtering
                  className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
                />
                <span className="text-sm text-gray-300 hover:text-white transition-colors">
                  {range.label}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="border-b border-gray-700 pb-4">
        <button
          onClick={() => toggleSection('rating')}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-white flex items-center gap-2">
            <Star size={16} />
            Minimum Rating
          </span>
          {sections.find(s => s.id === 'rating')?.isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {sections.find(s => s.id === 'rating')?.isOpen && (
          <div className="space-y-2">
            {ratings.map((rating) => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={localFilters.minRating === rating}
                  onChange={() => updateFilter('minRating', rating)}
                  className="border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
                />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}
                    />
                  ))}
                  <span className="text-sm text-gray-300 ml-1">
                    {rating} star{rating !== 1 ? 's' : ''} & up
                  </span>
                </div>
              </label>
            ))}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                checked={!localFilters.minRating}
                onChange={() => updateFilter('minRating', undefined)}
                className="border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300">All ratings</span>
            </label>
          </div>
        )}
      </div>

      {/* Features */}
      <div>
        <button
          onClick={() => toggleSection('features')}
          className="flex items-center justify-between w-full text-left mb-3"
        >
          <span className="font-medium text-white">Features</span>
          {sections.find(s => s.id === 'features')?.isOpen ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </button>

        {sections.find(s => s.id === 'features')?.isOpen && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localFilters.featured === true}
                onChange={(e) => updateFilter('featured', e.target.checked || undefined)}
                className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300">Featured courses</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300">With certificates</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300">With assignments</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-600 bg-gray-800 text-miyabi-blue focus:ring-miyabi-blue"
              />
              <span className="text-sm text-gray-300">Closed captions</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}

export default CourseFilter;
