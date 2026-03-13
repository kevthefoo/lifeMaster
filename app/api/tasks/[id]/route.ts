import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, priority, status, note } = body;
  const db = getDb();
  db.prepare(
    "UPDATE tasks SET title = COALESCE(?, title), priority = COALESCE(?, priority), status = COALESCE(?, status), note = COALESCE(?, note) WHERE id = ?"
  ).run(title, priority, status, note, id);
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
