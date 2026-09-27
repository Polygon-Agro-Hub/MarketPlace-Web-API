
const { emitCatalogUpdate } = require('./socket');
const db = require('./startup/database');

const POLL_INTERVAL_MS = 3000; // tune: lower = snappier, more DB load
 
let lastPkgHash = null;
let lastPkgDetailHash = null;
let lastItemsHash = null;
let pollTimer = null;
 
const CHECK_QUERY = `
  SELECT
    (SELECT COALESCE(BIT_XOR(CRC32(CONCAT_WS(':', id, displayName, status, isValid, productPrice, packingFee, serviceFee))), 0)
       FROM marketplacepackages) AS pkgHash,
    (SELECT COALESCE(BIT_XOR(CRC32(CONCAT_WS(':', id, packageId, qty, productTypeId))), 0)
       FROM packagedetails) AS pkgDetailHash,
    (SELECT COALESCE(BIT_XOR(CRC32(CONCAT_WS(':', id, displayName, category, normalPrice, discountedPrice, discount, isEnable))), 0)
       FROM marketplaceitems) AS itemsHash
`;
 
function runCheck() {
  db.collectionofficer.query(CHECK_QUERY, (err, results) => {
    if (err) {
      console.error('catalogChangeWatcher: check query failed:', err);
      return;
    }
 
    const { pkgHash, pkgDetailHash, itemsHash } = results[0];
    const isFirstRun = lastPkgHash === null;
    const changed =
      pkgHash !== lastPkgHash ||
      pkgDetailHash !== lastPkgDetailHash ||
      itemsHash !== lastItemsHash;
 
    lastPkgHash = pkgHash;
    lastPkgDetailHash = pkgDetailHash;
    lastItemsHash = itemsHash;
 
    if (changed && !isFirstRun) {
      console.log('📦 [catalogChangeWatcher] Change detected, broadcasting');
      emitCatalogUpdate({ type: 'catalog', source: 'poll' });
    }
  });
}
 
function startCatalogChangeWatcher() {
  if (pollTimer) return;
  runCheck()
  pollTimer = setInterval(runCheck, POLL_INTERVAL_MS);
  console.log(`catalogChangeWatcher started (every ${POLL_INTERVAL_MS}ms)`);
}
 
function stopCatalogChangeWatcher() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
 
module.exports = { startCatalogChangeWatcher, stopCatalogChangeWatcher };