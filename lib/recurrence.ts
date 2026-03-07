export function matchesRecurrence(
  r: Record<string, unknown>,
  targetDate: string
): boolean {
  const repeatType = r.repeat_type as string;
  const interval = r.repeat_interval as number;
  const repeatStart = r.repeat_start as string;
  const repeatDays = r.repeat_days as string;

  if (!repeatStart) return false;

  const target = new Date(targetDate + "T00:00:00");
  const start = new Date(repeatStart + "T00:00:00");

  if (target < start) return false;

  const diffTime = target.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  switch (repeatType) {
    case "daily":
      return diffDays % interval === 0;

    case "weekly": {
      const diffWeeks = Math.floor(diffDays / 7);
      if (diffWeeks % interval !== 0 && diffDays >= 7) {
        const startWeekDay = start.getDay();
        const weekStart = new Date(start);
        weekStart.setDate(weekStart.getDate() - startWeekDay);
        const targetWeekDay = target.getDay();
        const targetWeekStart = new Date(target);
        targetWeekStart.setDate(targetWeekStart.getDate() - targetWeekDay);
        const weekDiff = Math.round(
          (targetWeekStart.getTime() - weekStart.getTime()) /
            (1000 * 60 * 60 * 24 * 7)
        );
        if (weekDiff % interval !== 0) return false;
      }
      const days = repeatDays
        .split(",")
        .filter(Boolean)
        .map(Number);
      return days.includes(target.getDay());
    }

    case "monthly": {
      const monthDiff =
        (target.getFullYear() - start.getFullYear()) * 12 +
        (target.getMonth() - start.getMonth());
      if (monthDiff < 0 || monthDiff % interval !== 0) return false;
      return target.getDate() === start.getDate();
    }

    case "yearly": {
      const yearDiff = target.getFullYear() - start.getFullYear();
      if (yearDiff < 0 || yearDiff % interval !== 0) return false;
      return (
        target.getMonth() === start.getMonth() &&
        target.getDate() === start.getDate()
      );
    }

    default:
      return false;
  }
}
