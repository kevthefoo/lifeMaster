"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

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

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [note, setNote] = useState("");

  // Edit state
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editNote, setEditNote] = useState("");

  // Complete confirmation
  const [completeTarget, setCompleteTarget] = useState<Task | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const fetchTasks = useCallback(() => {
    fetch("/api/tasks").then((r) => r.json()).then(setTasks);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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
    fetchTasks();
  }

  async function confirmComplete() {
    if (!completeTarget) return;
    await fetch(`/api/tasks/${completeTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    setCompleteTarget(null);
    fetchTasks();
  }

  function openEdit(task: Task) {
    setEditTarget(task);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditNote(task.note || "");
  }

  async function handleEditSave() {
    if (!editTarget || !editTitle) return;
    await fetch(`/api/tasks/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        priority: editPriority,
        note: editNote,
      }),
    });
    setEditTarget(null);
    fetchTasks();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/tasks/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setEditTarget(null);
    fetchTasks();
  }

  const pending = tasks.filter((t) => t.status === "pending");
  const completed = tasks.filter((t) => t.status === "completed");

  function renderTask(task: Task) {
    return (
      <li
        key={task.id}
        className={`group flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 hover:shadow-sm transition cursor-pointer ${
          PRIORITY_COLORS[task.priority] || ""
        }`}
        onClick={() => openEdit(task)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCompleteTarget(task);
          }}
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
              className={`text-sm font-medium truncate ${
                task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {task.title}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PRIORITY_BADGES[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          {task.note && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{task.note}</p>}
        </div>
      </li>
    );
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Tasks</h1>
            <Link href="/bomb" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Bombs
            </Link>
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Calendar
            </Link>
            <Link href="/finance" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Finance
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
            >
              {showForm ? "Cancel" : "+ Add"}
            </button>
          </div>
        </div>
      </header>

      {/* Task Pool */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Task Pool</h2>
                <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                  {tasks.length}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-4">
              {pending.length > 0 && (
                <div>
                  <h3 className="mb-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                    Pending ({pending.length})
                  </h3>
                  <ul className="space-y-1.5">{pending.map(renderTask)}</ul>
                </div>
              )}
              {tasks.length === 0 && (
                <p className="text-center text-sm text-gray-300 dark:text-gray-600 py-8">No tasks yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Task</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                required
                autoFocus
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
              <textarea
                placeholder="Description (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm resize-none dark:bg-gray-700 dark:text-gray-200"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Task</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
              placeholder="Title"
            />
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm resize-none dark:bg-gray-700 dark:text-gray-200"
              rows={3}
              placeholder="Description"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditTarget(null)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => setDeleteTarget(editTarget)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={handleEditSave}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Task</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;{deleteTarget.title}&quot;?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
