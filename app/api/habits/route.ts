import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const habits = db.prepare("SELECT * FROM habits ORDER BY created_at DESC").all();
  return NextResponse.json(habits);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { title, target_value, unit } = body;
    if (!title || !target_value || !unit) {
      return NextResponse.json({ error: "title, target_value, and unit are required" }, { status: 400 });
    }
    const db = getDb();
    const result = db
      .prepare("INSERT INTO habits (title, target_value, unit) VALUES (?, ?, ?)")
      .run(title, target_value, unit);
    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(habit, { status: 201 });
  });
}
