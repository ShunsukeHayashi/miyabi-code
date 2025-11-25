/**
 * Division Detail Page
 * Issue: #1016 - Pantheon Webapp Divisions Page
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { divisions, getDivisionById } from '../../../data/divisions';
import { advisors } from '../../../data/advisors';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return divisions.map((division) => ({
    id: division.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const division = getDivisionById(id);

  if (!division) {
    return { title: 'Division Not Found' };
  }

  return {
    title: `${division.name} | The Pantheon Project`,
    description: division.description,
  };
}

export default async function DivisionDetailPage({ params }: Props) {
  const { id } = await params;
  const division = getDivisionById(id);

  if (!division) {
    notFound();
  }

  const members = advisors.filter((a) => a.division === division.name);
  const otherDivisions = divisions.filter((d) => d.id !== division.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div
        className="py-20 px-4 text-white"
        style={{ backgroundColor: division.colorHex }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-6xl mb-4">{division.icon}</div>
          <h1 className="text-4xl md:text-5xl font-bold mb-2">{division.name}</h1>
          <p className="text-2xl opacity-90 mb-4">{division.nameJa}</p>
          <p className="text-lg opacity-75 max-w-2xl mx-auto">{division.description}</p>
        </div>
      </div>

      {/* Philosophy Section */}
      <div className="bg-white dark:bg-gray-800 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
            Division Philosophy
          </h2>
          <blockquote className="text-2xl font-light text-gray-700 dark:text-gray-300 italic">
            &ldquo;{division.philosophy}&rdquo;
          </blockquote>
        </div>
      </div>

      {/* Key Strengths */}
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Key Strengths
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {division.keyStrengths.map((strength) => (
              <div
                key={strength}
                className="p-6 rounded-xl text-center bg-white dark:bg-gray-800 shadow-sm"
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: division.colorHex + '20' }}
                >
                  {division.icon}
                </div>
                <p className="font-medium text-gray-900 dark:text-white">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Members Section */}
      <div className="bg-white dark:bg-gray-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
            Division Members
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            {members.length} legendary advisors in this division
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/advisors/${member.id}`}
                className="group bg-gray-50 dark:bg-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{member.countryFlag}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
                      {member.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{member.nameJa}</p>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <p>{member.eraYears}</p>
                  <p>{member.country}</p>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {member.specialties.slice(0, 2).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Influence</span>
                  <span
                    className="font-bold"
                    style={{ color: division.colorHex }}
                  >
                    {member.influenceScore}/100
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            When to Consult This Division
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {division.useCases.map((useCase, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                  style={{ backgroundColor: division.colorHex }}
                >
                  {index + 1}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{useCase}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Other Divisions */}
      <div className="bg-white dark:bg-gray-800 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            Explore Other Divisions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherDivisions.map((other) => (
              <Link
                key={other.id}
                href={`/divisions/${other.id}`}
                className="p-4 rounded-xl text-center hover:shadow-lg transition-shadow"
                style={{ backgroundColor: other.colorHex + '10' }}
              >
                <div className="text-3xl mb-2">{other.icon}</div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                  {other.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">{other.nameJa}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div
        className="py-12 px-4 text-white"
        style={{ backgroundColor: division.colorHex }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Consult {division.name}?</h2>
          <p className="text-lg opacity-90 mb-8">
            Get strategic insights from {members.length} legendary advisors
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              href="/advisors"
              className="px-6 py-3 bg-white font-medium rounded-lg hover:bg-gray-100 transition-colors"
              style={{ color: division.colorHex }}
            >
              Browse All Advisors
            </Link>
            <Link
              href="/divisions"
              className="px-6 py-3 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
            >
              All Divisions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
