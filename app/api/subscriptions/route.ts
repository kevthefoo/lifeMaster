import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");
  const db = getDb();

  let sql = "SELECT * FROM subscriptions WHERE 1=1";
  const params: string[] = [];

  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }

  sql += " ORDER BY next_billing_date ASC";

  const subscriptions = db.prepare(sql).all(...params);

  // Seed dummy data if table is empty
  if (!status && (subscriptions as unknown[]).length === 0) {
    const seed = [
      { name: "Netflix", amount: 15.99, billing_cycle: "monthly", category: "Entertainment", next_billing_date: "2026-04-01" },
      { name: "Spotify", amount: 10.99, billing_cycle: "monthly", category: "Entertainment", next_billing_date: "2026-03-22" },
      { name: "Gym Membership", amount: 45.00, billing_cycle: "monthly", category: "Health", next_billing_date: "2026-04-05" },
      { name: "iCloud Storage", amount: 2.99, billing_cycle: "monthly", category: "Cloud", next_billing_date: "2026-03-28" },
      { name: "ChatGPT Plus", amount: 20.00, billing_cycle: "monthly", category: "Productivity", next_billing_date: "2026-03-20" },
      { name: "Adobe Creative Cloud", amount: 59.99, billing_cycle: "monthly", category: "Productivity", next_billing_date: "2026-04-10" },
      { name: "Domain Renewal", amount: 12.99, billing_cycle: "yearly", category: "Tech", next_billing_date: "2026-09-15" },
      { name: "Medium", amount: 5.00, billing_cycle: "monthly", category: "Education", next_billing_date: "2026-03-25" },
      { name: "Claude Pro Max", amount: 200.00, billing_cycle: "monthly", category: "Productivity", next_billing_date: "2026-04-02" },
    ];
    const insert = db.prepare(
      "INSERT INTO subscriptions (name, amount, billing_cycle, category, next_billing_date) VALUES (?, ?, ?, ?, ?)"
    );
    for (const s of seed) {
      insert.run(s.name, s.amount, s.billing_cycle, s.category, s.next_billing_date);
    }
    const all = db.prepare("SELECT * FROM subscriptions ORDER BY next_billing_date ASC").all();
    return NextResponse.json(all);
  }

  return NextResponse.json(subscriptions);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const { name, amount, currency, billing_cycle, category, next_billing_date, note } = body;
    if (!name || amount == null || !next_billing_date) {
      return NextResponse.json({ error: "name, amount, and next_billing_date are required" }, { status: 400 });
    }
    const db = getDb();
    const result = db
      .prepare(
        "INSERT INTO subscriptions (name, amount, currency, billing_cycle, category, next_billing_date, note) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(name, amount, currency || "USD", billing_cycle || "monthly", category || "other", next_billing_date, note || "");
    const sub = db.prepare("SELECT * FROM subscriptions WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(sub, { status: 201 });
  });
}
