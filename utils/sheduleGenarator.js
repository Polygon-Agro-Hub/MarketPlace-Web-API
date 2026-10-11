// utils/scheduleGenerator.js

/**
 * Day code mapping — matches the values stored in `selectedDays`
 */
const DAY_CODE_TO_INDEX = {
  Su: 0,
  Mo: 1,
  Tu: 2,
  We: 3,
  Th: 4,
  Fr: 5,
  Sa: 6,
};

/**
 * Generate all possible schedule dates for a recurring order.
 *
 * The FIRST date is ALWAYS the input `sheduleDate` itself, regardless of
 * whether its weekday matches `selectedDays`. All subsequent dates follow
 * the recurring pattern for `validPeriod` weeks.
 *
 * @param {Object} params
 * @param {string} params.scheduleType   - "One Time" | "Once a week" | "Twice a week"
 * @param {string} params.sheduleDate    - ISO date string, e.g. "2026-10-14T00:00:00.000Z"
 * @param {string|null} params.selectedDays - JSON string of day codes, e.g. '["Mo","Tu"]'
 * @param {string|number|null} params.validPeriod - number of weeks, e.g. "04"
 * @returns {string[]} Array of ISO date strings (all generated schedule dates)
 */
function generateScheduleDates({
  scheduleType,
  sheduleDate,
  selectedDays = null,
  validPeriod = null,
}) {
  // ---- Validation -----------------------------------------------------
  if (!sheduleDate) {
    throw new Error("sheduleDate is required to generate schedule dates");
  }

  const startDate = new Date(sheduleDate);
  if (isNaN(startDate.getTime())) {
    throw new Error(`Invalid sheduleDate: ${sheduleDate}`);
  }

  // Normalize start date to midnight (UTC) so day math is stable
  const start = new Date(
    Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate()
    )
  );

  // "One Time" → only the sheduleDate itself
  if (scheduleType === "One Time") {
    return [start.toISOString()];
  }

  if (scheduleType !== "Once a week" && scheduleType !== "Twice a week") {
    throw new Error(`Unsupported scheduleType: ${scheduleType}`);
  }

  // ---- Parse selectedDays --------------------------------------------
  let dayCodes = [];
  if (selectedDays) {
    try {
      dayCodes = typeof selectedDays === "string"
        ? JSON.parse(selectedDays)
        : selectedDays;
    } catch (err) {
      throw new Error(`Invalid selectedDays JSON: ${selectedDays}`);
    }
  }

  if (!Array.isArray(dayCodes) || dayCodes.length === 0) {
    throw new Error("selectedDays is required for recurring schedules");
  }

  const expectedCount = scheduleType === "Once a week" ? 1 : 2;
  if (dayCodes.length !== expectedCount) {
    throw new Error(
      `${scheduleType} expects exactly ${expectedCount} selected day(s), got ${dayCodes.length}`
    );
  }

  const selectedDayIndexes = dayCodes.map((code) => {
    const idx = DAY_CODE_TO_INDEX[code];
    if (idx === undefined) {
      throw new Error(`Invalid day code in selectedDays: ${code}`);
    }
    return idx;
  });

  // ---- Parse validPeriod (weeks) -------------------------------------
  const weeks = parseInt(validPeriod, 10);
  if (!weeks || weeks <= 0) {
    throw new Error("validPeriod (weeks) must be a positive number");
  }

  // ---- Generate dates ------------------------------------------------
  // Always start with the input sheduleDate as the first entry.
  const results = [start.toISOString()];

  // How many total occurrences we want: weeks × daysPerWeek
  const daysPerWeek = selectedDayIndexes.length;
  const totalOccurrences = weeks * daysPerWeek;

  // Walk forward day by day from the day AFTER sheduleDate until we've
  // collected enough matching days to reach totalOccurrences.
  const maxLookaheadDays = weeks * 7 + 7; // small safety buffer
  let offset = 1;

  while (results.length < totalOccurrences && offset <= maxLookaheadDays) {
    const current = new Date(start);
    current.setUTCDate(start.getUTCDate() + offset);

    if (selectedDayIndexes.includes(current.getUTCDay())) {
      results.push(current.toISOString());
    }
    offset++;
  }

  return results;
}

module.exports = { generateScheduleDates };