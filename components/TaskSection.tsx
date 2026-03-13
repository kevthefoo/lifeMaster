"use client";

import { useState } from "react";

interface Task {
  id: number;
  title: string;
  priority: string;
  status: string;
  note: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-red-500 bg-red-50 dark:bg-red-900/30",
  medium: "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/30",
  low: "border-l-green-500 bg-green-50 dark:bg-green-900/30",
};

const PRIORITY_BADGES: Record<string, string> = {
  high: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  medium: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  low: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

export default function TaskSection({
  tasks,
  onRefresh,
}: {
  tasks: Task[];
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [note, setNote] = useState("");
  const [completeTarget, setCompleteTarget] = useState<Task | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, priority, note }),
    });
    setTitle("");
    setPriority("medium");
    setNote("");
    setShowForm(false);
    onRefresh();
  }

  async function confirmComplete() {
    if (!completeTarget) return;
    await fetch(`/api/tasks/${completeTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setCompleteTarget(null);
    onRefresh();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 shadow-sm h-80 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Task Pool</h2>
          <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
            required
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
          >
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Add Task
          </button>
        </form>
      )}

      {tasks.filter((t) => t.status !== "completed").length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500">No tasks yet.</p>
      ) : (
        <ul className="space-y-2 flex-1 overflow-y-scroll">
          {tasks.filter((t) => t.status !== "completed").map((task) => (
            <li
              key={task.id}
              className={`group flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 ${
                PRIORITY_COLORS[task.priority] || ""
              }`}
            >
              <button
                onClick={() => setCompleteTarget(task)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                  task.status === "completed"
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-gray-300 dark:border-gray-600 hover:border-purple-400"
                }`}
              >
                {task.status === "completed" && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_BADGES[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                {task.note && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{task.note}</p>}
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-300 dark:text-gray-600 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Complete confirmation modal */}
      {completeTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Complete Task</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Mark &quot;{completeTarget.title}&quot; as completed?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setCompleteTarget(null)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmComplete}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
