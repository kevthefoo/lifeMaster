import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date parameter required" }, { status: 400 });
  }
  const db = getDb();
  const logs = db
    .prepare(
      `SELECT h.id as habit_id, h.title, h.target_value, h.unit,
              COALESCE(hl.value, 0) as current_value, hl.id as log_id
       FROM habits h
       LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
       ORDER BY h.created_at DESC`
    )
    .all(date);
  return NextResponse.json(logs);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { habit_id, date, value } = body;
    if (!habit_id || !date || value === undefined) {
      return NextResponse.json({ error: "habit_id, date, and value are required" }, { status: 400 });
    }
    const db = getDb();
    db.prepare(
      `INSERT INTO habit_logs (habit_id, date, value) VALUES (?, ?, ?)
       ON CONFLICT(habit_id, date) DO UPDATE SET value = ?`
    ).run(habit_id, date, value, value);
    const log = db
      .prepare(
        `SELECT h.id as habit_id, h.title, h.target_value, h.unit,
                COALESCE(hl.value, 0) as current_value, hl.id as log_id
         FROM habits h
         LEFT JOIN habit_logs hl ON h.id = hl.habit_id AND hl.date = ?
         WHERE h.id = ?`
      )
      .get(date, habit_id);
    return NextResponse.json(log, { status: 201 });
  });
}
