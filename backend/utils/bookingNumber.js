'use strict';

// BK-YYYYMMDD-<6-char base32>. Not cryptographically strong — just
// short and collision-resistant enough for the ~1 collision/million range
// at booking volume; caller should catch unique-constraint errors and
// retry.
const crypto = require('crypto');

const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford base32, no I/L/O/U.

function randomSuffix(len = 6) {
  const bytes = crypto.randomBytes(len);
  let out = '';
  for (let i = 0; i < len; i++) {
    out += ALPHABET[bytes[i] & 0x1f];
  }
  return out;
}

function generateBookingNumber(date = new Date()) {
  const y = date.getUTCFullYear().toString().padStart(4, '0');
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const d = date.getUTCDate().toString().padStart(2, '0');
  return `BK-${y}${m}${d}-${randomSuffix(6)}`;
}

module.exports = { generateBookingNumber };
