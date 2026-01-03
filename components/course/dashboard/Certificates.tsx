/**
 * Certificates Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState } from 'react';
import {
  Award,
  Download,
  Share2,
  Calendar,
  ExternalLink,
  Star,
  Trophy,
  Medal,
  CheckCircle,
  Lock,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import { useCertificates } from '../shared/hooks';
import { LoadingSpinner } from '../shared/LoadingComponents';

interface CertificatesProps {
  userId: string;
  className?: string;
}

interface Certificate {
  id: string;
  title: string;
  courseName: string;
  instructor: string;
  earnedAt: Date;
  validUntil?: Date;
  credentialId: string;
  downloadUrl: string;
  shareUrl: string;
  verificationUrl: string;
  skills: string[];
  grade?: number;
  courseHours: number;
  thumbnail: string;
  status: 'active' | 'expired' | 'revoked';
  metadata: {
    courseId: string;
    completionRate: number;
    finalScore: number;
    timeSpent: number; // minutes
    issuer: string;
  };
}

interface Skill {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  certificateCount: number;
  color: string;
}

type CertificateFilter = 'all' | 'active' | 'expired';
type SortOption = 'earnedAt' | 'title' | 'grade' | 'courseHours';

export function Certificates({ userId, className = '' }: CertificatesProps) {
  const [filter, setFilter] = useState<CertificateFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('earnedAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock certificates data
  const mockCertificates: Certificate[] = [
    {
      id: 'cert-1',
      title: 'Advanced React Development',
      courseName: 'React Mastery: Advanced Patterns and Best Practices',
      instructor: 'Sarah Johnson',
      earnedAt: new Date('2024-01-15'),
      validUntil: new Date('2027-01-15'),
      credentialId: 'REACT-ADV-2024-001',
      downloadUrl: '/certificates/react-advanced.pdf',
      shareUrl: 'https://certificates.example.com/react-advanced-001',
      verificationUrl: 'https://verify.example.com/REACT-ADV-2024-001',
      skills: ['React', 'JavaScript', 'Frontend Development', 'Component Architecture'],
      grade: 95,
      courseHours: 40,
      thumbnail: '/api/placeholder/400/300',
      status: 'active',
      metadata: {
        courseId: 'course-1',
        completionRate: 100,
        finalScore: 95,
        timeSpent: 2400,
        issuer: 'Miyabi Academy'
      }
    },
    {
      id: 'cert-2',
      title: 'TypeScript Fundamentals',
      courseName: 'TypeScript for JavaScript Developers',
      instructor: 'Mike Chen',
      earnedAt: new Date('2024-01-10'),
      validUntil: new Date('2027-01-10'),
      credentialId: 'TS-FUND-2024-002',
      downloadUrl: '/certificates/typescript-fundamentals.pdf',
      shareUrl: 'https://certificates.example.com/typescript-fundamentals-002',
      verificationUrl: 'https://verify.example.com/TS-FUND-2024-002',
      skills: ['TypeScript', 'JavaScript', 'Type Safety', 'Programming'],
      grade: 92,
      courseHours: 25,
      thumbnail: '/api/placeholder/400/300',
      status: 'active',
      metadata: {
        courseId: 'course-2',
        completionRate: 100,
        finalScore: 92,
        timeSpent: 1800,
        issuer: 'Miyabi Academy'
      }
    },
    {
      id: 'cert-3',
      title: 'Full Stack Development',
      courseName: 'Complete Full Stack Web Development Bootcamp',
      instructor: 'Alex Rivera',
      earnedAt: new Date('2023-12-20'),
      validUntil: new Date('2026-12-20'),
      credentialId: 'FS-DEV-2023-003',
      downloadUrl: '/certificates/fullstack-development.pdf',
      shareUrl: 'https://certificates.example.com/fullstack-development-003',
      verificationUrl: 'https://verify.example.com/FS-DEV-2023-003',
      skills: ['Full Stack', 'Node.js', 'React', 'Database Design', 'API Development'],
      grade: 88,
      courseHours: 80,
      thumbnail: '/api/placeholder/400/300',
      status: 'active',
      metadata: {
        courseId: 'course-3',
        completionRate: 100,
        finalScore: 88,
        timeSpent: 4800,
        issuer: 'Miyabi Academy'
      }
    },
    {
      id: 'cert-4',
      title: 'JavaScript Basics',
      courseName: 'Introduction to JavaScript Programming',
      instructor: 'Emma Davis',
      earnedAt: new Date('2023-11-15'),
      validUntil: new Date('2025-11-15'),
      credentialId: 'JS-BASIC-2023-004',
      downloadUrl: '/certificates/javascript-basics.pdf',
      shareUrl: 'https://certificates.example.com/javascript-basics-004',
      verificationUrl: 'https://verify.example.com/JS-BASIC-2023-004',
      skills: ['JavaScript', 'Programming Fundamentals', 'Web Development'],
      grade: 85,
      courseHours: 30,
      thumbnail: '/api/placeholder/400/300',
      status: 'expired',
      metadata: {
        courseId: 'course-4',
        completionRate: 100,
        finalScore: 85,
        timeSpent: 2200,
        issuer: 'Miyabi Academy'
      }
    }
  ];

  // Extract unique skills and their levels
  const skills: Skill[] = [
    {
      id: 'react',
      name: 'React',
      level: 'Advanced',
      certificateCount: 2,
      color: 'miyabi-blue'
    },
    {
      id: 'javascript',
      name: 'JavaScript',
      level: 'Advanced',
      certificateCount: 4,
      color: 'yellow-500'
    },
    {
      id: 'typescript',
      name: 'TypeScript',
      level: 'Intermediate',
      certificateCount: 1,
      color: 'miyabi-purple'
    },
    {
      id: 'nodejs',
      name: 'Node.js',
      level: 'Intermediate',
      certificateCount: 1,
      color: 'miyabi-green'
    },
    {
      id: 'fullstack',
      name: 'Full Stack Development',
      level: 'Intermediate',
      certificateCount: 1,
      color: 'orange-500'
    }
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-miyabi-green';
    if (grade >= 80) return 'text-miyabi-blue';
    if (grade >= 70) return 'text-orange-500';
    return 'text-red-500';
  };

  const getStatusBadge = (status: Certificate['status']) => {
    switch (status) {
      case 'active':
        return <span className="bg-miyabi-green/20 text-miyabi-green px-2 py-1 rounded-full text-xs">Active</span>;
      case 'expired':
        return <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">Expired</span>;
      case 'revoked':
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">Revoked</span>;
      default:
        return null;
    }
  };

  const filteredCertificates = mockCertificates
    .filter((cert) => {
      if (filter !== 'all' && cert.status !== filter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          cert.title.toLowerCase().includes(query) ||
          cert.courseName.toLowerCase().includes(query) ||
          cert.instructor.toLowerCase().includes(query) ||
          cert.skills.some(skill => skill.toLowerCase().includes(query))
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'grade':
          return (b.grade || 0) - (a.grade || 0);
        case 'courseHours':
          return b.courseHours - a.courseHours;
        case 'earnedAt':
        default:
          return b.earnedAt.getTime() - a.earnedAt.getTime();
      }
    });

  const CertificateCard = ({ certificate }: { certificate: Certificate }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-colors">
      {/* Certificate Preview */}
      <div className="aspect-[4/3] bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 relative overflow-hidden">
        <div className="absolute inset-0 p-6 flex flex-col justify-between">
          <div className="text-center">
            <Award className="mx-auto text-miyabi-blue mb-3" size={32} />
            <h3 className="text-lg font-bold text-white mb-1">{certificate.title}</h3>
            <p className="text-sm text-gray-300">Certificate of Completion</p>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 mb-1">Earned by</p>
            <p className="font-semibold text-white">Student Name</p>
            <p className="text-xs text-gray-400 mt-2">{formatDate(certificate.earnedAt)}</p>
          </div>
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          {getStatusBadge(certificate.status)}
        </div>

        {/* Hover Actions */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-miyabi-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Eye size={16} className="text-white" />
            </button>
            <button className="w-10 h-10 bg-miyabi-green rounded-full flex items-center justify-center hover:bg-green-600 transition-colors">
              <Download size={16} className="text-white" />
            </button>
            <button className="w-10 h-10 bg-miyabi-purple rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
              <Share2 size={16} className="text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h4 className="font-medium text-white mb-1">{certificate.courseName}</h4>
            <p className="text-sm text-gray-400">{certificate.instructor}</p>
          </div>
          {certificate.grade && (
            <div className={`text-lg font-bold ${getGradeColor(certificate.grade)}`}>
              {certificate.grade}%
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-1 mb-3">
          {certificate.skills.slice(0, 3).map((skill) => (
            <span
              key={skill}
              className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
            >
              {skill}
            </span>
          ))}
          {certificate.skills.length > 3 && (
            <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">
              +{certificate.skills.length - 3} more
            </span>
          )}
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{certificate.courseHours}h course</span>
          </div>
          <span>ID: {certificate.credentialId}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm">
            <Download size={14} />
            Download
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-3 rounded-lg transition-colors text-sm">
            <Share2 size={14} />
          </button>
          <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-3 rounded-lg transition-colors text-sm">
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  const CertificateListItem = ({ certificate }: { certificate: Certificate }) => (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 hover:border-gray-600 transition-colors">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-miyabi-blue/20 to-miyabi-purple/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Award className="text-miyabi-blue" size={24} />
        </div>

        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold text-white mb-1">{certificate.title}</h3>
              <p className="text-sm text-gray-400">{certificate.courseName}</p>
              <p className="text-xs text-gray-500">{certificate.instructor}</p>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(certificate.status)}
              {certificate.grade && (
                <div className={`text-lg font-bold ${getGradeColor(certificate.grade)}`}>
                  {certificate.grade}%
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-3 text-center">
            <div>
              <div className="text-sm font-medium text-white">{formatDate(certificate.earnedAt)}</div>
              <div className="text-xs text-gray-400">Earned</div>
            </div>
            <div>
              <div className="text-sm font-medium text-white">{certificate.courseHours}h</div>
              <div className="text-xs text-gray-400">Duration</div>
            </div>
            <div>
              <div className="text-sm font-medium text-white">{certificate.credentialId}</div>
              <div className="text-xs text-gray-400">Credential ID</div>
            </div>
            <div>
              <div className="text-sm font-medium text-white">{certificate.skills.length}</div>
              <div className="text-xs text-gray-400">Skills</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {certificate.skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex items-center gap-2 bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-3 rounded-lg transition-colors text-sm">
                <Download size={14} />
                Download
              </button>
              <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-3 rounded-lg transition-colors text-sm">
                <Share2 size={14} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">My Certificates</h1>
        <p className="text-gray-400">View and manage your earned certificates and achievements</p>
      </div>

      {/* Certificate Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-blue">{mockCertificates.length}</div>
          <div className="text-sm text-gray-400">Total Certificates</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-green">
            {mockCertificates.filter(c => c.status === 'active').length}
          </div>
          <div className="text-sm text-gray-400">Active</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-miyabi-purple">
            {skills.length}
          </div>
          <div className="text-sm text-gray-400">Skills Verified</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-orange-500">
            {mockCertificates.reduce((total, cert) => total + cert.courseHours, 0)}h
          </div>
          <div className="text-sm text-gray-400">Study Hours</div>
        </div>
      </div>

      {/* Skills Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Verified Skills</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill) => (
            <div key={skill.id} className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
              <div className={`w-10 h-10 bg-${skill.color}/20 rounded-lg flex items-center justify-center`}>
                <Medal className={`text-${skill.color}`} size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="font-medium text-white">{skill.name}</h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full bg-${skill.color}/20 text-${skill.color}`}>
                    {skill.level}
                  </span>
                  <span className="text-xs text-gray-400">
                    {skill.certificateCount} certificate{skill.certificateCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CertificateFilter)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="all">All Certificates</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
          >
            <option value="earnedAt">Date Earned</option>
            <option value="title">Title</option>
            <option value="grade">Grade</option>
            <option value="courseHours">Course Hours</option>
          </select>
        </div>
      </div>

      {/* Certificates List */}
      <div>
        {filteredCertificates.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
            <Award className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-white mb-2">No certificates found</h3>
            <p className="text-gray-400 mb-4">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters or search terms.'
                : 'Complete courses to earn certificates and showcase your skills.'
              }
            </p>
            <button className="bg-miyabi-blue hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors">
              Browse Courses
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCertificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredCertificates.map((certificate) => (
              <CertificateListItem key={certificate.id} certificate={certificate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Certificates;