// utils/userBasicUpdate.js
const { Op } = require('sequelize');
const { State, District } = require('../models');

const USER_BASIC_FIELDS = [
  'name', 'phone', 'dateOfBirth', 'gender',
  'address', 'stateId', 'districtId',
  'pincode', 'country', 'profileImage'
];

function invalidLocation(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

async function findLocation(model, id, name, where, transaction, label) {
  if (id !== undefined) {
    if (id === null || id === '') return null;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw invalidLocation(`Invalid ${label} selection`);
    }
    const location = await model.findByPk(numericId, { where, transaction });
    if (!location) throw invalidLocation(`Selected ${label} does not exist`);
    return location;
  }

  if (name !== undefined) {
    const normalizedName = String(name || '').trim();
    if (!normalizedName) return null;
    const location = await model.findOne({
      where: {
        ...where,
        name: { [Op.iLike]: normalizedName }
      },
      transaction
    });
    if (!location) throw invalidLocation(`Selected ${label} does not exist`);
    return location;
  }

  return undefined;
}

async function resolveLocationIds({
  stateId,
  districtId,
  stateName,
  districtName,
  existingStateId,
  existingDistrictId,
  transaction
}) {
  const stateSupplied = stateId !== undefined || stateName !== undefined;
  const districtSupplied = districtId !== undefined || districtName !== undefined;
  if (!stateSupplied && !districtSupplied) return null;

  const state = stateSupplied
    ? await findLocation(State, stateId, stateName, undefined, transaction, 'state')
    : await State.findByPk(existingStateId, { transaction });
  const district = districtSupplied
    ? await findLocation(District, districtId, districtName, state ? { stateId: state.id } : undefined, transaction, 'district')
    : (state ? await District.findByPk(existingDistrictId, { transaction }) : null);

  if (district && (!state || district.stateId !== state.id)) {
    throw invalidLocation('Selected district does not belong to the selected state');
  }

  return {
    stateId: state?.id || null,
    districtId: district?.id || null
  };
}

async function applyUserBasicUpdates(dbUser, payload = {}, transaction) {
  const updates = Object.fromEntries(
    USER_BASIC_FIELDS
      .filter(f => payload[f] !== undefined)
      .map(f => [f, payload[f]])
  );

  const locationUpdates = await resolveLocationIds({
    stateId: payload.stateId,
    districtId: payload.districtId,
    stateName: payload.state,
    districtName: payload.city,
    existingStateId: dbUser.stateId,
    existingDistrictId: dbUser.districtId,
    transaction
  });
  if (locationUpdates) Object.assign(updates, locationUpdates);

  if (Object.keys(updates).length) {
    await dbUser.update(updates, { transaction });
  }
}

module.exports = { applyUserBasicUpdates, resolveLocationIds, USER_BASIC_FIELDS };
