"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

interface Subscription {
  id: number;
  name: string;
  amount: number;
  currency: string;
  billing_cycle: string;
  category: string;
  next_billing_date: string;
  status: string;
  note: string;
  created_at: string;
}

const CATEGORY_BADGES: Record<string, string> = {
  Entertainment: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  Health: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  Cloud: "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  Productivity: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  Tech: "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  Education: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_BADGES: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
};

type FilterMode = "all" | "active" | "paused" | "cancelled";

function getMonthlyEquivalent(amount: number, cycle: string): number {
  if (cycle === "weekly") return amount * 4.33;
  if (cycle === "yearly") return amount / 12;
  return amount;
}

export default function FinancePage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [category, setCategory] = useState("other");
  const [nextBillingDate, setNextBillingDate] = useState("");
  const [note, setNote] = useState("");
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editBillingCycle, setEditBillingCycle] = useState("monthly");
  const [editCategory, setEditCategory] = useState("other");
  const [editNextBillingDate, setEditNextBillingDate] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [editNote, setEditNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  const fetchSubs = useCallback(() => {
    const params = filterMode === "all" ? "" : `?status=${filterMode}`;
    fetch(`/api/subscriptions${params}`)
      .then((r) => r.json())
      .then(setSubs);
  }, [filterMode]);

  useEffect(() => {
    fetchSubs();
  }, [fetchSubs]);

  const activeSubs = subs.filter((s) => s.status === "active");
  const totalMonthly = activeSubs.reduce(
    (sum, s) => sum + getMonthlyEquivalent(s.amount, s.billing_cycle),
    0
  );
  const upcomingCount = activeSubs.filter((s) => {
    const diff = (new Date(s.next_billing_date + "T00:00:00").getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !amount || !nextBillingDate) return;
    await fetch("/api/subscriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        amount: parseFloat(amount),
        billing_cycle: billingCycle,
        category,
        next_billing_date: nextBillingDate,
        note,
      }),
    });
    setName("");
    setAmount("");
    setBillingCycle("monthly");
    setCategory("other");
    setNextBillingDate("");
    setNote("");
    setShowForm(false);
    fetchSubs();
  }

  function openEdit(sub: Subscription) {
    setEditTarget(sub);
    setEditName(sub.name);
    setEditAmount(String(sub.amount));
    setEditBillingCycle(sub.billing_cycle);
    setEditCategory(sub.category);
    setEditNextBillingDate(sub.next_billing_date);
    setEditStatus(sub.status);
    setEditNote(sub.note || "");
  }

  async function handleEditSave() {
    if (!editTarget || !editName || !editAmount || !editNextBillingDate) return;
    await fetch(`/api/subscriptions/${editTarget.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        amount: parseFloat(editAmount),
        billing_cycle: editBillingCycle,
        category: editCategory,
        next_billing_date: editNextBillingDate,
        status: editStatus,
        note: editNote,
      }),
    });
    setEditTarget(null);
    fetchSubs();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/subscriptions/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setEditTarget(null);
    fetchSubs();
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Finance</h1>
            <Link href="/task" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Tasks
            </Link>
            <Link href="/bomb" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Bombs
            </Link>
            <Link href="/calendar" className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              Calendar
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {showForm ? "Cancel" : "Add Subscription"}
            </button>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-3">
        <div className="mx-auto max-w-2xl flex gap-4">
          <div className="flex-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3">
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Monthly Spend</div>
            <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200">${totalMonthly.toFixed(2)}</div>
          </div>
          <div className="flex-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 px-4 py-3">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Active</div>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">{activeSubs.length}</div>
          </div>
          <div className="flex-1 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 px-4 py-3">
            <div className="text-xs text-orange-600 dark:text-orange-400 font-medium">Due This Week</div>
            <div className="text-lg font-bold text-orange-800 dark:text-orange-200">{upcomingCount}</div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="shrink-0 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-2 flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Filter:</span>
          {(["all", "active", "paused", "cancelled"] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilterMode(f)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
                filterMode === f
                  ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Subscription list */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-3">
          {subs.length === 0 && (
            <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-12">No subscriptions found.</p>
          )}
          {subs.map((sub) => (
            <div
              key={sub.id}
              onClick={() => openEdit(sub)}
              className={`flex items-center gap-4 rounded-xl border-l-4 px-4 py-3 cursor-pointer hover:brightness-95 dark:hover:brightness-110 transition ${
                sub.status === "active"
                  ? "bg-white border-emerald-400 dark:bg-gray-800 dark:border-emerald-500"
                  : sub.status === "paused"
                  ? "bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-500"
                  : "bg-gray-100 border-gray-400 dark:bg-gray-800 dark:border-gray-600"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-semibold truncate ${
                      sub.status === "cancelled" ? "line-through text-gray-500 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    {sub.name}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${CATEGORY_BADGES[sub.category] || CATEGORY_BADGES.other}`}>
                    {sub.category}
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${STATUS_BADGES[sub.status]}`}>
                    {sub.status}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span>Next: {new Date(sub.next_billing_date + "T00:00:00").toLocaleDateString()}</span>
                  <span>| {sub.billing_cycle}</span>
                  {sub.note && <span className="truncate">| {sub.note}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  ${sub.amount.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  /{sub.billing_cycle === "monthly" ? "mo" : sub.billing_cycle === "yearly" ? "yr" : "wk"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Subscription</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                placeholder="Subscription name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                required
                autoFocus
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                  required
                />
                <select
                  value={billingCycle}
                  onChange={(e) => setBillingCycle(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="flex gap-3">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                >
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Cloud">Cloud</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Tech">Tech</option>
                  <option value="Education">Education</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="date"
                  value={nextBillingDate}
                  onChange={(e) => setNextBillingDate(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                  required
                />
              </div>
              <textarea
                placeholder="Note (optional)"
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
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Add
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Edit Subscription</h3>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
              placeholder="Name"
            />
            <div className="flex gap-3">
              <input
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                required
              />
              <select
                value={editBillingCycle}
                onChange={(e) => setEditBillingCycle(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="flex gap-3">
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
              >
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Cloud">Cloud</option>
                <option value="Productivity">Productivity</option>
                <option value="Tech">Tech</option>
                <option value="Education">Education</option>
                <option value="other">Other</option>
              </select>
              <input
                type="date"
                value={editNextBillingDate}
                onChange={(e) => setEditNextBillingDate(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
                required
              />
            </div>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-200"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <textarea
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm resize-none dark:bg-gray-700 dark:text-gray-200"
              rows={2}
              placeholder="Note"
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
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Delete Subscription</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete &quot;{deleteTarget.name}&quot;?
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
