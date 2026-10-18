'use strict';

const { ActivityLog } = require('../models');
const { activityContext } = require('./activityContext');
const { getBrowser, sanitizeMetadata, sanitizeSqlQuery, truncate } = require('./activitySanitizers');

function getRequestDetails(req) {
  if (!req) return {};

  const userAgent = truncate(req.get?.('user-agent') || req.headers?.['user-agent'], 2048);
  const requestPath = req.auditRequestPath || req.path || req.originalUrl?.split(/[?#]/, 1)[0] || null;

  return {
    userId: req.user?.id ?? null,
    actorRole: req.user?.role ?? null,
    requestId: truncate(req.id || req.get?.('x-request-id') || req.headers?.['x-request-id'], 128),
    httpMethod: truncate(req.method, 10),
    requestPath: truncate(requestPath, 2048),
    ipAddress: req.ip || req.socket?.remoteAddress || null,
    browser: getBrowser(userAgent),
    userAgent
  };
}

async function logActivity({ req, userId, subjectUserId, actorRole, category, actionType, result = 'success', description, entityType, entityId, sqlQuery, metadata = {} }) {
  if (!actionType || typeof actionType !== 'string') {
    throw new TypeError('activity actionType is required');
  }
  if (!category || typeof category !== 'string') {
    throw new TypeError('activity category is required');
  }

  const requestDetails = getRequestDetails(req);
  const context = activityContext.getStore();
  const capturedSql = sqlQuery ?? context?.sqlQueries?.join('\n');

  return ActivityLog.create({
    ...requestDetails,
    userId: userId ?? requestDetails.userId ?? null,
    subjectUserId: subjectUserId ?? null,
    actorRole: actorRole ?? requestDetails.actorRole ?? null,
    category: category.slice(0, 50),
    actionType: actionType.slice(0, 100),
    result: String(result).slice(0, 20),
    description: truncate(description),
    entityType: truncate(entityType, 100),
    entityId: entityId == null ? null : String(entityId).slice(0, 128),
    sqlQuery: sanitizeSqlQuery(capturedSql),
    metadata: sanitizeMetadata(metadata) || {}
  });
}

module.exports = { logActivity, sanitizeMetadata, sanitizeSqlQuery };