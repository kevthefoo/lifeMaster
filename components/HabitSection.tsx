"use client";

import { useState } from "react";

interface HabitLog {
  habit_id: number;
  title: string;
  habit_type: string;
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
  const [habitType, setHabitType] = useState<"checkbox" | "measurable">("checkbox");
  const [targetValue, setTargetValue] = useState("");
  const [unit, setUnit] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    if (habitType === "measurable" && (!targetValue || !unit)) return;
    await fetch("/api/habits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        habit_type: habitType,
        target_value: habitType === "measurable" ? parseFloat(targetValue) : 1,
        unit: habitType === "measurable" ? unit : "",
      }),
    });
    setTitle("");
    setHabitType("checkbox");
    setTargetValue("");
    setUnit("");
    setShowForm(false);
    onRefresh();
  }

  async function handleToggle(habit: HabitLog) {
    const newValue = habit.current_value >= 1 ? 0 : 1;
    await fetch("/api/habit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habit.habit_id, date, value: newValue }),
    });
    onRefresh();
  }

  async function handleIncrement(habit: HabitLog) {
    const increment = habit.target_value >= 100 ? Math.round(habit.target_value / 10) : 1;
    const newValue = Math.min(habit.current_value + increment, habit.target_value);
    await fetch("/api/habit-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ habit_id: habit.habit_id, date, value: newValue }),
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
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Habit Tracker</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          <input
            type="text"
            placeholder="Habit name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
            required
          />
          <div className="flex gap-1 rounded-lg bg-gray-200 dark:bg-gray-700 p-1">
            <button
              type="button"
              onClick={() => setHabitType("checkbox")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                habitType === "checkbox"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Checkbox
            </button>
            <button
              type="button"
              onClick={() => setHabitType("measurable")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                habitType === "measurable"
                  ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              Measurable
            </button>
          </div>
          {habitType === "measurable" && (
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Target"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                required
                min="1"
              />
              <input
                type="text"
                placeholder="Unit (ml, steps...)"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>
          )}
          <button
            type="submit"
            className="w-full rounded-md bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Add Habit
          </button>
        </form>
      )}

      {habits.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No habits tracked yet.</p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => {
            const isCheckbox = habit.habit_type === "checkbox";
            const isDone = habit.current_value >= 1;
            const percent = getProgressPercent(habit.current_value, habit.target_value);

            return (
              <li key={habit.habit_id} className="group rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCheckbox && (
                      <button
                        onClick={() => handleToggle(habit)}
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                          isDone
                            ? "border-emerald-600 bg-emerald-600 text-white"
                            : "border-gray-300 dark:border-gray-600 hover:border-emerald-400"
                        }`}
                      >
                        {isDone && (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    )}
                    <span className={`font-medium ${isCheckbox && isDone ? "text-gray-400 line-through" : "text-gray-900 dark:text-gray-100"}`}>
                      {habit.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isCheckbox && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {habit.current_value} / {habit.target_value} {habit.unit}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(habit.habit_id)}
                      className="text-gray-300 dark:text-gray-600 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                {!isCheckbox && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className={`h-full rounded-full transition-all ${getProgressColor(percent)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <button
                      onClick={() => handleIncrement(habit)}
                      disabled={percent >= 100}
                      className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/70 disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
