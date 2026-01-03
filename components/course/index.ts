/**
 * Course Management UI Components
 * Issue #1299: Comprehensive course management UI components
 *
 * Main export file for all course-related components
 */

// Shared utilities and types
export * from './shared/types';
export * from './shared/api';
export * from './shared/hooks';
export * from './shared/LoadingComponents';

// Course Listing & Discovery
export { default as CourseCard } from './listing/CourseCard';
export { default as CourseGrid } from './listing/CourseGrid';
export { default as CourseFilter } from './listing/CourseFilter';
export { default as CourseSearch } from './listing/CourseSearch';
export { default as Pagination } from './listing/Pagination';

// Course Detail & Enrollment
export { default as CourseDetail } from './detail/CourseDetail';
export { default as CourseHeader } from './detail/CourseHeader';
export { default as CourseSyllabus } from './detail/CourseSyllabus';
export { default as CourseReviews } from './detail/CourseReviews';
export { default as EnrollmentModal } from './detail/EnrollmentModal';

// Learning Experience
export { default as LessonPlayer } from './learning/LessonPlayer';
export { default as LessonNavigation } from './learning/LessonNavigation';
export { default as LessonSidebar } from './learning/LessonSidebar';
export { default as AssessmentView } from './learning/AssessmentView';
export { default as ProgressTracker } from './learning/ProgressTracker';

// Student Dashboard
export { default as StudentDashboard } from './dashboard/StudentDashboard';
export { default as MyCourses } from './dashboard/MyCourses';
export { default as RecentActivity } from './dashboard/RecentActivity';
export { default as Certificates } from './dashboard/Certificates';

// Instructor Interface
export { default as InstructorDashboard } from './instructor/InstructorDashboard';
export { default as CourseCreator } from './instructor/CourseCreator';
export { default as StudentManagement } from './instructor/StudentManagement';
export { default as CourseAnalytics } from './instructor/CourseAnalytics';

// Component groups for easier imports
export const ListingComponents = {
  CourseCard: require('./listing/CourseCard').default,
  CourseGrid: require('./listing/CourseGrid').default,
  CourseFilter: require('./listing/CourseFilter').default,
  CourseSearch: require('./listing/CourseSearch').default,
  Pagination: require('./listing/Pagination').default,
};

export const DetailComponents = {
  CourseDetail: require('./detail/CourseDetail').default,
  CourseHeader: require('./detail/CourseHeader').default,
  CourseSyllabus: require('./detail/CourseSyllabus').default,
  CourseReviews: require('./detail/CourseReviews').default,
  EnrollmentModal: require('./detail/EnrollmentModal').default,
};

export const LearningComponents = {
  LessonPlayer: require('./learning/LessonPlayer').default,
  LessonNavigation: require('./learning/LessonNavigation').default,
  LessonSidebar: require('./learning/LessonSidebar').default,
  AssessmentView: require('./learning/AssessmentView').default,
  ProgressTracker: require('./learning/ProgressTracker').default,
};

export const DashboardComponents = {
  StudentDashboard: require('./dashboard/StudentDashboard').default,
  MyCourses: require('./dashboard/MyCourses').default,
  RecentActivity: require('./dashboard/RecentActivity').default,
  Certificates: require('./dashboard/Certificates').default,
};

export const InstructorComponents = {
  InstructorDashboard: require('./instructor/InstructorDashboard').default,
  CourseCreator: require('./instructor/CourseCreator').default,
  StudentManagement: require('./instructor/StudentManagement').default,
  CourseAnalytics: require('./instructor/CourseAnalytics').default,
};