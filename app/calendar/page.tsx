"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface DayData {
  events: number;
  tasks: number;
  bombs: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CalendarPage() {
  const today = todayStr();
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth()); // 0-based
  const [data, setData] = useState<Record<string, DayData>>({});

  const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;

  const fetchData = useCallback(() => {
    fetch(`/api/calendar?month=${monthStr}`)
      .then((r) => r.json())
      .then(setData);
  }, [monthStr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function shiftMonth(delta: number) {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }

  function goToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
  }

  const displayMonth = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calendar grid
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build 6-week grid (42 cells)
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length < 42) cells.push(null);

  function dateStr(day: number) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function renderDots(count: number, color: string, max: number = 5) {
    const shown = Math.min(count, max);
    return Array.from({ length: shown }, (_, i) => (
      <span
        key={i}
        className={`inline-block h-1.5 w-1.5 rounded-full ${color}`}
      />
    ));
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              &larr; Schedule
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
            <Link href="/bomb" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Bombs
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => shiftMonth(-1)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
            >
              &larr;
            </button>
            <div className="text-center min-w-[160px]">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{displayMonth}</span>
            </div>
            <button
              onClick={() => shiftMonth(1)}
              className="rounded-md border border-gray-300 dark:border-gray-600 px-2.5 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-gray-300"
            >
              &rarr;
            </button>
            {(year !== new Date().getFullYear() || month !== new Date().getMonth()) && (
              <button
                onClick={goToday}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                Today
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 border-t border-l border-gray-200 dark:border-gray-700">
            {cells.map((day, i) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${i}`}
                    className="border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 min-h-[90px]"
                  />
                );
              }

              const ds = dateStr(day);
              const isToday = ds === today;
              const dayData = data[ds];
              const eventCount = dayData?.events || 0;
              const taskCount = dayData?.tasks || 0;
              const bombCount = dayData?.bombs || 0;

              return (
                <Link
                  key={day}
                  href={`/?date=${ds}`}
                  className={`border-r border-b border-gray-200 dark:border-gray-700 min-h-[90px] p-2 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition flex flex-col ${
                    isToday ? "bg-blue-50 dark:bg-blue-900/30" : "bg-white dark:bg-gray-900"
                  }`}
                >
                  <span
                    className={`text-sm font-medium inline-flex items-center justify-center h-6 w-6 rounded-full ${
                      isToday
                        ? "bg-blue-600 text-white"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-auto flex flex-col gap-1 pt-1">
                    {eventCount > 0 && (
                      <div className="flex gap-0.5 flex-wrap">
                        {renderDots(eventCount, "bg-green-500")}
                      </div>
                    )}
                    {taskCount > 0 && (
                      <div className="flex gap-0.5 flex-wrap">
                        {renderDots(taskCount, "bg-yellow-400")}
                      </div>
                    )}
                    {bombCount > 0 && (
                      <div className="flex gap-0.5 flex-wrap">
                        {Array.from({ length: Math.min(bombCount, 5) }, (_, i) => (
                          <span key={i} className="text-xs leading-none">💣</span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Scheduled events
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-yellow-400" />
              Daily tasks
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs leading-none">💣</span>
              Bombs
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
