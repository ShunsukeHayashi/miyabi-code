/**
 * Divisions Overview Page
 * Issue: #1016 - Pantheon Webapp Divisions Page
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { divisions } from '../../data/divisions';
import { advisors } from '../../data/advisors';

export const metadata: Metadata = {
  title: 'Divisions | The Pantheon Project',
  description: 'Explore the 5 divisions of The Pantheon Project - 19 legendary historical figures organized by expertise.',
};

export default function DivisionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-gray-900 to-gray-800 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The Five Divisions</h1>
          <p className="text-xl text-gray-300 mb-2">五つの部門</p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            19 legendary historical figures organized into 5 specialized divisions, each bringing unique
            perspectives and expertise to guide your decisions.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-amber-600">5</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Divisions</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">19</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Advisors</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-600">2500+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Years of Wisdom</div>
            </div>
            <div className="hidden md:block">
              <div className="text-3xl font-bold text-amber-600">12</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Countries</div>
            </div>
            <div className="hidden md:block">
              <div className="text-3xl font-bold text-amber-600">∞</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Insights</div>
            </div>
          </div>
        </div>
      </div>

      {/* Divisions Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {divisions.map((division, index) => {
            const members = advisors.filter((a) => a.division === division.name);
            const isEven = index % 2 === 0;

            return (
              <div
                key={division.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
              >
                <div className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Color Banner */}
                  <div
                    className="md:w-1/3 p-8 flex flex-col justify-center items-center text-white"
                    style={{ backgroundColor: division.colorHex }}
                  >
                    <div className="text-6xl mb-4">{division.icon}</div>
                    <h2 className="text-2xl font-bold text-center">{division.name}</h2>
                    <p className="text-lg opacity-90">{division.nameJa}</p>
                    <div className="mt-4 text-sm opacity-75">
                      {division.memberCount} Advisors
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:w-2/3 p-8">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{division.description}</p>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Philosophy
                      </h3>
                      <p className="text-gray-700 dark:text-gray-300 italic">
                        &ldquo;{division.philosophy}&rdquo;
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Key Strengths
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {division.keyStrengths.map((strength) => (
                          <span
                            key={strength}
                            className="px-3 py-1 rounded-full text-sm"
                            style={{
                              backgroundColor: division.colorHex + '20',
                              color: division.colorHex,
                            }}
                          >
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Members
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {members.map((member) => (
                          <Link
                            key={member.id}
                            href={`/advisors/${member.id}`}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <span>{member.countryFlag}</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {member.name}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400 text-sm">
                              ({member.nameJa})
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/divisions/${division.id}`}
                        className="px-4 py-2 rounded-lg font-medium text-white"
                        style={{ backgroundColor: division.colorHex }}
                      >
                        Explore Division
                      </Link>
                      <Link
                        href={`/advisors?division=${encodeURIComponent(division.name)}`}
                        className="px-4 py-2 rounded-lg font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        View All Members
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-white dark:bg-gray-800 py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-4">
            When to Consult Each Division
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12">
            Choose the right advisors for your specific challenge
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {divisions.map((division) => (
              <div
                key={division.id}
                className="p-6 rounded-xl border-2"
                style={{ borderColor: division.colorHex + '40' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="text-2xl p-2 rounded-lg"
                    style={{ backgroundColor: division.colorHex + '20' }}
                  >
                    {division.icon}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-white">{division.name}</h3>
                </div>
                <ul className="space-y-2">
                  {division.useCases.slice(0, 3).map((useCase, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2"
                    >
                      <span style={{ color: division.colorHex }}>•</span>
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Seek Wisdom?</h2>
          <p className="text-xl mb-8 text-amber-100">
            Browse all advisors or explore specific divisions
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/advisors"
              className="px-6 py-3 bg-white text-amber-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Browse All Advisors
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 bg-amber-700 text-white font-medium rounded-lg hover:bg-amber-800 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
