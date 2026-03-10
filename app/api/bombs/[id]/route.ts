import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, deadline, deadline_time, priority, note, status } = body;
  const db = getDb();
  db.prepare(
    "UPDATE bombs SET title = COALESCE(?, title), deadline = COALESCE(?, deadline), deadline_time = COALESCE(?, deadline_time), priority = COALESCE(?, priority), note = COALESCE(?, note), status = COALESCE(?, status) WHERE id = ?"
  ).run(title, deadline, deadline_time, priority, note, status, id);
  const bomb = db.prepare("SELECT * FROM bombs WHERE id = ?").get(id);
  if (!bomb) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bomb);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM bombs WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
