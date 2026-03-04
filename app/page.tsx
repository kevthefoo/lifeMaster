"use client";

import { useState, useEffect, useCallback } from "react";
import TimeBlockSection from "@/components/TimeBlockSection";
import TaskSection from "@/components/TaskSection";
import HabitSection from "@/components/HabitSection";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function Dashboard() {
  const [date, setDate] = useState(todayStr);
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  const fetchAll = useCallback(() => {
    fetch(`/api/time-blocks?date=${date}`).then((r) => r.json()).then(setTimeBlocks);
    fetch(`/api/tasks`).then((r) => r.json()).then(setTasks);
    fetch(`/api/habit-logs?date=${date}`).then((r) => r.json()).then(setHabits);
  }, [date]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  function shiftDate(days: number) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split("T")[0]);
  }

  const displayDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const isToday = date === todayStr();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-gray-900">Life Master</h1>
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

      <main className="mx-auto max-w-7xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <TimeBlockSection blocks={timeBlocks} date={date} onRefresh={fetchAll} />
          <TaskSection tasks={tasks} onRefresh={fetchAll} />
          <HabitSection habits={habits} date={date} onRefresh={fetchAll} />
        </div>
      </main>
    </div>
  );
}
