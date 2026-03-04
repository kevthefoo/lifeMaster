import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json({ error: "date parameter required" }, { status: 400 });
  }
  const db = getDb();
  const blocks = db
    .prepare("SELECT * FROM time_blocks WHERE date = ? ORDER BY start_time IS NULL, start_time ASC")
    .all(date);
  return NextResponse.json(blocks);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { title, date, start_time, duration, note } = body;
    if (!title || !date || !duration) {
      return NextResponse.json({ error: "title, date, and duration are required" }, { status: 400 });
    }
    const db = getDb();
    const result = db
      .prepare("INSERT INTO time_blocks (title, date, start_time, duration, note) VALUES (?, ?, ?, ?, ?)")
      .run(title, date, start_time || null, duration, note || "");
    const block = db.prepare("SELECT * FROM time_blocks WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(block, { status: 201 });
  });
}
