'use strict';

// Commission math + auto mode resolution for doctor_practices.
// See /memories/session/plan.md for the design decisions.

const { COMMISSION_MODES } = require('../models/doctor-practice');

let cachedDefaults = null;
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
  if (!force && cachedDefaults && Date.now() - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedDefaults;
  }
  const row = await PlatformCommissionSettings.findOne({ order: [['id', 'ASC']] });
  cachedDefaults = row
    ? {
        soloPlatform: toNumber(row.defaultSoloCommissionPercent, 15),
        splitPlatform: toNumber(row.defaultSplitPlatformCommissionPercent, 10),
        splitHospital: toNumber(row.defaultSplitHospitalPayoutPercent, 15),
        splitDoctor: toNumber(row.defaultSplitDoctorPayoutPercent, 75)
      }
    : { soloPlatform: 15, splitPlatform: 10, splitHospital: 15, splitDoctor: 75 };
  cacheLoadedAt = Date.now();
  return cachedDefaults;
}

function invalidatePlatformDefaultsCache() {
  cachedDefaults = null;
  cacheLoadedAt = 0;
}

// A practice is single-commission iff the hospital is solo OR the doctor owns the hospital.
function resolveCommissionMode({ hospitalProfile, doctorProfile }) {
  if (!hospitalProfile || !doctorProfile) return COMMISSION_MODES.SPLIT;
  const kind = hospitalProfile.hospitalKind || hospitalProfile.hospital_kind;
  if (kind === 'solo_practice') return COMMISSION_MODES.SINGLE;
  const hospOwner = hospitalProfile.userId ?? hospitalProfile.user_id;
  const docOwner = doctorProfile.userId ?? doctorProfile.user_id;
  if (hospOwner != null && docOwner != null && hospOwner === docOwner) {
    return COMMISSION_MODES.SINGLE;
  }
  return COMMISSION_MODES.SPLIT;
}

// Returns the default percent breakdown for a practice, given resolved mode.
function defaultPercentsForMode(mode, defaults) {
  if (mode === COMMISSION_MODES.SINGLE) {
    return {
      platform: defaults.soloPlatform,
      hospital: 0,
      doctor: 0
    };
  }
  return {
    platform: defaults.splitPlatform,
    hospital: defaults.splitHospital,
    doctor: defaults.splitDoctor
  };
}

// Splits `basePrice` (already post-discount) into platform revenue + payouts.
// single mode: platform takes its commission; the sole payee (owner-doctor)
//   gets the rest, recorded as doctorPayoutAmount.
// split mode: platform commission + hospital payout + doctor payout each
//   applied independently.
function computeCommissionSplit({ basePrice, practice }) {
  const base = toNumber(basePrice, 0);
  if (base <= 0 || !practice) {
    return {
      platformRevenue: 0,
      hospitalPayout: 0,
      doctorPayout: 0,
      commissionMode: practice?.commissionMode || COMMISSION_MODES.SPLIT
    };
  }
  const mode = practice.commissionMode || COMMISSION_MODES.SPLIT;
  const platformPct = toNumber(practice.platformCommissionPercent, 0);
  const hospitalPct = toNumber(practice.hospitalPayoutPercent, 0);
  const doctorPct = toNumber(practice.doctorPayoutPercent, 0);

  if (mode === COMMISSION_MODES.SINGLE) {
    const platformRevenue = round2((base * platformPct) / 100);
    const doctorPayout = round2(base - platformRevenue);
    return { platformRevenue, hospitalPayout: 0, doctorPayout, commissionMode: mode };
  }

  const platformRevenue = round2((base * platformPct) / 100);
  const hospitalPayout = round2((base * hospitalPct) / 100);
  const doctorPayout = round2((base * doctorPct) / 100);
  return { platformRevenue, hospitalPayout, doctorPayout, commissionMode: mode };
}

module.exports = {
  COMMISSION_MODES,
  resolveCommissionMode,
  defaultPercentsForMode,
  computeCommissionSplit,
  getPlatformDefaults,
  invalidatePlatformDefaultsCache
};
