'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { EventEmitter } = require('node:events');
const Sequelize = require('sequelize');
const migration = require('../migrations/20261018100000-create-activity-logs');
const createdAtIndexMigration = require('../migrations/20261018103000-add-activity-logs-created-at-index');
const { createActivityAuditMiddleware } = require('../middleware/activityAudit.middleware');
const { activityContext } = require('../utils/activityContext');
const { sanitizeMetadata, sanitizeSqlQuery } = require('../utils/activityLogger');
const sequelize = require('../config/db');
const { ActivityLog } = require('../models');

test('sanitizeMetadata redacts sensitive keys and bounds cycles', () => {
  const metadata = { password: 'plain-secret', safe: 'ok', nested: { diagnosis: 'private' } };
  metadata.circular = metadata;

  const sanitized = sanitizeMetadata(metadata);

  assert.equal(sanitized.password, '[REDACTED]');
  assert.equal(sanitized.safe, 'ok');
  assert.equal(sanitized.nested.diagnosis, '[REDACTED]');
  assert.equal(sanitized.circular, '[CIRCULAR]');
});

test('sanitizeSqlQuery removes SQL literal and numeric values', () => {
  const sql = sanitizeSqlQuery("SELECT * FROM users WHERE email = 'patient@example.com' AND id = 90210");

  assert(!sql.includes('patient@example.com'));
  assert(!sql.includes('90210'));
  assert(sql.includes('[REDACTED]'));
});

test('ActivityLog supplies its required createdAt timestamp', () => {
  const log = ActivityLog.build({ category: 'auth', actionType: 'api.post.auth.register' });

  assert(log.createdAt instanceof Date);
});

test('activity log migration creates indexed audit fields', async () => {
  let schema;
  const indexes = [];

  await migration.up({
    createTable: async (tableName, definition) => {
      assert.equal(tableName, 'activity_logs');
      schema = definition;
    },
    addIndex: async (tableName, fields, options) => {
      assert.equal(tableName, 'activity_logs');
      indexes.push(options.name);
    }
  }, Sequelize);

  assert(schema.user_id);
  assert(schema.subject_user_id);
  assert(schema.action_type);
  assert(schema.ip_address);
  assert(schema.sql_query);
  assert(schema.metadata);
  assert.deepEqual(indexes, [
    'activity_logs_user_created_at_idx',
    'activity_logs_action_created_at_idx',
    'activity_logs_category_created_at_idx',
    'activity_logs_entity_idx'
  ]);
});

test('created-at index migration supports rollback', async () => {
  let addedIndex;
  let removedIndex;
  await createdAtIndexMigration.up({
    addIndex: async (tableName, fields, options) => {
      addedIndex = { tableName, fields, name: options.name };
    }
  });
  await createdAtIndexMigration.down({
    removeIndex: async (tableName, name) => {
      removedIndex = { tableName, name };
    }
  });

  assert.deepEqual(addedIndex, {
    tableName: 'activity_logs',
    fields: ['created_at'],
    name: 'activity_logs_created_at_idx'
  });
  assert.deepEqual(removedIndex, {
    tableName: 'activity_logs',
    name: 'activity_logs_created_at_idx'
  });
});

test('API audit middleware records route template and request SQL context', async () => {
  let activity;
  const middleware = createActivityAuditMiddleware(async event => {
    activity = event;
  });
  const req = {
    originalUrl: '/api/auth/reset-password/private-token?token=private-token',
    method: 'POST',
    headers: { 'user-agent': 'Mozilla/5.0 Chrome/130.0.0.0', 'x-request-id': 'request-1' },
    socket: { remoteAddress: '127.0.0.1' },
    auditActor: { id: 12, role: 'patient' },
    get(name) { return this.headers[name.toLowerCase()]; }
  };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writableFinished = false;

  middleware(req, res, () => {
    req.route = { path: '/reset-password/:token' };
    activityContext.getStore().sqlQueries.push('SELECT * FROM users WHERE id = ?');
    res.writableFinished = true;
    res.emit('finish');
  });

  await new Promise(resolve => setImmediate(resolve));

  assert.equal(activity.actionType, 'api.post.auth.reset-password.token');
  assert.equal(activity.category, 'auth');
  assert.equal(activity.requestPath, '/api/auth/reset-password/:token');
  assert.equal(activity.userId, 12);
  assert.equal(activity.sqlQuery, 'SELECT * FROM users WHERE id = ?');
  assert.equal(activity.metadata.sqlQueryCount, 1);
  assert(!activity.requestPath.includes('private-token'));
});

test('API audit middleware skips read-only requests', () => {
  let writeCount = 0;
  const middleware = createActivityAuditMiddleware(async () => {
    writeCount++;
  });
  const req = { method: 'GET' };
  const res = new EventEmitter();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.listenerCount('finish'), 0);
  assert.equal(writeCount, 0);
});

test('API audit middleware excludes login but keeps registration', () => {
  let writeCount = 0;
  const middleware = createActivityAuditMiddleware(async () => {
    writeCount++;
  });
  const loginRequest = { method: 'POST', originalUrl: '/api/auth/login?source=web' };
  const loginResponse = new EventEmitter();
  let loginNextCalled = false;

  middleware(loginRequest, loginResponse, () => {
    loginNextCalled = true;
  });

  assert.equal(loginNextCalled, true);
  assert.equal(loginResponse.listenerCount('finish'), 0);

  const registerRequest = { method: 'POST', originalUrl: '/api/auth/register' };
  const registerResponse = new EventEmitter();
  registerResponse.statusCode = 201;
  registerResponse.writableFinished = true;
  middleware(registerRequest, registerResponse, () => {
    registerRequest.route = { path: '/register' };
    registerResponse.emit('finish');
  });

  return new Promise(resolve => setImmediate(resolve)).then(() => {
    assert.equal(writeCount, 1);
  });
});

test('API audit middleware records PATCH mutations', async () => {
  let activity;
  const middleware = createActivityAuditMiddleware(async event => {
    activity = event;
  });
  const req = {
    originalUrl: '/api/admin/users/21/account-status',
    method: 'PATCH',
    params: { id: '21' },
    headers: {},
    socket: {}
  };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.writableFinished = true;

  middleware(req, res, () => {
    req.route = { path: '/users/:id/account-status' };
    res.emit('finish');
  });
  await new Promise(resolve => setImmediate(resolve));

  assert.equal(activity.req.method, 'PATCH');
  assert.equal(activity.actionType, 'api.patch.admin.users.id.account-status');
});

test('Sequelize logging captures sanitized SQL only inside an API audit context', () => {
  const context = { sqlQueries: [], sqlQueriesTruncated: false };
  const sql = "Executing (default): SELECT * FROM users WHERE email = 'private@example.com' AND id = 4102";

  sequelize.options.logging(sql);
  assert.equal(context.sqlQueries.length, 0);

  activityContext.run(context, () => sequelize.options.logging(sql));

  assert.equal(context.sqlQueries.length, 1);
  assert(!context.sqlQueries[0].includes('private@example.com'));
  assert(!context.sqlQueries[0].includes('4102'));
  assert(context.sqlQueries[0].includes('[REDACTED]'));
});
