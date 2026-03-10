import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const date = request.nextUrl.searchParams.get("date");
  const db = getDb();

  let sql = "SELECT * FROM bombs WHERE 1=1";
  const params: string[] = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (date) {
    sql += " AND deadline = ?";
    params.push(date);
  }

  sql += " ORDER BY deadline ASC, CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END";

  const bombs = db.prepare(sql).all(...params);
  return NextResponse.json(bombs);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { title, deadline, deadline_time, priority, note } = body;
    if (!title || !deadline) {
      return NextResponse.json({ error: "title and deadline are required" }, { status: 400 });
    }
    const db = getDb();
    const result = db
      .prepare("INSERT INTO bombs (title, deadline, deadline_time, priority, note) VALUES (?, ?, ?, ?, ?)")
      .run(title, deadline, deadline_time || null, priority || "medium", note || "");
    const bomb = db.prepare("SELECT * FROM bombs WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(bomb, { status: 201 });
  });
}
