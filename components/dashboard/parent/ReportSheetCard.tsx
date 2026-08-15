'use client';

/**
 * @file components/dashboard/parent/ReportSheetCard.tsx
 * @description Reusable Report Sheet Card Component.
 * Renders the full Eduland School report sheet format with school logo, pupil passport photo,
 * attendance stats, overall metrics bar, scores table, dynamic grading key legend,
 * general comment, and next term begins date.
 * Shared between Current Report and Report History views for 100% visual parity.
 */

import {
  User,
  Clock,
  Award,
  MessageSquare,
  Calendar,
  Sparkles,
} from 'lucide-react';
import {
  GradingKeyItem,
  ScoreItem,
} from '@/components/dashboard/parent/ParentReportClient';

export interface ReportSheetCardProps {
  studentName: string;
  className: string;
  classTeacherName?: string | null;
  signedPassportUrl?: string | null;
  termName?: string | null;
  session?: string | null;
  nextTermBegins?: string | null;
  daysOpened: number;
  daysPresent: number;
  scores: ScoreItem[];
  gradingKeys: GradingKeyItem[];
  generalComment?: string | null;
  commentTeacherName?: string | null;
}

/**
 * Helper function to compute letter grade and label based on score and grading keys.
 */
export function computeGrade(score: number, keys: GradingKeyItem[]) {
  if (keys && keys.length > 0) {
    const roundedScore = Math.round(score);
    const match = keys.find(
      (k) => roundedScore >= k.min_score && roundedScore <= k.max_score
    );
    if (match) {
      return { letter: match.grade_letter, label: match.label };
    }
  }

  // Fallback standard grading scale if no keys match
  if (score >= 70) return { letter: 'A', label: 'Excellent' };
  if (score >= 60) return { letter: 'B', label: 'Very Good' };
  if (score >= 50) return { letter: 'C', label: 'Good' };
  if (score >= 45) return { letter: 'D', label: 'Fairly Good' };
  if (score >= 40) return { letter: 'E', label: 'Average' };
  return { letter: 'F', label: 'Needs Improvement' };
}

/**
 * Returns Tailwind color badge style for grade letters.
 */
export function getGradeBadgeStyle(letter: string) {
  switch (letter.toUpperCase()) {
    case 'A':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'B':
      return 'bg-green-100 text-green-900 border-green-300';
    case 'C':
      return 'bg-blue-100 text-blue-900 border-blue-300';
    case 'D':
    case 'E':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    default:
      return 'bg-red-100 text-red-900 border-red-300';
  }
}

/**
 * Formats ISO date string to readable format e.g., "Monday, 24th February, 2025"
 */
export function formatDate(dateStr?: string | null) {
  if (!dateStr) return 'TBA';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default function ReportSheetCard({
  studentName,
  className,
  classTeacherName,
  signedPassportUrl,
  termName,
  session,
  nextTermBegins,
  daysOpened,
  daysPresent,
  scores,
  gradingKeys,
  generalComment,
  commentTeacherName,
}: ReportSheetCardProps) {
  const hasScores = scores && scores.length > 0;

  // Calculated totals
  const totalHW = scores.reduce((acc, curr) => acc + (curr.hw || 0), 0);
  const totalCW = scores.reduce((acc, curr) => acc + (curr.cw || 0), 0);
  const totalTest = scores.reduce((acc, curr) => acc + (curr.test || 0), 0);
  const totalScoreSum = scores.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const maxPossibleMarks = scores.length * 100;
  const percentage = maxPossibleMarks > 0 ? Math.round((totalScoreSum / maxPossibleMarks) * 100) : 0;
  const overallGrade = computeGrade(percentage, gradingKeys);

  return (
    <div className="bg-white rounded-2xl border border-olive-200 shadow-md overflow-hidden">
      {/* Header School Banner */}
      <div className="bg-white p-6 border-b border-olive-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* School Logo */}
          <div className="w-20 h-20 bg-white rounded-2xl p-1.5 shadow-sm border border-olive-200 flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Eduland School Logo"
              className="w-full h-full object-contain"
            />
          </div>

          {/* School Address Header */}
          <div className="text-center flex-1 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-olive-950 tracking-tight">
              EDULAND SCHOOLS
            </h1>
            <p className="text-xs font-semibold text-olive-700">
              <span className="font-bold text-olive-900">Address:</span> 53, Akowonjo-Egbeda Road, Akowonjo, Lagos.
            </p>
            <p className="text-xs text-olive-700 font-medium">
              <span className="font-bold text-olive-900">Email:</span> info@edulandschools.com | <span className="font-bold text-olive-900">Website:</span> edulandschools.com
            </p>
          </div>

          {/* Pupil Passport Photo */}
          <div className="w-24 h-28 bg-olive-50 rounded-xl border-2 border-olive-200 overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
            {signedPassportUrl ? (
              <img
                src={signedPassportUrl}
                alt={studentName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2 text-olive-400">
                <User className="w-10 h-10 mx-auto mb-1" />
                <span className="text-3xs font-bold uppercase block">No Photo</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pupil & Term Identification Bar */}
      <div className="bg-olive-900 text-white p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
          <div className="lg:col-span-2">
            <label className="text-3xs font-extrabold uppercase tracking-wider text-schoolYellow-400 block">
              Name of Pupil:
            </label>
            <span className="text-base font-extrabold text-white tracking-tight">
              {studentName}
            </span>
          </div>

          <div>
            <label className="text-3xs font-extrabold uppercase tracking-wider text-schoolYellow-400 block">
              Class:
            </label>
            <span className="text-sm font-bold text-white">
              {className}
            </span>
          </div>

          <div>
            <label className="text-3xs font-extrabold uppercase tracking-wider text-schoolYellow-400 block">
              Term & Session:
            </label>
            <span className="text-sm font-bold text-white">
              {termName ? `${termName} (${session || 'N/A'})` : 'N/A'}
            </span>
          </div>

          <div>
            <label className="text-3xs font-extrabold uppercase tracking-wider text-schoolYellow-400 block">
              Attendance:
            </label>
            <span className="text-xs font-bold text-white">
              {daysPresent} / {daysOpened} Days
            </span>
          </div>
        </div>
      </div>

      {/* Report Content Section */}
      {!hasScores ? (
        <div className="p-12 text-center space-y-3 bg-olive-50/50">
          <Clock className="w-12 h-12 text-olive-400 mx-auto" />
          <h3 className="text-lg font-extrabold text-olive-950">
            No Academic Scores Recorded
          </h3>
          <p className="text-olive-700 text-sm font-medium max-w-md mx-auto">
            Scores for <span className="font-bold text-olive-900">{studentName}</span> have not been recorded for {termName ? `${termName} (${session})` : 'this term'}.
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Prominent Overall Summary Bar */}
          <div className="bg-olive-50 rounded-2xl p-5 border border-olive-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-white rounded-xl border border-olive-200 shadow-xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-olive-600 block mb-1">
                Overall Total
              </span>
              <span className="text-xl font-black text-olive-950">
                {maxPossibleMarks}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-olive-200 shadow-xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-olive-600 block mb-1">
                Total Score
              </span>
              <span className="text-xl font-black text-olive-950">
                {totalScoreSum}
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-olive-200 shadow-xs">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-olive-600 block mb-1">
                Percentage
              </span>
              <span className="text-xl font-black text-olive-950">
                {percentage}%
              </span>
            </div>

            <div className="p-3 bg-white rounded-xl border border-olive-200 shadow-xs flex flex-col items-center justify-center">
              <span className="text-3xs font-extrabold uppercase tracking-wider text-olive-600 block mb-1">
                Overall Grade
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-base font-black border ${getGradeBadgeStyle(
                  overallGrade.letter
                )}`}
              >
                {overallGrade.letter} ({overallGrade.label})
              </span>
            </div>
          </div>

          {/* Subject Scores Table */}
          <div className="overflow-x-auto rounded-xl border border-olive-200 shadow-xs">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-olive-800 text-white text-xs uppercase font-extrabold tracking-wider">
                  <th className="py-3 px-3.5 text-center w-12 border-r border-olive-700">#</th>
                  <th className="py-3 px-4 border-r border-olive-700">Subject Name</th>
                  <th className="py-3 px-3 text-center border-r border-olive-700 w-24">
                    H/W <span className="block text-3xs font-normal text-olive-200">(20)</span>
                  </th>
                  <th className="py-3 px-3 text-center border-r border-olive-700 w-24">
                    C/W <span className="block text-3xs font-normal text-olive-200">(20)</span>
                  </th>
                  <th className="py-3 px-3 text-center border-r border-olive-700 w-24">
                    Test <span className="block text-3xs font-normal text-olive-200">(60)</span>
                  </th>
                  <th className="py-3 px-3 text-center border-r border-olive-700 w-24">
                    Total <span className="block text-3xs font-normal text-olive-200">(100)</span>
                  </th>
                  <th className="py-3 px-3 text-center border-r border-olive-700 w-24">Grade</th>
                  <th className="py-3 px-4">Subject Teacher</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-200 text-olive-900 bg-white font-medium">
                {scores.map((score, idx) => {
                  const rowGrade = computeGrade(score.total, gradingKeys);
                  return (
                    <tr
                      key={score.id || idx}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-olive-50/40'}
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-olive-600 border-r border-olive-200 text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-extrabold text-olive-950 border-r border-olive-200">
                        {score.subject_name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold border-r border-olive-200">
                        {score.hw}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold border-r border-olive-200">
                        {score.cw}
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold border-r border-olive-200">
                        {score.test}
                      </td>
                      <td className="py-2.5 px-3 text-center font-black text-olive-950 border-r border-olive-200 text-base">
                        {score.total}
                      </td>
                      <td className="py-2.5 px-3 text-center border-r border-olive-200">
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-black border ${getGradeBadgeStyle(
                            rowGrade.letter
                          )}`}
                        >
                          {rowGrade.letter}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-xs font-semibold text-olive-700">
                        {score.teacher_name || 'Assigned Teacher'}
                      </td>
                    </tr>
                  );
                })}

                {/* Summary Totals Row */}
                <tr className="bg-olive-900 text-white font-black text-xs uppercase tracking-wider">
                  <td colSpan={2} className="py-3 px-4 text-right border-r border-olive-700">
                    Summary Totals:
                  </td>
                  <td className="py-3 px-3 text-center border-r border-olive-700">
                    {totalHW}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-olive-700">
                    {totalCW}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-olive-700">
                    {totalTest}
                  </td>
                  <td className="py-3 px-3 text-center border-r border-olive-700 text-sm text-schoolYellow-400">
                    {totalScoreSum} / {maxPossibleMarks}
                  </td>
                  <td colSpan={2} className="py-3 px-4 text-center text-schoolYellow-400">
                    Overall: {percentage}% ({overallGrade.letter})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Dynamic Grading Key Legend Band */}
          <div className="bg-olive-50 p-4 rounded-xl border border-olive-200 space-y-2">
            <label className="text-3xs font-extrabold uppercase text-olive-800 tracking-wider flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-schoolYellow-600" />
              <span>Grading Key Legend:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {(gradingKeys && gradingKeys.length > 0
                ? gradingKeys
                : [
                    { id: '1', grade_letter: 'A', label: 'Excellent', min_score: 70, max_score: 100 },
                    { id: '2', grade_letter: 'B', label: 'Very Good', min_score: 60, max_score: 69 },
                    { id: '3', grade_letter: 'C', label: 'Good', min_score: 50, max_score: 59 },
                    { id: '4', grade_letter: 'D', label: 'Fairly Good', min_score: 45, max_score: 49 },
                    { id: '5', grade_letter: 'E', label: 'Average', min_score: 40, max_score: 44 },
                    { id: '6', grade_letter: 'F', label: 'Needs Improvement', min_score: 0, max_score: 39 },
                  ]
              ).map((keyItem) => (
                <div
                  key={keyItem.id}
                  className="bg-white p-2.5 rounded-lg border border-olive-200 text-center shadow-2xs"
                >
                  <span className="text-xs font-black text-olive-950 block">
                    {keyItem.grade_letter} &rarr; {keyItem.label}
                  </span>
                  <span className="text-3xs font-bold text-olive-600 font-mono">
                    {keyItem.min_score} &ndash; {keyItem.max_score}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* General Comment & Sign-Off Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* General Comment Box */}
            <div className="bg-white p-5 rounded-xl border border-olive-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-olive-900 tracking-wider flex items-center space-x-1.5 mb-2">
                  <MessageSquare className="w-4 h-4 text-schoolYellow-600" />
                  <span>General Comment:</span>
                </h3>
                <p className="text-xs text-olive-800 font-medium leading-relaxed italic bg-olive-50/60 p-3.5 rounded-lg border border-olive-100">
                  "{generalComment || 'No general comment entered for this term.'}"
                </p>
              </div>

              <div className="pt-3 border-t border-olive-100 flex items-center justify-between text-xs">
                <span className="font-bold text-olive-700">Class Teacher:</span>
                <span className="font-black text-olive-950">
                  {commentTeacherName || classTeacherName || 'Class Teacher'}
                </span>
              </div>
            </div>

            {/* Attendance & Next Term Schedule Box */}
            <div className="bg-white p-5 rounded-xl border border-olive-200 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-olive-900 tracking-wider flex items-center space-x-1.5 mb-3">
                  <Calendar className="w-4 h-4 text-schoolYellow-600" />
                  <span>School Schedule & Attendance:</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-center mb-3">
                  <div className="p-3 bg-olive-50 rounded-lg border border-olive-100">
                    <span className="text-3xs font-extrabold uppercase text-olive-600 block mb-0.5">
                      Days Opened
                    </span>
                    <span className="text-base font-black text-olive-950">
                      {daysOpened}
                    </span>
                  </div>

                  <div className="p-3 bg-olive-50 rounded-lg border border-olive-100">
                    <span className="text-3xs font-extrabold uppercase text-olive-600 block mb-0.5">
                      Days Present
                    </span>
                    <span className="text-base font-black text-olive-950">
                      {daysPresent}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-schoolYellow-100/70 border border-schoolYellow-300 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-olive-950 font-extrabold">
                  <Sparkles className="w-4 h-4 text-schoolYellow-700 shrink-0" />
                  <span>Next Term Begins:</span>
                </div>
                <span className="font-black text-olive-950">
                  {formatDate(nextTermBegins)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
