"use client";

import { useState } from "react";

interface Task {
  id: number;
  title: string;
  list_type: string;
  priority: string;
  deadline: string | null;
  status: string;
  note: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-yellow-500 bg-yellow-50",
  low: "border-l-green-500 bg-green-50",
};

const PRIORITY_BADGES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

export default function TaskSection({
  tasks,
  onRefresh,
}: {
  tasks: Task[];
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<string>("daily");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [note, setNote] = useState("");

  const filteredTasks = tasks.filter((t) => t.list_type === activeTab);
  const tabs = ["daily", "weekly", "monthly"] as const;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        list_type: activeTab,
        priority,
        note,
      }),
    });
    setTitle("");
    setPriority("medium");
    setNote("");
    setShowForm(false);
    onRefresh();
  }

  async function handleToggle(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: task.status === "completed" ? "pending" : "completed",
      }),
    });
    onRefresh();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    onRefresh();
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2 rounded-lg bg-gray-50 p-3">
          <input
            type="text"
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700"
          >
            Add Task
          </button>
        </form>
      )}

      {filteredTasks.length === 0 ? (
        <p className="text-sm text-gray-400">No {activeTab} tasks yet.</p>
      ) : (
        <ul className="space-y-2">
          {filteredTasks.map((task) => (
            <li
              key={task.id}
              className={`group flex items-center gap-3 rounded-lg border-l-4 px-4 py-3 ${
                PRIORITY_COLORS[task.priority] || ""
              }`}
            >
              <button
                onClick={() => handleToggle(task)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                  task.status === "completed"
                    ? "border-purple-600 bg-purple-600 text-white"
                    : "border-gray-300 hover:border-purple-400"
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
                      task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"
                    }`}
                  >
                    {task.title}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${PRIORITY_BADGES[task.priority]}`}>
                    {task.priority}
                  </span>
                </div>
                {task.note && <p className="mt-0.5 text-xs text-gray-500">{task.note}</p>}
              </div>
              <button
                onClick={() => handleDelete(task.id)}
                className="text-gray-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
