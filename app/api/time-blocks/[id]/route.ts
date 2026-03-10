import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, date, start_time, duration, note, location, link } = body;
  const db = getDb();
  db.prepare(
    "UPDATE time_blocks SET title = COALESCE(?, title), date = COALESCE(?, date), start_time = ?, duration = COALESCE(?, duration), note = COALESCE(?, note), location = COALESCE(?, location), link = COALESCE(?, link) WHERE id = ?"
  ).run(title, date, start_time ?? null, duration, note, location, link, id);
  const block = db.prepare("SELECT * FROM time_blocks WHERE id = ?").get(id);
  if (!block) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(block);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM time_blocks WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
