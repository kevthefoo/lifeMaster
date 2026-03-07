"use client";

import { useState, useEffect, useCallback, DragEvent } from "react";
import Link from "next/link";

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

const COLUMNS = ["daily", "weekly", "monthly"] as const;

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [addColumn, setAddColumn] = useState<string>("daily");
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");

  // Edit state
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editDeadline, setEditDeadline] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editListType, setEditListType] = useState("daily");

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  // Drag state
  const [dragId, setDragId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

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
      body: JSON.stringify({
        title,
        list_type: addColumn,
        priority,
        deadline: deadline || null,
        note,
      }),
    });
    setTitle("");
    setPriority("medium");
    setDeadline("");
    setNote("");
    setShowForm(false);
    fetchTasks();
  }

  async function handleToggle(task: Task) {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: task.status === "completed" ? "pending" : "completed",
      }),
    });
    fetchTasks();
  }

  function openEdit(task: Task) {
    setEditTarget(task);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDeadline(task.deadline || "");
    setEditNote(task.note || "");
    setEditListType(task.list_type);
  }

  async function handleEditSave() {
    if (!editTarget || !editTitle) return;
    await fetch(`/api/tasks/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        priority: editPriority,
        deadline: editDeadline || null,
        note: editNote,
        list_type: editListType,
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

  // Drag handlers
  function onDragStart(e: DragEvent, task: Task) {
    setDragId(task.id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOver(e: DragEvent, column: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTarget(column);
  }

  function onDragLeave() {
    setDropTarget(null);
  }

  async function onDrop(e: DragEvent, column: string) {
    e.preventDefault();
    setDropTarget(null);
    if (dragId === null) return;

    const task = tasks.find((t) => t.id === dragId);
    if (!task || task.list_type === column) {
      setDragId(null);
      return;
    }

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === dragId ? { ...t, list_type: column } : t))
    );
    setDragId(null);

    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list_type: column }),
    });
    fetchTasks();
  }

  function onDragEnd() {
    setDragId(null);
    setDropTarget(null);
  }

  function renderTask(task: Task) {
    const isDragging = dragId === task.id;
    return (
      <li
        key={task.id}
        draggable
        onDragStart={(e) => onDragStart(e, task)}
        onDragEnd={onDragEnd}
        className={`group flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition ${
          PRIORITY_COLORS[task.priority] || ""
        } ${isDragging ? "opacity-40" : ""}`}
        onClick={() => openEdit(task)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggle(task);
          }}
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
              className={`text-sm font-medium truncate ${
                task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"
              }`}
            >
              {task.title}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PRIORITY_BADGES[task.priority]}`}>
              {task.priority}
            </span>
          </div>
          {task.deadline && (
            <p className="mt-0.5 text-xs text-gray-500">
              Due: {new Date(task.deadline + "T00:00:00").toLocaleDateString()}
            </p>
          )}
          {task.note && <p className="mt-0.5 text-xs text-gray-500 truncate">{task.note}</p>}
        </div>
      </li>
    );
  }

  function renderColumn(column: string) {
    const columnTasks = tasks.filter((t) => t.list_type === column);
    const pending = columnTasks.filter((t) => t.status === "pending");
    const completed = columnTasks.filter((t) => t.status === "completed");
    const isOver = dropTarget === column;

    return (
      <div
        key={column}
        className={`flex flex-col rounded-xl border bg-white shadow-sm transition-colors ${
          isOver ? "border-purple-400 bg-purple-50/30" : "border-gray-200"
        }`}
        onDragOver={(e) => onDragOver(e, column)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, column)}
      >
        {/* Column header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 capitalize">{column}</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {columnTasks.length}
            </span>
          </div>
          <button
            onClick={() => {
              setAddColumn(column);
              setShowForm(true);
            }}
            className="text-gray-400 hover:text-purple-600 transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Pending ({pending.length})
              </h3>
              <ul className="space-y-1.5">{pending.map(renderTask)}</ul>
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <h3 className="mb-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide">
                Completed ({completed.length})
              </h3>
              <ul className="space-y-1.5">{completed.map(renderTask)}</ul>
            </div>
          )}
          {columnTasks.length === 0 && (
            <p className="text-center text-sm text-gray-300 py-8">No tasks</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
              &larr; Schedule
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700">
              Calendar
            </Link>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setAddColumn("daily");
            }}
            className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700"
          >
            {showForm ? "Cancel" : "+ Add"}
          </button>
        </div>
      </header>

      {/* 3-column layout */}
      <div className="flex-1 overflow-hidden p-4">
        <div className="grid h-full grid-cols-3 gap-4">
          {COLUMNS.map(renderColumn)}
        </div>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Task — <span className="capitalize">{addColumn}</span>
            </h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Task title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
                autoFocus
              />
              <div className="flex gap-3">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <textarea
                placeholder="Description (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
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
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Edit Task</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Title"
            />
            <div className="flex gap-3">
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <select
                value={editListType}
                onChange={(e) => setEditListType(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <input
              type="date"
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={3}
              placeholder="Description"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
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

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Task</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete &quot;{deleteTarget.title}&quot;?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
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
