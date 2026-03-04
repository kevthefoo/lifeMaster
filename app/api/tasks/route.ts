import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET(request: NextRequest) {
  const listType = request.nextUrl.searchParams.get("list_type");
  const db = getDb();
  if (listType) {
    const tasks = db
      .prepare("SELECT * FROM tasks WHERE list_type = ? ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC")
      .all(listType);
    return NextResponse.json(tasks);
  }
  const tasks = db
    .prepare("SELECT * FROM tasks ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC")
    .all();
  return NextResponse.json(tasks);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { title, list_type, priority, deadline, note } = body;
    if (!title || !list_type) {
      return NextResponse.json({ error: "title and list_type are required" }, { status: 400 });
    }
    const db = getDb();
    const result = db
      .prepare("INSERT INTO tasks (title, list_type, priority, deadline, note) VALUES (?, ?, ?, ?, ?)")
      .run(title, list_type, priority || "medium", deadline || null, note || "");
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(task, { status: 201 });
  });
}
