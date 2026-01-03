/**
 * Collaborative Course Editing Page
 * Real-time collaborative editing for course content
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/useAuth';
import CollaborativeEditor from '@/components/collaboration/CollaborativeEditor';
import AICourseSuggestions from '@/components/ai/AICourseSuggestions';
import { collaborationProvider } from '@/lib/collaboration/yjs-provider';

interface Course {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: string;
  estimatedDuration: number;
}

export default function CollaborativePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const { user, loading: userLoading } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Fetch course data
  useEffect(() => {
    if (!courseId || !user) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch course');
        }

        const data = await response.json();
        setCourse(data.data);
      } catch (error) {
        console.error('Error fetching course:', error);
        // Handle error - maybe redirect or show error message
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, user]);

  // Auto-save course content
  const saveContent = async (content: string) => {
    if (!course || !user) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          content,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save content');
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving content:', error);
    } finally {
      setSaving(false);
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (!course?.content) return;

    const timer = setTimeout(() => {
      saveContent(course.content);
    }, 2000); // Auto-save after 2 seconds of no changes

    return () => clearTimeout(timer);
  }, [course?.content]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collaborative editor...</p>
        </div>
      </div>
    );
  }

  if (!user || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">You don't have access to this course or it doesn't exist.</p>
          <button
            onClick={() => router.push('/courses')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const collaborationUser = {
    id: user.id,
    name: user.name || user.email,
    color: collaborationProvider.generateUserColor(),
    avatar: user.avatar,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/courses')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                ← Back to Courses
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h1>
                <p className="text-sm text-gray-500">
                  Collaborative editing • {course.difficulty} level
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Save Status */}
              <div className="flex items-center space-x-2 text-sm">
                {saving ? (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-600">Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">
                      Saved {lastSaved.toLocaleTimeString()}
                    </span>
                  </>
                ) : null}
              </div>

              {/* AI Suggestions Toggle */}
              <button
                onClick={() => setShowAISuggestions(!showAISuggestions)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  showAISuggestions
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🤖 AI Assist
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Collaborative Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Course Content
                </h2>
                <p className="text-gray-600">
                  Edit course content in real-time with your team members.
                </p>
              </div>

              <CollaborativeEditor
                roomId={`course-${courseId}`}
                user={collaborationUser}
                initialContent={course.content || ''}
                placeholder="Start writing your course content here. Your changes will be synced in real-time with other collaborators..."
                onContentChange={(content) => {
                  setCourse(prev => prev ? { ...prev, content } : null);
                }}
                className="mb-6"
              />

              {/* Course Metadata */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Course Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Difficulty:</span>
                    <span className="ml-2 text-gray-600">{course.difficulty}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Duration:</span>
                    <span className="ml-2 text-gray-600">{course.estimatedDuration} hours</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1 text-gray-600">{course.description}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Suggestions Sidebar */}
          {showAISuggestions && (
            <div className="lg:col-span-1">
              <AICourseSuggestions
                onSuggestionSelect={(suggestion) => {
                  // Handle suggestion selection - maybe show a modal or add to content
                  const suggestedContent = `\n\n## ${suggestion.title}\n\n${suggestion.description}\n\n### Course Outline:\n${suggestion.outline.map(topic => `- ${topic}`).join('\n')}\n`;

                  if (course) {
                    setCourse(prev => prev ? {
                      ...prev,
                      content: prev.content + suggestedContent
                    } : null);
                  }
                }}
                className="sticky top-8"
              />
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      {!showAISuggestions && (
        <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-sm">
          <h4 className="font-medium text-blue-900 mb-2">💡 Collaboration Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Changes sync automatically in real-time</li>
            <li>• See other users' cursors and edits live</li>
            <li>• Use AI Assist for content suggestions</li>
            <li>• All changes are saved automatically</li>
          </ul>
        </div>
      )}
    </div>
  );
}