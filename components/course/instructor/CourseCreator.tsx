/**
 * Course Creator Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  Save,
  Eye,
  Upload,
  Plus,
  Minus,
  DragHandle,
  Play,
  FileText,
  HelpCircle,
  Users,
  Clock,
  DollarSign,
  Tag,
  Image,
  Video,
  BookOpen,
  Award,
  Settings,
  ChevronRight,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface CourseCreatorProps {
  instructorId: string;
  courseId?: string; // For editing existing courses
  className?: string;
}

interface CourseData {
  id?: string;
  title: string;
  description: string;
  shortDescription: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  price: number;
  currency: string;
  thumbnail: string;
  trailer?: string;
  duration: number; // estimated hours
  prerequisites: string[];
  learningObjectives: string[];
  status: 'draft' | 'published' | 'archived';
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'text' | 'quiz' | 'assignment';
  duration: number; // minutes
  content?: string;
  videoUrl?: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>;
  order: number;
}

interface Section {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
  isCollapsed?: boolean;
}

const categories = [
  'Programming',
  'Web Development',
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'DevOps',
  'Design',
  'Business',
  'Marketing',
  'Other'
];

const lessonTypes = [
  { id: 'video', label: 'Video Lesson', icon: <Video size={16} /> },
  { id: 'text', label: 'Text/Reading', icon: <FileText size={16} /> },
  { id: 'quiz', label: 'Quiz', icon: <HelpCircle size={16} /> },
  { id: 'assignment', label: 'Assignment', icon: <BookOpen size={16} /> },
];

export function CourseCreator({ instructorId, courseId, className = '' }: CourseCreatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [courseData, setCourseData] = useState<CourseData>({
    title: '',
    description: '',
    shortDescription: '',
    category: '',
    difficulty: 'Beginner',
    tags: [],
    price: 0,
    currency: 'USD',
    thumbnail: '',
    duration: 0,
    prerequisites: [],
    learningObjectives: [],
    status: 'draft'
  });

  const [sections, setSections] = useState<Section[]>([
    {
      id: 'section-1',
      title: 'Getting Started',
      description: 'Introduction to the course',
      lessons: [],
      order: 1
    }
  ]);

  const [newTag, setNewTag] = useState('');

  const steps = [
    { id: 0, title: 'Basic Info', icon: <Settings size={16} /> },
    { id: 1, title: 'Curriculum', icon: <BookOpen size={16} /> },
    { id: 2, title: 'Pricing', icon: <DollarSign size={16} /> },
    { id: 3, title: 'Publishing', icon: <Eye size={16} /> }
  ];

  const handleCourseDataChange = (field: keyof CourseData, value: any) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag.trim() && !courseData.tags.includes(newTag.trim())) {
      handleCourseDataChange('tags', [...courseData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleCourseDataChange('tags', courseData.tags.filter(tag => tag !== tagToRemove));
  };

  const addObjective = () => {
    handleCourseDataChange('learningObjectives', [...courseData.learningObjectives, '']);
  };

  const updateObjective = (index: number, value: string) => {
    const objectives = [...courseData.learningObjectives];
    objectives[index] = value;
    handleCourseDataChange('learningObjectives', objectives);
  };

  const removeObjective = (index: number) => {
    handleCourseDataChange('learningObjectives', courseData.learningObjectives.filter((_, i) => i !== index));
  };

  const addPrerequisite = () => {
    handleCourseDataChange('prerequisites', [...courseData.prerequisites, '']);
  };

  const updatePrerequisite = (index: number, value: string) => {
    const prerequisites = [...courseData.prerequisites];
    prerequisites[index] = value;
    handleCourseDataChange('prerequisites', prerequisites);
  };

  const removePrerequisite = (index: number) => {
    handleCourseDataChange('prerequisites', courseData.prerequisites.filter((_, i) => i !== index));
  };

  const addSection = () => {
    const newSection: Section = {
      id: `section-${sections.length + 1}`,
      title: 'New Section',
      description: '',
      lessons: [],
      order: sections.length + 1
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (sectionId: string, field: keyof Section, value: any) => {
    setSections(prev =>
      prev.map(section =>
        section.id === sectionId ? { ...section, [field]: value } : section
      )
    );
  };

  const removeSection = (sectionId: string) => {
    setSections(prev => prev.filter(section => section.id !== sectionId));
  };

  const addLesson = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      description: '',
      type: 'video',
      duration: 0,
      attachments: [],
      order: section.lessons.length + 1
    };

    updateSection(sectionId, 'lessons', [...section.lessons, newLesson]);
  };

  const updateLesson = (sectionId: string, lessonId: string, field: keyof Lesson, value: any) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedLessons = section.lessons.map(lesson =>
      lesson.id === lessonId ? { ...lesson, [field]: value } : lesson
    );

    updateSection(sectionId, 'lessons', updatedLessons);
  };

  const removeLesson = (sectionId: string, lessonId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedLessons = section.lessons.filter(lesson => lesson.id !== lessonId);
    updateSection(sectionId, 'lessons', updatedLessons);
  };

  const handleSave = async (publish = false) => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (publish) {
        handleCourseDataChange('status', 'published');
      }

      console.log('Course saved:', { courseData, sections });
      // Handle successful save
    } catch (error) {
      console.error('Failed to save course:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      {/* Course Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Course Title *
        </label>
        <input
          type="text"
          value={courseData.title}
          onChange={(e) => handleCourseDataChange('title', e.target.value)}
          placeholder="Enter a compelling course title..."
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
        />
      </div>

      {/* Short Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Short Description *
        </label>
        <textarea
          value={courseData.shortDescription}
          onChange={(e) => handleCourseDataChange('shortDescription', e.target.value)}
          placeholder="Write a brief description (max 160 characters)..."
          rows={2}
          maxLength={160}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent resize-none"
        />
        <div className="text-xs text-gray-400 mt-1">
          {courseData.shortDescription.length}/160 characters
        </div>
      </div>

      {/* Full Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Description *
        </label>
        <textarea
          value={courseData.description}
          onChange={(e) => handleCourseDataChange('description', e.target.value)}
          placeholder="Provide a detailed description of your course..."
          rows={6}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
        />
      </div>

      {/* Category and Difficulty */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Category *
          </label>
          <select
            value={courseData.category}
            onChange={(e) => handleCourseDataChange('category', e.target.value)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Difficulty Level *
          </label>
          <select
            value={courseData.difficulty}
            onChange={(e) => handleCourseDataChange('difficulty', e.target.value as any)}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {courseData.tags.map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 bg-miyabi-blue/20 text-miyabi-blue px-3 py-1 rounded-full text-sm"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:bg-miyabi-blue/30 rounded-full p-0.5"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <button
            onClick={addTag}
            className="bg-miyabi-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      {/* Learning Objectives */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Learning Objectives
        </label>
        <div className="space-y-2">
          {courseData.learningObjectives.map((objective, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={objective}
                onChange={(e) => updateObjective(index, e.target.value)}
                placeholder="What will students learn?"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
              />
              <button
                onClick={() => removeObjective(index)}
                className="text-red-400 hover:text-red-300 p-2"
              >
                <Minus size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={addObjective}
            className="flex items-center gap-2 text-miyabi-blue hover:text-blue-400 transition-colors"
          >
            <Plus size={16} />
            Add learning objective
          </button>
        </div>
      </div>

      {/* Prerequisites */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Prerequisites
        </label>
        <div className="space-y-2">
          {courseData.prerequisites.map((prerequisite, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={prerequisite}
                onChange={(e) => updatePrerequisite(index, e.target.value)}
                placeholder="What should students know beforehand?"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
              />
              <button
                onClick={() => removePrerequisite(index)}
                className="text-red-400 hover:text-red-300 p-2"
              >
                <Minus size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={addPrerequisite}
            className="flex items-center gap-2 text-miyabi-blue hover:text-blue-400 transition-colors"
          >
            <Plus size={16} />
            Add prerequisite
          </button>
        </div>
      </div>
    </div>
  );

  const renderCurriculumStep = () => (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateSection(section.id, 'isCollapsed', !section.isCollapsed)}
                className="text-gray-400 hover:text-gray-300 transition-colors"
              >
                {section.isCollapsed ? <ChevronRight size={20} /> : <ChevronDown size={20} />}
              </button>
              <div className="flex-grow">
                <input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                  className="text-lg font-semibold bg-transparent text-white border-0 p-0 focus:ring-0 focus:outline-none w-full"
                  placeholder="Section title..."
                />
                <input
                  type="text"
                  value={section.description}
                  onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                  className="text-sm bg-transparent text-gray-400 border-0 p-0 focus:ring-0 focus:outline-none w-full mt-1"
                  placeholder="Section description..."
                />
              </div>
            </div>
            <button
              onClick={() => removeSection(section.id)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Section Content */}
          {!section.isCollapsed && (
            <div className="space-y-3">
              {/* Lessons */}
              {section.lessons.map((lesson) => (
                <div key={lesson.id} className="bg-gray-900/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {lessonTypes.find(type => type.id === lesson.type)?.icon}
                    </div>
                    <div className="flex-grow space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => updateLesson(section.id, lesson.id, 'title', e.target.value)}
                          placeholder="Lesson title..."
                          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                        />
                        <select
                          value={lesson.type}
                          onChange={(e) => updateLesson(section.id, lesson.id, 'type', e.target.value)}
                          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                        >
                          {lessonTypes.map((type) => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={lesson.duration}
                            onChange={(e) => updateLesson(section.id, lesson.id, 'duration', parseInt(e.target.value) || 0)}
                            placeholder="Duration (min)"
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                          />
                          <button
                            onClick={() => removeLesson(section.id, lesson.id)}
                            className="text-red-400 hover:text-red-300 transition-colors px-2"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={lesson.description}
                        onChange={(e) => updateLesson(section.id, lesson.id, 'description', e.target.value)}
                        placeholder="Lesson description..."
                        rows={2}
                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Lesson Button */}
              <button
                onClick={() => addLesson(section.id)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-miyabi-blue hover:text-miyabi-blue transition-colors"
              >
                <Plus size={16} />
                Add Lesson
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add Section Button */}
      <button
        onClick={addSection}
        className="w-full flex items-center justify-center gap-2 py-4 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-miyabi-blue hover:text-miyabi-blue transition-colors"
      >
        <Plus size={20} />
        Add Section
      </button>
    </div>
  );

  const renderPricingStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Course Pricing</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <input
                type="number"
                value={courseData.price}
                onChange={(e) => handleCourseDataChange('price', parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={courseData.currency}
              onChange={(e) => handleCourseDataChange('currency', e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            >
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="JPY">JPY - Japanese Yen</option>
            </select>
          </div>
        </div>

        <div className="mt-6 p-4 bg-miyabi-blue/10 border border-miyabi-blue/30 rounded-lg">
          <h4 className="text-miyabi-blue font-medium mb-2">Pricing Recommendations</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Beginner courses: $19-49</li>
            <li>• Intermediate courses: $49-99</li>
            <li>• Advanced courses: $99-199</li>
            <li>• Consider offering early bird pricing</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const renderPublishingStep = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Course Media</h3>

        {/* Thumbnail Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Course Thumbnail *
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-miyabi-blue transition-colors">
            <Image className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-400 text-sm">
              Click to upload or drag and drop
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Recommended: 1920x1080px, JPG or PNG
            </p>
          </div>
        </div>

        {/* Trailer Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Course Trailer (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-miyabi-blue transition-colors">
            <Video className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-400 text-sm">
              Upload a promotional video
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Max 2 minutes, MP4 format recommended
            </p>
          </div>
        </div>
      </div>

      {/* Publishing Options */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Publishing Options</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Save as Draft</h4>
              <p className="text-gray-400 text-sm">Keep working on your course privately</p>
            </div>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-miyabi-blue/10 border border-miyabi-blue/30 rounded-lg">
            <div>
              <h4 className="text-white font-medium">Publish Course</h4>
              <p className="text-gray-400 text-sm">Make your course available to students</p>
            </div>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || !courseData.title || !courseData.description}
              className="bg-miyabi-blue hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : 'Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Course Summary */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Course Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-miyabi-blue">{sections.length}</div>
            <div className="text-sm text-gray-400">Sections</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-miyabi-green">
              {sections.reduce((total, section) => total + section.lessons.length, 0)}
            </div>
            <div className="text-sm text-gray-400">Lessons</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-miyabi-purple">
              {Math.round(sections.reduce((total, section) =>
                total + section.lessons.reduce((sectionTotal, lesson) => sectionTotal + lesson.duration, 0), 0) / 60
              )}h
            </div>
            <div className="text-sm text-gray-400">Duration</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">
              ${courseData.price}
            </div>
            <div className="text-sm text-gray-400">Price</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {courseId ? 'Edit Course' : 'Create New Course'}
        </h1>
        <p className="text-gray-400">
          Build and publish your course to share knowledge with students worldwide
        </p>
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-3 cursor-pointer transition-colors ${
                  currentStep === step.id
                    ? 'text-miyabi-blue'
                    : currentStep > step.id
                    ? 'text-miyabi-green'
                    : 'text-gray-400'
                }`}
                onClick={() => setCurrentStep(step.id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  currentStep === step.id
                    ? 'border-miyabi-blue bg-miyabi-blue/20'
                    : currentStep > step.id
                    ? 'border-miyabi-green bg-miyabi-green/20'
                    : 'border-gray-600 bg-gray-700'
                }`}>
                  {currentStep > step.id ? <Check size={16} /> : step.icon}
                </div>
                <span className="font-medium hidden sm:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.id ? 'bg-miyabi-green' : 'bg-gray-600'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        {currentStep === 0 && renderBasicInfoStep()}
        {currentStep === 1 && renderCurriculumStep()}
        {currentStep === 2 && renderPricingStep()}
        {currentStep === 3 && renderPublishingStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default CourseCreator;