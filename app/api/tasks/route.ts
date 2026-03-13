import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET() {
  const db = getDb();
  const tasks = db
    .prepare("SELECT * FROM tasks ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC")
    .all();
  return NextResponse.json(tasks);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { title, priority, note } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const db = getDb();
    const result = db
      .prepare("INSERT INTO tasks (title, list_type, priority, note) VALUES (?, 'pool', ?, ?)")
      .run(title, priority || "medium", note || "");
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(task, { status: 201 });
  });
}
