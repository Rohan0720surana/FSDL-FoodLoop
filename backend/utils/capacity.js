/**
 * capacity.js – a shelter's room for meals starts fresh every day.
 *
 * remainingCapacityToday goes down when the shelter accepts food. The first
 * time we look at a shelter on a new day, it is reset to capacityPerDay.
 */

// today's date on the server as "YYYY-MM-DD"
const todayString = (now = new Date()) => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + d;
};

/**
 * Resets a recipient's remaining capacity if it was last reset on an earlier day.
 * Saves the document when it changes. Returns the (possibly updated) document.
 */
const refreshDailyCapacity = async (org) => {
  if (!org || org.type !== 'RECIPIENT') return org;
  const today = todayString();
  if (org.capacityResetOn !== today) {
    org.remainingCapacityToday = org.capacityPerDay;
    org.capacityResetOn = today;
    await org.save();
  }
  return org;
};

module.exports = { todayString, refreshDailyCapacity };
