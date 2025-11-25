/**
 * About Page
 * Issue: #1013 - Pantheon Webapp About Page
 */

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About | The Pantheon Project - AI Advisors from History',
  description:
    '19 legendary historical figures as AI advisors for the AWS Miyabi Agent system. Strategic wisdom from Sun Tzu, innovation from da Vinci, leadership from Churchill.',
  openGraph: {
    title: 'About The Pantheon Project',
    description: "History's greatest minds as AI agent advisors",
  },
};

const divisions = [
  {
    name: 'Divine Council',
    nameJa: '三神会議',
    description: 'The supreme advisory trinity providing ultimate guidance',
    advisors: 3,
    icon: '⚡',
    color: 'from-yellow-500 to-amber-600',
  },
  {
    name: 'Strategy & Philosophy',
    nameJa: '戦略・哲学',
    description: 'Masters of warfare, politics, and philosophical thought',
    advisors: 4,
    icon: '🎯',
    color: 'from-red-500 to-rose-600',
  },
  {
    name: 'Innovation & Technology',
    nameJa: '革新・技術',
    description: 'Pioneers who shaped science, art, and human progress',
    advisors: 4,
    icon: '💡',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Leadership & Management',
    nameJa: '統率・経営',
    description: 'Legendary leaders who transformed nations and industries',
    advisors: 4,
    icon: '👑',
    color: 'from-purple-500 to-violet-600',
  },
  {
    name: 'Art & Communication',
    nameJa: '芸術・伝達',
    description: 'Masters of expression, persuasion, and creative vision',
    advisors: 4,
    icon: '🎨',
    color: 'from-green-500 to-emerald-600',
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Select Your Challenge',
    description: 'Describe your problem, decision, or strategic question',
    icon: '📝',
  },
  {
    step: 2,
    title: 'Choose Advisors',
    description: 'Pick from 19 legendary historical figures across 5 divisions',
    icon: '🏛️',
  },
  {
    step: 3,
    title: 'Receive Wisdom',
    description: 'Get AI-powered insights based on their philosophies and methods',
    icon: '💎',
  },
  {
    step: 4,
    title: 'Make Decisions',
    description: 'Apply synthesized recommendations to your situation',
    icon: '🚀',
  },
];

const useCases = [
  {
    title: 'Strategic Business Decision',
    scenario: 'Entering a competitive market with limited resources',
    advisors: ['Sun Tzu', 'Machiavelli', 'Rockefeller'],
    outcome: 'Focus on positioning, form strategic alliances, control key resources',
  },
  {
    title: 'Product Innovation',
    scenario: 'Designing a revolutionary product that changes user behavior',
    advisors: ['Leonardo da Vinci', 'Steve Jobs', 'Edison'],
    outcome: 'Combine art with engineering, obsess over user experience, iterate rapidly',
  },
  {
    title: 'Leadership Challenge',
    scenario: 'Leading a team through crisis and uncertainty',
    advisors: ['Churchill', 'Oda Nobunaga', 'Catherine the Great'],
    outcome: 'Communicate vision clearly, embrace bold action, reward loyalty',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            🏛️ The Pantheon Project
          </h1>
          <p className="text-xl text-gray-300 mb-2">我々の世界 / Our World</p>
          <p className="text-2xl md:text-3xl font-light text-gray-200 mb-8">
            Where History&apos;s Greatest Minds Become Your AI Advisors
          </p>
          <div className="flex justify-center gap-8 text-lg text-gray-400">
            <span>19 Legendary Figures</span>
            <span>|</span>
            <span>5 Divisions</span>
            <span>|</span>
            <span>Infinite Wisdom</span>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Project Vision
          </h2>
          <div className="space-y-6 text-lg text-gray-600 dark:text-gray-300">
            <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
              <strong>What if</strong> you could consult Sun Tzu for your business strategy?
            </p>
            <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
              <strong>What if</strong> Leonardo da Vinci could advise on your product design?
            </p>
            <p className="text-xl font-medium text-gray-800 dark:text-gray-200">
              <strong>What if</strong> the greatest minds in history were available 24/7?
            </p>
            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-amber-500">
              <p className="text-gray-700 dark:text-gray-300">
                The Pantheon Project makes this possible by combining historical wisdom with
                cutting-edge AI technology. We&apos;ve distilled the philosophies, strategies, and
                methodologies of history&apos;s most influential figures into AI advisors that can
                help you navigate modern challenges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <div
                key={step.step}
                className="text-center p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div className="text-sm font-bold text-amber-600 mb-2">Step {step.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divisions Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            The Five Divisions
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            19 advisors organized into specialized divisions
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {divisions.map((division) => (
              <div
                key={division.name}
                className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div
                  className={`inline-block text-3xl p-3 rounded-lg bg-gradient-to-r ${division.color} text-white mb-4`}
                >
                  {division.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {division.name}
                </h3>
                <p className="text-sm text-amber-600 dark:text-amber-500 mb-3">
                  {division.nameJa} • {division.advisors} Advisors
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{division.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-16 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">
            Real-World Applications
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            See how Pantheon advisors can help with your challenges
          </p>
          <div className="space-y-6">
            {useCases.map((useCase) => (
              <div
                key={useCase.title}
                className="p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm"
              >
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {useCase.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  <strong>Scenario:</strong> {useCase.scenario}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {useCase.advisors.map((advisor) => (
                    <span
                      key={advisor}
                      className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm"
                    >
                      {advisor}
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300">
                  <strong>Synthesized Wisdom:</strong> {useCase.outcome}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Miyabi Integration Section */}
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Powered by AWS Miyabi Agent
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            The Pantheon Project integrates with the Miyabi autonomous AI development platform,
            enabling historical advisors to participate in real-world development workflows.
          </p>
          <Link
            href="/miyabi-integration"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Miyabi Integration Dashboard
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Consult the Masters?</h2>
          <p className="text-xl mb-8 text-amber-100">
            Start receiving wisdom from history&apos;s greatest minds today.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/"
              className="px-6 py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Explore Home
            </Link>
            <Link
              href="/miyabi-integration"
              className="px-6 py-3 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors"
            >
              View Integration
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
