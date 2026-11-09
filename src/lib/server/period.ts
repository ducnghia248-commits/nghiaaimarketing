/** Mốc bắt đầu kỳ xếp hạng: day = hôm nay, week = từ thứ Hai, khác = toàn thời gian. */
export function periodStart(period: string | null): Date | null {
  const d = new Date();
  if (period === "day") {
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "week") {
    const day = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  return null;
}
