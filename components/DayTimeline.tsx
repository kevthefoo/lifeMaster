"use client";

import { useState, useEffect, useRef } from "react";

interface TimeBlock {
  id: number | string;
  recurring_id?: number;
  title: string;
  date: string;
  start_time: string | null;
  duration: number;
  note: string;
  recurring: number;
}

const HOUR_HEIGHT = 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const BLOCK_COLORS = [
  "bg-blue-100 border-blue-400 text-blue-900",
  "bg-purple-100 border-purple-400 text-purple-900",
  "bg-emerald-100 border-emerald-400 text-emerald-900",
  "bg-amber-100 border-amber-400 text-amber-900",
  "bg-rose-100 border-rose-400 text-rose-900",
  "bg-cyan-100 border-cyan-400 text-cyan-900",
  "bg-indigo-100 border-indigo-400 text-indigo-900",
];

const RECURRING_COLORS = [
  "bg-blue-50 border-blue-300 text-blue-800 border-dashed",
  "bg-purple-50 border-purple-300 text-purple-800 border-dashed",
  "bg-emerald-50 border-emerald-300 text-emerald-800 border-dashed",
  "bg-amber-50 border-amber-300 text-amber-800 border-dashed",
  "bg-rose-50 border-rose-300 text-rose-800 border-dashed",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

export default function DayTimeline({
  blocks,
  date,
  onRefresh,
}: {
  blocks: TimeBlock[];
  date: string;
  onRefresh: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [endTime, setEndTime] = useState(() => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
  const [note, setNote] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [repeatType, setRepeatType] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");
  const [repeatInterval, setRepeatInterval] = useState("1");
  const [repeatDays, setRepeatDays] = useState<number[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TimeBlock | null>(null);
  const [editTarget, setEditTarget] = useState<TimeBlock | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");
  const [editNote, setEditNote] = useState("");
  const [nowMinutes, setNowMinutes] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNowMinutes(now.getHours() * 60 + now.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollTo = Math.max(0, (nowMinutes / 60 - 1) * HOUR_HEIGHT);
      scrollRef.current.scrollTop = scrollTo;
    }
  }, []);

  const isToday = date === new Date().toISOString().split("T")[0];

  const scheduledBlocks = blocks
    .filter((b) => b.start_time)
    .sort((a, b) => timeToMinutes(a.start_time!) - timeToMinutes(b.start_time!));

  const unscheduledBlocks = blocks.filter((b) => !b.start_time);

  function toggleDay(day: number) {
    setRepeatDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !startTime || !endTime) return;
    if (isRecurring && repeatType === "weekly" && repeatDays.length === 0) return;

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (endMin <= startMin) {
      setErrorMsg("End time must be after start time.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    const duration = endMin - startMin;

    // Prevent adding one-time blocks in the past
    if (!isRecurring) {
      const now = new Date();
      const blockDate = new Date(date + "T" + startTime);
      if (blockDate < now) {
        setErrorMsg("Cannot add a block in the past.");
        setTimeout(() => setErrorMsg(""), 3000);
        return;
      }
    }

    await fetch("/api/time-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        start_time: startTime,
        duration,
        note,
        repeat_type: isRecurring ? repeatType : undefined,
        repeat_interval: isRecurring ? parseInt(repeatInterval) : undefined,
        repeat_days: isRecurring && repeatType === "weekly" ? repeatDays : undefined,
      }),
    });
    const now = new Date();
    const later = new Date(now);
    later.setHours(later.getHours() + 1);
    setTitle("");
    setStartTime(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`);
    setEndTime(`${String(later.getHours()).padStart(2, "0")}:${String(later.getMinutes()).padStart(2, "0")}`);
    setNote("");
    setIsRecurring(false);
    setRepeatType("weekly");
    setRepeatInterval("1");
    setRepeatDays([]);
    setShowForm(false);
    onRefresh();
  }

  function minutesToTime(min: number): string {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function openEdit(block: TimeBlock) {
    setEditTarget(block);
    setEditTitle(block.title);
    setEditStartTime(block.start_time || "");
    const endMin = timeToMinutes(block.start_time!) + block.duration;
    setEditEndTime(minutesToTime(endMin));
    setEditNote(block.note || "");
  }

  async function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editTitle || !editStartTime || !editEndTime) return;

    const startMin = timeToMinutes(editStartTime);
    const endMin = timeToMinutes(editEndTime);
    if (endMin <= startMin) {
      setErrorMsg("End time must be after start time.");
      setTimeout(() => setErrorMsg(""), 3000);
      return;
    }
    const duration = endMin - startMin;

    const url = editTarget.recurring
      ? `/api/recurring-blocks/${editTarget.recurring_id}`
      : `/api/time-blocks/${editTarget.id}`;

    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTitle,
        start_time: editStartTime,
        duration,
        note: editNote,
      }),
    });
    setEditTarget(null);
    onRefresh();
  }

  function requestDelete(block: TimeBlock) {
    setDeleteTarget(block);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.recurring) {
      await fetch(`/api/recurring-blocks/${deleteTarget.recurring_id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/time-blocks/${deleteTarget.id}`, { method: "DELETE" });
    }
    setDeleteTarget(null);
    onRefresh();
  }

  return (
    <div className="flex h-full flex-col relative">
      {/* Error toast */}
      {errorMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg animate-fade-in">
          {errorMsg}
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-base font-semibold text-gray-900">Delete block</h3>
            <p className="mt-2 text-sm text-gray-600">
              {deleteTarget.recurring
                ? <>Are you sure you want to delete <span className="font-medium">&ldquo;{deleteTarget.title}&rdquo;</span>? This will remove <span className="font-medium">all occurrences</span>.</>
                : <>Are you sure you want to delete <span className="font-medium">&ldquo;{deleteTarget.title}&rdquo;</span>?</>
              }
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <form onSubmit={handleEditSave} className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-3">
            <h3 className="text-base font-semibold text-gray-900">Edit block</h3>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Title"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={editStartTime}
                onChange={(e) => setEditStartTime(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
              <span className="text-sm text-gray-400">to</span>
              <input
                type="time"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Description"
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
            />
            {editTarget.recurring === 1 && (
              <p className="text-xs text-amber-600">This will update all occurrences of this recurring block.</p>
            )}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setEditTarget(null); requestDelete(editTarget); }}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="border-b border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 min-w-[150px] rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
            <span className="text-sm text-gray-400 self-center">to</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
            />
          </div>

          <textarea
            placeholder="Description"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm resize-none"
          />

          {/* Repeat toggle */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-gray-300"
              />
              Repeat
            </label>

            {isRecurring && (
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Every</span>
                  <input
                    type="number"
                    value={repeatInterval}
                    onChange={(e) => setRepeatInterval(e.target.value)}
                    min="1"
                    className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <select
                    value={repeatType}
                    onChange={(e) => setRepeatType(e.target.value as "daily" | "weekly" | "monthly" | "yearly")}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="daily">{parseInt(repeatInterval) === 1 ? "day" : "days"}</option>
                    <option value="weekly">{parseInt(repeatInterval) === 1 ? "week" : "weeks"}</option>
                    <option value="monthly">{parseInt(repeatInterval) === 1 ? "month" : "months"}</option>
                    <option value="yearly">{parseInt(repeatInterval) === 1 ? "year" : "years"}</option>
                  </select>
                </div>

                {repeatType === "weekly" && (
                  <div className="flex gap-1">
                    {DAY_LABELS.map((label, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleDay(i)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                          repeatDays.includes(i)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {repeatType !== "weekly" && (
                  <p className="text-xs text-gray-500">
                    Starting from the currently selected date
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {isRecurring ? "Add Recurring" : "Add"}
          </button>
        </form>
      )}

      {/* Unscheduled blocks */}
      {unscheduledBlocks.length > 0 && (
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
          <div className="text-xs font-medium text-gray-500 mb-1">Unscheduled</div>
          <div className="flex flex-wrap gap-1">
            {unscheduledBlocks.map((block) => (
              <span
                key={block.id}
                className="group inline-flex items-center gap-1 rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-700"
              >
                {block.title} ({block.duration}m)
                <button
                  onClick={() => requestDelete(block)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"
                >
                  x
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
          {/* Hour grid lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-100"
              style={{ top: hour * HOUR_HEIGHT }}
            >
              <span className="absolute -top-3 left-2 text-xs text-gray-400 bg-white pr-2">
                {formatHour(hour)}
              </span>
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: (nowMinutes / 60) * HOUR_HEIGHT }}
            >
              <div className="flex items-center">
                <div className="h-3 w-3 -ml-1.5 rounded-full bg-red-500" />
                <div className="flex-1 h-0.5 bg-red-500" />
              </div>
            </div>
          )}

          {/* Time blocks */}
          {scheduledBlocks.map((block, i) => {
            const startMin = timeToMinutes(block.start_time!);
            const top = (startMin / 60) * HOUR_HEIGHT;
            const height = Math.max((block.duration / 60) * HOUR_HEIGHT, 24);
            const colorClass = block.recurring
              ? RECURRING_COLORS[i % RECURRING_COLORS.length]
              : BLOCK_COLORS[i % BLOCK_COLORS.length];

            return (
              <div
                key={block.id}
                onClick={() => openEdit(block)}
                className={`absolute left-16 right-3 z-10 rounded-md border-l-4 px-3 py-1 cursor-pointer hover:brightness-95 transition group overflow-hidden ${colorClass}`}
                style={{ top, height }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{block.title}</span>
                    {block.recurring === 1 && (
                      <span className="shrink-0 text-[10px] opacity-60" title="Recurring">↻</span>
                    )}
                  </div>
                  {height > 32 && (
                    <div className="text-xs opacity-70">
                      {block.start_time} - {minutesToTime(timeToMinutes(block.start_time!) + block.duration)}
                      {block.note && ` | ${block.note}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
