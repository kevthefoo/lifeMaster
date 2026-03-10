import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { matchesRecurrence } from "@/lib/recurrence";

export function GET(request: NextRequest) {
  const month = request.nextUrl.searchParams.get("month"); // YYYY-MM
  if (!month) {
    return NextResponse.json({ error: "month parameter required (YYYY-MM)" }, { status: 400 });
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const mon = parseInt(monthStr); // 1-based

  // Get first and last day of month
  const firstDay = `${month}-01`;
  const lastDay = new Date(year, mon, 0).getDate();
  const lastDayStr = `${month}-${String(lastDay).padStart(2, "0")}`;

  const db = getDb();

  // Count time_blocks per date in the month
  const blockCounts = db
    .prepare(
      "SELECT date, COUNT(*) as count FROM time_blocks WHERE date >= ? AND date <= ? GROUP BY date"
    )
    .all(firstDay, lastDayStr) as { date: string; count: number }[];

  const blockMap: Record<string, number> = {};
  for (const row of blockCounts) {
    blockMap[row.date] = row.count;
  }

  // Get recurring blocks and check each day of the month
  const recurring = db
    .prepare("SELECT * FROM recurring_blocks")
    .all() as Record<string, unknown>[];

  const recurringMap: Record<string, number> = {};
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    let count = 0;
    for (const r of recurring) {
      if (matchesRecurrence(r, dateStr)) count++;
    }
    if (count > 0) recurringMap[dateStr] = count;
  }

  // Count tasks - tasks don't have dates, they have list_type (daily/weekly/monthly)
  // We'll count all pending tasks by list_type
  const taskCounts = db
    .prepare(
      "SELECT list_type, COUNT(*) as count FROM tasks WHERE status = 'pending' GROUP BY list_type"
    )
    .all() as { list_type: string; count: number }[];

  const taskCountMap: Record<string, number> = {};
  for (const row of taskCounts) {
    taskCountMap[row.list_type] = row.count;
  }

  // Count active bombs per date in the month
  const bombCounts = db
    .prepare(
      "SELECT deadline, COUNT(*) as count FROM bombs WHERE deadline >= ? AND deadline <= ? AND status = 'active' GROUP BY deadline"
    )
    .all(firstDay, lastDayStr) as { deadline: string; count: number }[];

  const bombMap: Record<string, number> = {};
  for (const row of bombCounts) {
    bombMap[row.deadline] = row.count;
  }

  // Build per-date result
  const result: Record<string, { events: number; tasks: number; bombs: number }> = {};
  for (let d = 1; d <= lastDay; d++) {
    const dateStr = `${month}-${String(d).padStart(2, "0")}`;
    const events = (blockMap[dateStr] || 0) + (recurringMap[dateStr] || 0);
    // Daily tasks show on every day, weekly/monthly show as-is
    const tasks = taskCountMap["daily"] || 0;
    const bombs = bombMap[dateStr] || 0;
    if (events > 0 || tasks > 0 || bombs > 0) {
      result[dateStr] = { events, tasks, bombs };
    }
  }

  return NextResponse.json(result);
}
