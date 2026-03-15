import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const { name, amount, currency, billing_cycle, category, next_billing_date, status, note } = body;
  const db = getDb();
  db.prepare(
    "UPDATE subscriptions SET name = COALESCE(?, name), amount = COALESCE(?, amount), currency = COALESCE(?, currency), billing_cycle = COALESCE(?, billing_cycle), category = COALESCE(?, category), next_billing_date = COALESCE(?, next_billing_date), status = COALESCE(?, status), note = COALESCE(?, note) WHERE id = ?"
  ).run(name, amount, currency, billing_cycle, category, next_billing_date, status, note, id);
  const sub = db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(id);
  if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sub);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  const result = db.prepare("DELETE FROM subscriptions WHERE id = ?").run(id);
  if (result.changes === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
