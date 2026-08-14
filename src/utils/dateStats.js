export function getStartOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getStartOfWeek(ts = Date.now()) {
  // Week starts on Monday
  const d = new Date(ts);
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getStartOfMonth(ts = Date.now()) {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function sumByType(transactions, type, startTs, endTs) {
  return transactions
    .filter((t) => t.type === type && t.timestamp >= startTs && t.timestamp < endTs)
    .reduce((sum, t) => sum + t.amount, 0);
}

// Rolling-window breakdown shown when the due amount is tapped.
export function getDueBreakdown(transactions) {
  const now = Date.now();
  const todayStart = getStartOfDay(now);
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysStart = todayStart - 6 * 24 * 60 * 60 * 1000;
  const monthAgoStart = todayStart - 29 * 24 * 60 * 60 * 1000;
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;

  return {
    today: sumByType(transactions, 'purchase', todayStart, tomorrowStart),
    yesterday: sumByType(transactions, 'purchase', yesterdayStart, todayStart),
    last7Days: sumByType(transactions, 'purchase', sevenDaysStart, tomorrowStart),
    last30Days: sumByType(transactions, 'purchase', monthAgoStart, tomorrowStart),
  };
}

// Calendar-based totals shown in the header (this week / this month so far).
export function getWeekMonthTotals(transactions) {
  const now = Date.now();
  const weekStart = getStartOfWeek(now);
  const monthStart = getStartOfMonth(now);
  const tomorrowStart = getStartOfDay(now) + 24 * 60 * 60 * 1000;

  return {
    week: sumByType(transactions, 'purchase', weekStart, tomorrowStart),
    month: sumByType(transactions, 'purchase', monthStart, tomorrowStart),
  };
}

// Ring chart value: % of this month's purchases already paid back.
export function getMonthPaidRatio(transactions) {
  const now = Date.now();
  const monthStart = getStartOfMonth(now);
  const tomorrowStart = getStartOfDay(now) + 24 * 60 * 60 * 1000;

  const purchased = sumByType(transactions, 'purchase', monthStart, tomorrowStart);
  const paid = sumByType(transactions, 'payment', monthStart, tomorrowStart);

  if (purchased <= 0) return 100;
  return Math.max(0, Math.min(100, (paid / purchased) * 100));
}
