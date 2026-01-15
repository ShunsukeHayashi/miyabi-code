/**
 * Assessment View Component
 * Issue #1299: Comprehensive course management UI components
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  FileText,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
import type {
  AssessmentWithRelations,
  AssessmentQuestion,
  UserAnswerData,
  AssessmentSubmission,
} from '../shared/types';

interface AssessmentViewProps {
  assessment: AssessmentWithRelations;
  onSubmit: (submission: AssessmentSubmission) => void;
  onRetry?: () => void;
  allowRetake?: boolean;
  showResults?: boolean;
  className?: string;
}

export function AssessmentView({
  assessment,
  onSubmit,
  onRetry,
  allowRetake = true,
  showResults = false,
  className = '',
}: AssessmentViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswerData>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Mock assessment data
  const mockQuestions: AssessmentQuestion[] = [
    {
      id: '1',
      type: 'multiple-choice',
      question: 'What is the primary purpose of React hooks?',
      options: [
        'To style components',
        'To manage state and side effects in functional components',
        'To handle routing',
        'To optimize performance',
      ],
      correctAnswer: 'To manage state and side effects in functional components',
      explanation: 'React hooks allow you to use state and other React features without writing class components.',
      points: 10,
    },
    {
      id: '2',
      type: 'true-false',
      question: 'React components must always return JSX elements.',
      options: ['True', 'False'],
      correctAnswer: 'False',
      explanation: 'React components can return null, strings, numbers, or other valid React elements.',
      points: 5,
    },
    {
      id: '3',
      type: 'fill-blank',
      question: 'Complete the code: const [count, setCount] = _____(0);',
      correctAnswer: 'useState',
      explanation: 'useState is the hook used to add state to functional components.',
      points: 15,
    },
    {
      id: '4',
      type: 'essay',
      question: 'Explain the difference between controlled and uncontrolled components in React. Provide examples for both.',
      points: 20,
    },
  ];

  const totalPoints = mockQuestions.reduce((sum, q) => sum + q.points, 0);
  const currentQuestion = mockQuestions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (!isStarted || !assessment.timeLimit || timeRemaining === null) {return;}

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev && prev <= 1) {
          handleSubmit(true); // Auto-submit when time runs out
          return 0;
        }
        return prev ? prev - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, assessment.timeLimit, timeRemaining]);

  const startAssessment = () => {
    setIsStarted(true);
    setStartTime(new Date());
    if (assessment.timeLimit) {
      setTimeRemaining(assessment.timeLimit * 60); // Convert minutes to seconds
    }
  };

  const handleAnswerChange = (questionId: string, answer: string | string[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { questionId, answer },
    }));
  };

  const handleSubmit = (autoSubmit = false) => {
    if (!autoSubmit && !isAnswerComplete(currentQuestion)) {
      alert('Please answer the current question before submitting.');
      return;
    }

    const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;

    const submission: AssessmentSubmission = {
      answers: Object.values(answers),
      timeSpent,
    };

    onSubmit(submission);
    setIsSubmitted(true);
  };

  const isAnswerComplete = (question: AssessmentQuestion) => {
    const answer = answers[question.id];
    if (!answer) {return false;}

    if (question.type === 'essay') {
      return typeof answer.answer === 'string' && answer.answer.trim().length > 10;
    }

    return answer.answer && answer.answer.toString().trim().length > 0;
  };

  const getAnsweredCount = () => Object.keys(answers).length;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderQuestion = (question: AssessmentQuestion) => {
    const answer = answers[question.id]?.answer || '';

    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center gap-3 p-4 border border-gray-600 rounded-lg hover:border-miyabi-blue cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="text-miyabi-blue focus:ring-miyabi-blue"
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className="flex items-center gap-3 p-4 border border-gray-600 rounded-lg hover:border-miyabi-blue cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answer === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="text-miyabi-blue focus:ring-miyabi-blue"
                />
                <span className="text-gray-300">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'fill-blank':
        return (
          <div>
            <input
              type="text"
              value={answer as string || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent"
            />
          </div>
        );

      case 'essay':
        return (
          <div>
            <textarea
              value={answer as string || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Write your answer here..."
              rows={8}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-miyabi-blue focus:border-transparent resize-none"
            />
            <div className="text-sm text-gray-400 mt-2">
              Minimum 10 characters. Current: {(answer as string || '').length}
            </div>
          </div>
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (!isStarted) {
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-miyabi-purple/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={32} className="text-miyabi-purple" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-4">{assessment.title}</h2>

          {assessment.description && (
            <p className="text-gray-300 mb-6">{assessment.description}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-miyabi-blue mb-1">
                {mockQuestions.length}
              </div>
              <div className="text-sm text-gray-400">Questions</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-miyabi-green mb-1">
                {totalPoints}
              </div>
              <div className="text-sm text-gray-400">Total Points</div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl font-bold text-miyabi-purple mb-1">
                {assessment.timeLimit ? `${assessment.timeLimit}m` : '∞'}
              </div>
              <div className="text-sm text-gray-400">Time Limit</div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-white mb-4">Instructions</h3>
            <ul className="text-left text-gray-300 space-y-2">
              <li>• Read each question carefully before answering</li>
              <li>• You can navigate between questions using the navigation buttons</li>
              <li>• All answers are auto-saved as you progress</li>
              {assessment.timeLimit && <li>• Complete within the time limit</li>}
              <li>• You can submit your answers at any time</li>
              <li>• Review your answers before final submission</li>
            </ul>
          </div>

          <button
            onClick={startAssessment}
            className="bg-miyabi-purple text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-colors flex items-center gap-2 mx-auto"
          >
            <Play size={20} />
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  if (showResults) {
    // Results view would go here
    return (
      <div className={`bg-gray-900 rounded-lg border border-gray-700 p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={32} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Assessment Complete!</h2>
        <p className="text-gray-300 mb-6">Your answers have been submitted for review.</p>
        {allowRetake && onRetry && (
          <button
            onClick={onRetry}
            className="bg-miyabi-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retake Assessment
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">{assessment.title}</h2>
            <p className="text-gray-400 text-sm mt-1">
              Question {currentQuestionIndex + 1} of {mockQuestions.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-500/20 text-red-400' : 'bg-gray-800 text-gray-300'
              }`}>
                <Clock size={16} />
                <span className="font-mono">{formatTime(timeRemaining)}</span>
              </div>
            )}

            <div className="text-sm text-gray-400">
              {getAnsweredCount()}/{mockQuestions.length} answered
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / mockQuestions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-miyabi-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / mockQuestions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex-grow">
              {currentQuestion.question}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-400 ml-4">
              <span>{currentQuestion.points} pts</span>
            </div>
          </div>

          {renderQuestion(currentQuestion)}

          {/* Question Status */}
          <div className="mt-4 flex items-center gap-2">
            {isAnswerComplete(currentQuestion) ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm">Answered</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <AlertTriangle size={16} />
                <span className="text-sm">Not answered</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReview(!showReview)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {showReview ? <EyeOff size={16} /> : <Eye size={16} />}
              Review
            </button>

            <button
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-2 bg-miyabi-purple text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Send size={16} />
              Submit Assessment
            </button>
          </div>

          <button
            onClick={() => setCurrentQuestionIndex(Math.min(mockQuestions.length - 1, currentQuestionIndex + 1))}
            disabled={currentQuestionIndex === mockQuestions.length - 1}
            className="px-4 py-2 bg-miyabi-blue text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>

        {/* Question Navigation */}
        <div className="mt-4 flex flex-wrap gap-2">
          {mockQuestions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                index === currentQuestionIndex
                  ? 'bg-miyabi-blue text-white'
                  : isAnswerComplete(mockQuestions[index])
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Review Panel */}
      {showReview && (
        <div className="border-t border-gray-700 p-6 bg-gray-800/50">
          <h4 className="font-semibold text-white mb-4">Answer Review</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {mockQuestions.map((question, index) => (
              <div
                key={question.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  index === currentQuestionIndex ? 'bg-miyabi-blue/20' : ''
                }`}
              >
                <span className="text-sm text-gray-300">
                  Question {index + 1}: {question.question.substring(0, 50)}...
                </span>
                <div className="flex items-center gap-2">
                  {isAnswerComplete(question) ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <AlertTriangle size={16} className="text-gray-400" />
                  )}
                  <button
                    onClick={() => setCurrentQuestionIndex(index)}
                    className="text-miyabi-blue hover:text-blue-400 text-sm"
                  >
                    Go to
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssessmentView;
