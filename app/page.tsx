"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import DayTimeline from "@/components/DayTimeline";
import TaskSection from "@/components/TaskSection";
import HabitSection from "@/components/HabitSection";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [date, setDate] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDate(params.get("date") || todayStr());
    setMounted(true);
  }, []);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  const fetchAll = useCallback(() => {
    if (!date) return;
    fetch(`/api/time-blocks?date=${date}`).then((r) => r.json()).then(setTimeBlocks);
    fetch(`/api/tasks`).then((r) => r.json()).then(setTasks);
    fetch(`/api/habit-logs?date=${date}`).then((r) => r.json()).then(setHabits);
  }, [date]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function shiftDate(days: number) {
    const d = new Date(date + "T00:00:00");
    d.setDate(d.getDate() + days);
    setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  }

  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isToday = date === todayStr();

  if (!mounted) {
    return <div className="flex h-screen items-center justify-center bg-gray-50"><span className="text-gray-400">Loading...</span></div>;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Life Master</h1>
            <Link href="/task" className="text-sm text-gray-500 hover:text-gray-700">
              Tasks
            </Link>
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700">
              Calendar
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => shiftDate(-1)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50"
            >
              &larr;
            </button>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-900">{displayDate}</div>
              {!isToday && (
                <button
                  onClick={() => setDate(todayStr())}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Back to today
                </button>
              )}
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm hover:bg-gray-50"
            >
              &rarr;
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </header>

      {/* Main content: timeline + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline - main area */}
        <main className="w-[480px] shrink-0 overflow-hidden bg-white border-r border-gray-200">
          <DayTimeline blocks={timeBlocks} date={date} onRefresh={fetchAll} />
        </main>

        {/* Sidebar - tasks & habits */}
        <aside className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
          <TaskSection tasks={tasks} onRefresh={fetchAll} />
          <HabitSection habits={habits} date={date} onRefresh={fetchAll} />
        </aside>
      </div>
    </div>
  );
}
