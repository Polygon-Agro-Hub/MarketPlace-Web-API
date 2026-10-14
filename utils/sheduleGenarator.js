const CUTOFF_HOUR = 18; // 6 PM
const TIME_ZONE = "Asia/Colombo";
const MAX_RECURRING_WEEKS = 4;

const DAY_CODE_TO_INDEX = { Su: 0, Mo: 1, Tu: 2, We: 3, Th: 4, Fr: 5, Sa: 6 };

const getColomboNow = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type).value;
  return {
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10),
  };
};

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const dayOfWeek = (dateStr) => new Date(`${dateStr}T00:00:00Z`).getUTCDay();

/**
 * Single source of truth for the schedulable window.
 * Used by BOTH getCheckoutScheduleInfo and createOrder.
 *
 * packages = ProductDao.getCheckoutPackagesDao(userId) rows
 *            ({ packageId, packageType, startDate, endDate, ... }),
 *            i.e. 'One Time' AND 'Recurring' packages.
 *
 * Rules:
 *  - Lower bound: max(today + gap + 1, latest startDate across ALL packages)
 *  - Upper bound: min(endDate - gap) across 'One Time' packages only
 *    (Recurring packages have no endDate)
 *
 * `now` is injectable for testing.
 */
function getScheduleWindow(packages = [], now = getColomboNow()) {
  const isAfterCutoff = now.hour >= CUTOFF_HOUR;
  const gapDays = isAfterCutoff ? 3 : 2;
  const gapEarliest = addDays(now.dateStr, gapDays + 1);

  // ---- Lower bound: latest startDate (One Time + Recurring) ----------
  const withStart = packages.filter((p) => p.startDate);
  const startLimitingPackage = withStart.length
    ? withStart.reduce((a, b) => (b.startDate > a.startDate ? b : a))
    : null;

  const earliestDate =
    startLimitingPackage && startLimitingPackage.startDate > gapEarliest
      ? startLimitingPackage.startDate
      : gapEarliest;

  // ---- Upper bound: earliest (endDate - gap) among One Time packages -
  const oneTimeWithEnd = packages
    .filter((p) => p.packageType === "One Time" && p.endDate)
    .map((p) => ({ ...p, lastDeliveryDate: addDays(p.endDate, -gapDays) }));

  const endLimitingPackage = oneTimeWithEnd.length
    ? oneTimeWithEnd.reduce((a, b) => (b.lastDeliveryDate < a.lastDeliveryDate ? b : a))
    : null;

  const latestDate = endLimitingPackage ? endLimitingPackage.lastDeliveryDate : null;

  return {
    today: now.dateStr,
    isAfterCutoff,
    gapDays,
    gapEarliest,                 // earliest date from the gap rule alone
    earliestDate,                // gap rule + package startDate
    latestDate,
    startLimitingPackage,
    endLimitingPackage,
    limitingPackage: endLimitingPackage, // backward-compat name
    isSchedulable: !latestDate || earliestDate <= latestDate,
  };
}

/**
 * Returns an ascending array of "YYYY-MM-DD" strings, identical to the dates
 * shown in OrderListModal. Throws if the schedule is invalid or no date survives.
 */
function generateScheduleDates({
  scheduleType,
  deliveryDate = null, // One Time only, "YYYY-MM-DD"
  selectedDays = null, // JSON string or array of day codes, e.g. '["Mo","Th"]'
  validPeriod = null,  // weeks, e.g. "04"
  window,              // from getScheduleWindow()
}) {
  const { today, earliestDate, latestDate, gapDays, isSchedulable } = window;

  if (!isSchedulable) {
    throw new Error(
      `No delivery dates are available. A package in your cart expires too soon (last possible date was ${latestDate}).`
    );
  }

  // ---- One Time -------------------------------------------------------
  if (scheduleType === "One Time") {
    if (!deliveryDate || !/^\d{4}-\d{2}-\d{2}$/.test(deliveryDate)) {
      throw new Error("A valid delivery date (YYYY-MM-DD) is required");
    }
    if (deliveryDate < earliestDate) {
      throw new Error(
        `Delivery date must be ${earliestDate} or later (${gapDays}-day gap and package start dates apply)`
      );
    }
    if (latestDate && deliveryDate > latestDate) {
      throw new Error(`Delivery date must be on or before ${latestDate}`);
    }
    return [deliveryDate];
  }

  if (scheduleType !== "Once a week" && scheduleType !== "Twice a week") {
    throw new Error(`Unsupported scheduleType: ${scheduleType}`);
  }

  // ---- Parse selectedDays --------------------------------------------
  let dayCodes = [];
  if (selectedDays) {
    try {
      dayCodes = typeof selectedDays === "string" ? JSON.parse(selectedDays) : selectedDays;
    } catch {
      throw new Error(`Invalid selectedDays JSON: ${selectedDays}`);
    }
  }
  if (!Array.isArray(dayCodes) || dayCodes.length === 0) {
    throw new Error("selectedDays is required for recurring schedules");
  }

  const expectedCount = scheduleType === "Once a week" ? 1 : 2;
  if (new Set(dayCodes).size !== expectedCount || dayCodes.length !== expectedCount) {
    throw new Error(
      `${scheduleType} expects exactly ${expectedCount} different selected day(s), got ${dayCodes.length}`
    );
  }

  const dayIndexes = dayCodes.map((code) => {
    const idx = DAY_CODE_TO_INDEX[code];
    if (idx === undefined) throw new Error(`Invalid day code in selectedDays: ${code}`);
    return idx;
  });

  // ---- validPeriod ----------------------------------------------------
  const weeks = Math.min(parseInt(validPeriod, 10) || 0, MAX_RECURRING_WEEKS);
  if (weeks <= 0) throw new Error("validPeriod (weeks) must be a positive number");

  // ---- Start date: SERVER decides (earliest valid occurrence), not the client ----
  // earliestDate can now be far in the future (package startDate), so keep adding
  // weeks until the occurrence is on/after it (previously a single +7 was enough).
  const todayIdx = dayOfWeek(today);
  const firstOccurrences = dayIndexes.map((idx) => {
    let first = addDays(today, (idx - todayIdx + 7) % 7);
    while (first < earliestDate) first = addDays(first, 7);
    return first;
  });
  const start = firstOccurrences.sort()[0];

  // ---- Walk forward (your original algorithm) -------------------------
  const results = [start];
  const totalOccurrences = weeks * dayIndexes.length;
  const maxLookaheadDays = weeks * 7 + 7;
  let offset = 1;

  while (results.length < totalOccurrences && offset <= maxLookaheadDays) {
    const current = addDays(start, offset);
    if (dayIndexes.includes(dayOfWeek(current))) results.push(current);
    offset++;
  }

  // ---- Never schedule after a one-time package expires ---------------
  const finalDates = latestDate ? results.filter((d) => d <= latestDate) : results;

  if (finalDates.length === 0) {
    throw new Error(
      "Your selected day(s) fall after a package in your cart expires. Please choose a different day."
    );
  }
  return finalDates;
}

module.exports = { generateScheduleDates, getScheduleWindow, getColomboNow, addDays };