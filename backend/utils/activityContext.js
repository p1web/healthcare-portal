'use strict';

const { AsyncLocalStorage } = require('node:async_hooks');

const activityContext = new AsyncLocalStorage();

module.exports = { activityContext };