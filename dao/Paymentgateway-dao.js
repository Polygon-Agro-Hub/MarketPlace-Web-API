const { collectionofficer } = require("../startup/database");

/**
 * Saves a pending checkout session before redirecting to hosted gateway.
 */
exports.savePendingCheckout = (reference, userId, cartId, payload, amount, sessionId = null) => {
  return new Promise((resolve, reject) => {
    const sql = `
      INSERT INTO pending_checkout_sessions (reference, sessionId, userId, cartId, payload, amount, status)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
      ON DUPLICATE KEY UPDATE
        sessionId = COALESCE(VALUES(sessionId), sessionId),
        payload = VALUES(payload),
        amount = VALUES(amount),
        status = 'PENDING'
    `;
    const values = [
      reference,
      sessionId,
      userId,
      cartId,
      JSON.stringify(payload),
      parseFloat(amount),
    ];

    collectionofficer.query(sql, values, (err, result) => {
      if (err) {
        console.error("[PG DAO] Error saving pending checkout:", err);
        return reject(err);
      }
      resolve(result);
    });
  });
};

/**
 * Retrieves a pending checkout session by reference.
 */
exports.getPendingCheckout = (reference) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT *
      FROM pending_checkout_sessions
      WHERE reference = ?
      LIMIT 1
    `;
    collectionofficer.query(sql, [reference], (err, rows) => {
      if (err) {
        console.error("[PG DAO] Error retrieving pending checkout:", err);
        return reject(err);
      }
      if (!rows || rows.length === 0) {
        return resolve(null);
      }
      const session = rows[0];
      try {
        if (typeof session.payload === "string") {
          session.payload = JSON.parse(session.payload);
        }
      } catch (e) {
        // payload may already be parsed by mysql2
      }
      resolve(session);
    });
  });
};

/**
 * Updates pending checkout status and links placed orderId.
 */
exports.updatePendingCheckoutStatus = (reference, status, orderId = null) => {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE pending_checkout_sessions
      SET status = ?, orderId = ?
      WHERE reference = ?
    `;
    collectionofficer.query(sql, [status, orderId, reference], (err, result) => {
      if (err) {
        console.error("[PG DAO] Error updating pending checkout:", err);
        return reject(err);
      }
      resolve(result.affectedRows > 0);
    });
  });
};

/**
 * Retrieves user profile details to populate customer info on checkout page
 */
exports.getUserProfile = (userId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT id, firstName, lastName, email, phoneNumber, phoneCode
      FROM marketplaceusers
      WHERE id = ?
      LIMIT 1
    `;
    collectionofficer.query(sql, [userId], (err, rows) => {
      if (err) {
        return reject(err);
      }
      resolve(rows[0] || null);
    });
  });
};

/**
 * Retrieves order and process order summary for return UI
 */
exports.getOrderStatusSummary = (orderId) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT o.id as orderId, o.userId, po.invNo as invoiceNumber, po.status, po.isPaid, po.amount
      FROM orders o
      LEFT JOIN processorders po ON o.id = po.orderId
      WHERE o.id = ?
      LIMIT 1
    `;
    collectionofficer.query(sql, [orderId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || null);
    });
  });
};