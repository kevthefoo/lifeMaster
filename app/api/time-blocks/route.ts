import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { matchesRecurrence } from "@/lib/recurrence";

export function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  if (!date) {
    return NextResponse.json(
      { error: "date parameter required" },
      { status: 400 }
    );
  }
  const db = getDb();

  const blocks = db
    .prepare(
      "SELECT *, 0 as recurring FROM time_blocks WHERE date = ? ORDER BY start_time IS NULL, start_time ASC"
    )
    .all(date) as Record<string, unknown>[];

  const recurring = db
    .prepare("SELECT * FROM recurring_blocks")
    .all() as Record<string, unknown>[];

  const recurringForDay = recurring
    .filter((r) => matchesRecurrence(r, date))
    .map((r) => ({
      id: `r-${r.id}`,
      recurring_id: r.id,
      title: r.title,
      date,
      start_time: r.start_time,
      duration: r.duration,
      note: r.note,
      location: r.location,
      link: r.link,
      recurring: 1,
      repeat_type: r.repeat_type,
      repeat_interval: r.repeat_interval,
      repeat_days: r.repeat_days,
    }));

  const all = [...blocks, ...recurringForDay].sort((a, b) => {
    const aTime = a.start_time as string | null;
    const bTime = b.start_time as string | null;
    if (!aTime && !bTime) return 0;
    if (!aTime) return 1;
    if (!bTime) return -1;
    return aTime.localeCompare(bTime);
  });

  return NextResponse.json(all);
}

export function POST(request: NextRequest) {
  return request.json().then((body) => {
    const {
      title,
      date,
      start_time,
      duration,
      note,
      location,
      link,
      repeat_type,
      repeat_interval,
      repeat_days,
    } = body;

    if (!title || !duration) {
      return NextResponse.json(
        { error: "title and duration are required" },
        { status: 400 }
      );
    }

    const db = getDb();

    if (repeat_type) {
      const result = db
        .prepare(
          "INSERT INTO recurring_blocks (title, start_time, duration, note, location, link, repeat_type, repeat_interval, repeat_days, repeat_start) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .run(
          title,
          start_time || null,
          duration,
          note || "",
          location || "",
          link || "",
          repeat_type,
          repeat_interval || 1,
          repeat_type === "weekly" && repeat_days
            ? repeat_days.join(",")
            : "",
          date
        );
      const block = db
        .prepare("SELECT * FROM recurring_blocks WHERE id = ?")
        .get(result.lastInsertRowid) as Record<string, unknown>;
      return NextResponse.json({ ...block, recurring: 1 }, { status: 201 });
    }

    if (!date) {
      return NextResponse.json(
        { error: "date is required for non-recurring blocks" },
        { status: 400 }
      );
    }
    const result = db
      .prepare(
        "INSERT INTO time_blocks (title, date, start_time, duration, note, location, link) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(title, date, start_time || null, duration, note || "", location || "", link || "");
    const block = db
      .prepare("SELECT * FROM time_blocks WHERE id = ?")
      .get(result.lastInsertRowid);
    return NextResponse.json(block, { status: 201 });
  });
}
