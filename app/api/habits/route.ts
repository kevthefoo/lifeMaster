import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const habits = db.prepare("SELECT * FROM habits ORDER BY created_at DESC").all();
  return NextResponse.json(habits);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { title, habit_type, target_value, unit } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const type = habit_type || "checkbox";
    const db = getDb();
    const result = db
      .prepare("INSERT INTO habits (title, habit_type, target_value, unit) VALUES (?, ?, ?, ?)")
      .run(title, type, type === "checkbox" ? 1 : (target_value || 1), type === "checkbox" ? "" : (unit || ""));
    const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(habit, { status: 201 });
  });
}
