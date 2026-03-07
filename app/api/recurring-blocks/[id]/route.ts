import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM recurring_blocks WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, start_time, duration, note, repeat_days } = body;
  const db = getDb();
  db.prepare(
    "UPDATE recurring_blocks SET title = COALESCE(?, title), start_time = ?, duration = COALESCE(?, duration), note = COALESCE(?, note), repeat_days = COALESCE(?, repeat_days) WHERE id = ?"
  ).run(title, start_time ?? null, duration, note, repeat_days?.join(","), id);
  const block = db.prepare("SELECT * FROM recurring_blocks WHERE id = ?").get(id);
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(block);
}
