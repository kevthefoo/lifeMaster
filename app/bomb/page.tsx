"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Bomb {
  id: number;
  title: string;
  deadline: string;
  deadline_time: string | null;
  priority: string;
  note: string;
  status: string;
  created_at: string;
}

const PRIORITY_BADGES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

type SortMode = "deadline" | "priority";
type FilterMode = "active" | "all" | "defused" | "exploded";

function getTimeRemaining(deadline: string, deadlineTime: string | null): number {
  const target = deadlineTime
    ? new Date(`${deadline}T${deadlineTime}`)
    : new Date(`${deadline}T23:59:59`);
  return target.getTime() - Date.now();
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "EXPLODED";
  const totalMin = Math.floor(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function getUrgencyClasses(ms: number, status: string): string {
  if (status === "exploded") return "bg-gray-100 border-gray-400 text-gray-500";
  if (status === "defused") return "bg-green-50 border-green-400 text-green-800";
  const days = ms / 86400000;
  if (days < 0) return "bg-gray-100 border-gray-400 text-gray-500";
  if (days < 1) return "bg-red-50 border-red-500 text-red-900 animate-pulse";
  if (days < 3) return "bg-orange-50 border-orange-400 text-orange-900";
  if (days < 7) return "bg-yellow-50 border-yellow-400 text-yellow-900";
  return "bg-blue-50 border-blue-400 text-blue-900";
}

export default function BombPage() {
  const [bombs, setBombs] = useState<Bomb[]>([]);
  const [sortMode, setSortMode] = useState<SortMode>("deadline");
  const [filterMode, setFilterMode] = useState<FilterMode>("active");
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [deadlineTime, setDeadlineTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [note, setNote] = useState("");
  const [editTarget, setEditTarget] = useState<Bomb | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editDeadlineTime, setEditDeadlineTime] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editNote, setEditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Bomb | null>(null);
  const [, setTick] = useState(0);

  const fetchBombs = useCallback(() => {
    const params = filterMode === "all" ? "" : `?status=${filterMode}`;
    fetch(`/api/bombs${params}`)
      .then((r) => r.json())
      .then(setBombs);
  }, [filterMode]);

  useEffect(() => {
    fetchBombs();
  }, [fetchBombs]);

  // Countdown timer - refresh every 60s and auto-explode overdue bombs
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
      // Auto-explode overdue active bombs
      bombs.forEach((bomb) => {
        if (bomb.status === "active") {
          const remaining = getTimeRemaining(bomb.deadline, bomb.deadline_time);
          if (remaining <= 0) {
            fetch(`/api/bombs/${bomb.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "exploded" }),
            }).then(() => fetchBombs());
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [bombs, fetchBombs]);

  const sorted = [...bombs].sort((a, b) => {
    if (sortMode === "priority") {
      const pOrder: Record<string, number> = { high: 1, medium: 2, low: 3 };
      const diff = (pOrder[a.priority] || 2) - (pOrder[b.priority] || 2);
      if (diff !== 0) return diff;
    }
    return a.deadline.localeCompare(b.deadline);
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !deadline) return;
    await fetch("/api/bombs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        deadline,
        deadline_time: deadlineTime || null,
        priority,
        note,
      }),
    });
    setTitle("");
    setDeadline("");
    setDeadlineTime("");
    setPriority("medium");
    setNote("");
    setShowForm(false);
    fetchBombs();
  }

  function openEdit(bomb: Bomb) {
    setEditTarget(bomb);
    setEditTitle(bomb.title);
    setEditDeadline(bomb.deadline);
    setEditDeadlineTime(bomb.deadline_time || "");
    setEditPriority(bomb.priority);
    setEditNote(bomb.note || "");
  }

  async function handleEditSave() {
    if (!editTarget || !editTitle || !editDeadline) return;
    await fetch(`/api/bombs/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        deadline: editDeadline,
        deadline_time: editDeadlineTime || null,
        priority: editPriority,
        note: editNote,
      }),
    });
    setEditTarget(null);
    fetchBombs();
  }

  async function handleDefuse(bomb: Bomb) {
    await fetch(`/api/bombs/${bomb.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "defused" }),
    });
    fetchBombs();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/bombs/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setEditTarget(null);
    fetchBombs();
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
            <h1 className="text-xl font-bold text-gray-900">Bombs</h1>
            <Link href="/task" className="text-sm text-gray-500 hover:text-gray-700">
              Tasks
            </Link>
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700">
              Calendar
            </Link>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            {showForm ? "Cancel" : "Plant Bomb"}
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Sort:</span>
          <button
            onClick={() => setSortMode("deadline")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              sortMode === "deadline" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Deadline
          </button>
          <button
            onClick={() => setSortMode("priority")}
            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
              sortMode === "priority" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Priority
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Filter:</span>
          {(["active", "all", "defused", "exploded"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterMode(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                filterMode === f ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bomb list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {sorted.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-12">No bombs found. Plant one!</p>
          )}
          {sorted.map((bomb) => {
            const remaining = getTimeRemaining(bomb.deadline, bomb.deadline_time);
            const urgency = getUrgencyClasses(remaining, bomb.status);
            return (
              <div
                key={bomb.id}
                onClick={() => openEdit(bomb)}
                className={`flex items-center gap-4 rounded-xl border-l-4 px-4 py-3 cursor-pointer hover:brightness-95 transition ${urgency}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        bomb.status === "defused" ? "line-through text-green-600" : ""
                      }`}
                    >
                      {bomb.status === "exploded" && "💥 "}
                      {bomb.status === "defused" && "✅ "}
                      {bomb.status === "active" && "💣 "}
                      {bomb.title}
                    </span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${PRIORITY_BADGES[bomb.priority]}`}>
                      {bomb.priority}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>
                      {new Date(bomb.deadline + "T00:00:00").toLocaleDateString()}
                      {bomb.deadline_time && ` at ${bomb.deadline_time}`}
                    </span>
                    {bomb.note && <span className="truncate">| {bomb.note}</span>}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-sm font-bold ${bomb.status === "active" && remaining > 0 ? "text-gray-900" : ""}`}>
                    {bomb.status === "active" ? formatCountdown(remaining) : bomb.status.toUpperCase()}
                  </div>
                  {bomb.status === "active" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDefuse(bomb);
                      }}
                      className="mt-1 rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      DEFUSE
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Plant a Bomb</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Bomb title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
                autoFocus
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  type="time"
                  value={deadlineTime}
                  onChange={(e) => setDeadlineTime(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Time (optional)"
                />
              </div>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
              <textarea
                placeholder="Note (optional)"
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
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Plant Bomb
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
            <h3 className="text-lg font-semibold text-gray-900">Edit Bomb</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Title"
            />
            <div className="flex gap-3">
              <input
                type="date"
                value={editDeadline}
                onChange={(e) => setEditDeadline(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <input
                type="time"
                value={editDeadlineTime}
                onChange={(e) => setEditDeadlineTime(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
              rows={2}
              placeholder="Note"
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
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Bomb</h3>
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
