'use strict';

// Single-commission model: platform takes a percent of the (post-discount) fee
// as commission (billed to the hospital); the doctor receives the remainder.
// Rate lives on hospital_profiles.hospital_commission_percent (MOU-driven).

let cachedDefault = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 60_000;

function toNumber(value, fallback = 0) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  return Number.isFinite(n) ? n : fallback;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

async function getPlatformDefaults({ PlatformCommissionSettings, force = false } = {}) {
  if (!force && cachedDefault !== null && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return { defaultCommissionPercent: cachedDefault };
  }
  const row = await PlatformCommissionSettings.findOne({ order: [['id', 'ASC']] });
  cachedDefault = row ? toNumber(row.defaultCommissionPercent, 20) : 20;
  cacheLoadedAt = Date.now();
  return { defaultCommissionPercent: cachedDefault };
}

function invalidatePlatformDefaultsCache() {
  cachedDefault = null;
  cacheLoadedAt = 0;
}

// Splits `basePrice` (already post-discount) into platform revenue + doctor payout.
// hospitalCommissionPercent comes from HospitalProfile.hospitalCommissionPercent.
function computeCommission({ basePrice, hospitalCommissionPercent }) {
  const base = toNumber(basePrice, 0);
  const pct = toNumber(hospitalCommissionPercent, 0);
  if (base <= 0) {
    return { platformRevenue: 0, doctorPayout: 0, commissionPercent: pct };
  }
  const platformRevenue = round2((base * pct) / 100);
  const doctorPayout = round2(base - platformRevenue);
  return { platformRevenue, doctorPayout, commissionPercent: pct };
}

module.exports = {
  computeCommission,
  getPlatformDefaults,
  invalidatePlatformDefaultsCache
};

