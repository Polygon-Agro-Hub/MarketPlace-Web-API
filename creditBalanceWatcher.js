const { getIO, emitCreditBalance } = require('./socket');
const db = require('./startup/database');

const POLL_INTERVAL_MS = 3000;
const lastBalances = new Map(); // userId -> last balance string
let pollTimer = null;
let running = false;

function getConnectedUserIds() {
  const ids = [];
  for (const room of getIO().sockets.adapter.rooms.keys()) {
    if (room.startsWith('user:')) ids.push(Number(room.slice(5)));
  }
  return ids;
}

function runCheck() {
  if (running) return; // don't overlap slow queries
  let ids;
  try {
    ids = getConnectedUserIds();
  } catch {
    return; // socket not ready yet
  }

  // Forget users who disconnected, so a reconnect gets a fresh sync
  for (const id of lastBalances.keys()) {
    if (!ids.includes(id)) lastBalances.delete(id);
  }
  if (ids.length === 0) return;

  running = true;
  db.collectionofficer.query(
    'SELECT id, creditBalance FROM marketplaceusers WHERE id IN (?)',
    [ids],
    (err, rows) => {
      running = false;
      if (err) {
        console.error('creditBalanceWatcher: query failed:', err);
        return;
      }
      rows.forEach(({ id, creditBalance }) => {
        const current = String(creditBalance); // DECIMAL comes back as a string
        // Emits on change, and once when a user is first seen (fixes any missed update before connect)
        if (lastBalances.get(id) !== current) {
          lastBalances.set(id, current);
          emitCreditBalance(id, current);
        }
      });
    }
  );
}

function startCreditBalanceWatcher() {
  if (pollTimer) return;
  pollTimer = setInterval(runCheck, POLL_INTERVAL_MS);
  console.log(`creditBalanceWatcher started (every ${POLL_INTERVAL_MS}ms)`);
}

function stopCreditBalanceWatcher() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
}

module.exports = { startCreditBalanceWatcher, stopCreditBalanceWatcher };