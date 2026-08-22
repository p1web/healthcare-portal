// utils/userBasicUpdate.js
const USER_BASIC_FIELDS = [
  'name', 'phone', 'dateOfBirth', 'gender',
  'address', 'city', 'state',
  'pincode', 'country', 'profileImage'
];

async function applyUserBasicUpdates(dbUser, payload = {}, transaction) {
  const updates = Object.fromEntries(
    USER_BASIC_FIELDS
      .filter(f => payload[f] !== undefined)
      .map(f => [f, payload[f]])
  );

  if (Object.keys(updates).length) {
    await dbUser.update(updates, { transaction });
  }
}

module.exports = { applyUserBasicUpdates, USER_BASIC_FIELDS };
