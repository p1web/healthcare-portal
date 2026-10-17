const { State, District } = require('../models');

function userLocationIncludes() {
  return [
    { model: State, as: 'stateMaster', attributes: ['id', 'name'], required: false },
    { model: District, as: 'districtMaster', attributes: ['id', 'name'], required: false }
  ];
}

function hospitalLocationIncludes() {
  return [
    { model: State, as: 'hospitalStateMaster', attributes: ['id', 'name'], required: false },
    { model: District, as: 'hospitalDistrictMaster', attributes: ['id', 'name'], required: false }
  ];
}

module.exports = { userLocationIncludes, hospitalLocationIncludes };