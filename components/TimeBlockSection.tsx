"use client";

import { useState } from "react";

interface TimeBlock {
  id: number;
  title: string;
  date: string;
  start_time: string | null;
  duration: number;
  note: string;
}

export default function TimeBlockSection({
  blocks,
  date,
  onRefresh,
}: {
  blocks: TimeBlock[];
  date: string;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState("");
  const [note, setNote] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !duration) return;
    await fetch("/api/time-blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        date,
        start_time: startTime || null,
        duration: parseInt(duration),
        note,
      }),
    });
    setTitle("");
    setStartTime("");
    setDuration("");
    setNote("");
    setShowForm(false);
    onRefresh();
  }

  async function handleDelete(id: number) {
    await fetch(`/api/time-blocks/${id}`, { method: "DELETE" });
    onRefresh();
  }

  function formatDuration(minutes: number) {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Time Blocks</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 space-y-2 rounded-lg bg-gray-50 p-3">
          <input
            type="text"
            placeholder="Block title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Start (optional)"
            />
            <input
              type="number"
              placeholder="Duration (min)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              required
              min="1"
            />
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add Block
          </button>
        </form>
      )}

      {blocks.length === 0 ? (
        <p className="text-sm text-gray-400">No time blocks for this day.</p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((block) => (
            <li
              key={block.id}
              className="group flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  {block.start_time && (
                    <span className="text-sm font-medium text-blue-600">
                      {block.start_time}
                    </span>
                  )}
                  <span className="font-medium text-gray-900">{block.title}</span>
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                    {formatDuration(block.duration)}
                  </span>
                </div>
                {block.note && (
                  <p className="mt-1 text-xs text-gray-500">{block.note}</p>
                )}
              </div>
              <button
                onClick={() => handleDelete(block.id)}
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
