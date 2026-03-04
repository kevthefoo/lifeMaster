import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { title, target_value, unit } = body;
  const db = getDb();
  db.prepare(
    "UPDATE habits SET title = COALESCE(?, title), target_value = COALESCE(?, target_value), unit = COALESCE(?, unit) WHERE id = ?"
  ).run(title, target_value, unit, id);
  const habit = db.prepare("SELECT * FROM habits WHERE id = ?").get(id);
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(habit);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM habits WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
