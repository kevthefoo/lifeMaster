"use client";

import { useState } from "react";

interface HabitLog {
  habit_id: number;
  title: string;
  target_value: number;
  unit: string;
  current_value: number;
  log_id: number | null;
}

export default function HabitSection({
  habits,
  date,
  onRefresh,
}: {
  habits: HabitLog[];
  date: string;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !targetValue || !unit) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        target_value: parseFloat(targetValue),
        unit,
      }),
    });
    setTitle("");
    setTargetValue("");
    setUnit("");
    setShowForm(false);
    onRefresh();
  }

  async function handleIncrement(habit: HabitLog) {
    const increment = habit.target_value >= 100 ? Math.round(habit.target_value / 10) : 1;
    const newValue = Math.min(habit.current_value + increment, habit.target_value);
    await fetch("/api/habit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        habit_id: habit.habit_id,
        date,
        value: newValue,
      }),
    });
    onRefresh();
  }

  async function handleDelete(habitId: number) {
    await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
    onRefresh();
  }

  function getProgressPercent(current: number, target: number) {
    return Math.min((current / target) * 100, 100);
  }

  function getProgressColor(percent: number) {
    if (percent >= 100) return "bg-green-500";
    if (percent >= 50) return "bg-emerald-400";
    return "bg-amber-400";
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Habits</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2 rounded-lg bg-gray-50 p-3">
          <input
            type="text"
            placeholder="Habit name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Target"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
              min="1"
            />
            <input
              type="text"
              placeholder="Unit (ml, steps...)"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add Habit
          </button>
        </form>
      )}

      {habits.length === 0 ? (
        <p className="text-sm text-gray-400">No habits tracked yet.</p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => {
            const percent = getProgressPercent(habit.current_value, habit.target_value);
            return (
              <li key={habit.habit_id} className="group rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{habit.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      {habit.current_value} / {habit.target_value} {habit.unit}
                    </span>
                    <button
                      onClick={() => handleDelete(habit.habit_id)}
                      className="text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(percent)}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <button
                    onClick={() => handleIncrement(habit)}
                    disabled={percent >= 100}
                    className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
