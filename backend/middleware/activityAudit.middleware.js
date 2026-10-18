'use strict';

const { logActivity } = require('../utils/activityLogger');
const { activityContext } = require('../utils/activityContext');
const { truncate } = require('../utils/activitySanitizers');

function getSafeRequestPath(req) {
  const originalPath = (req.originalUrl || req.url || req.path || '/').split(/[?#]/, 1)[0];
  const actualSegments = originalPath.split('/').filter(Boolean);
  const routePath = req.route?.path;

  let routeSegments = null;
  if (typeof routePath === 'string') {
    routeSegments = routePath.split('/').filter(Boolean);
  }

  if (routeSegments?.length && routeSegments.length <= actualSegments.length) {
    const prefixSegments = actualSegments.slice(0, actualSegments.length - routeSegments.length);
    return `/${[...prefixSegments, ...routeSegments].map(sanitizePathSegment).join('/')}`;
  }

  return `/${actualSegments.map(segment => {
    if (/^\d+$/.test(segment) || /^[a-f\d-]{32,}$/i.test(segment) || segment.length > 64) return ':id';
    return sanitizePathSegment(segment);
  }).join('/')}`;
}

function sanitizePathSegment(segment) {
  return segment.replace(/[^a-zA-Z0-9._:-]/g, '_').slice(0, 100);
}

function getRouteDetails(req) {
  const requestPath = getSafeRequestPath(req);
  const pathSegments = requestPath.split('/').filter(Boolean);
  const apiIndex = pathSegments.indexOf('api');
  const apiSegments = apiIndex >= 0 ? pathSegments.slice(apiIndex + 1) : pathSegments;
  const category = apiSegments[0] || 'api';
  const method = (req.method || 'GET').toLowerCase();
  const routeName = apiSegments.map(segment => segment.replace(/^:/, '')).join('.') || 'root';

  return {
    category: truncate(category, 50),
    actionType: truncate(`api.${method}.${routeName}`, 100),
    requestPath
  };
}

function createActivityAuditMiddleware(activityWriter = logActivity) {
  return function activityAuditMiddleware(req, res, next) {
    const method = (req.method || 'GET').toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return next();
    const requestPath = (req.originalUrl || req.url || req.path || '/')
      .split(/[?#]/, 1)[0]
      .replace(/\/+$/, '')
      .toLowerCase();
    if (method === 'POST' && requestPath === '/api/auth/login') return next();

    const startedAt = Date.now();
    const context = { sqlQueries: [], sqlQueriesTruncated: false };

    req.auditRequestPath = (req.originalUrl || req.url || req.path || '/').split(/[?#]/, 1)[0];

    const recordActivity = result => {
      if (context.activityLogged) return;
      context.activityLogged = true;

      const route = getRouteDetails(req);
      req.auditRequestPath = route.requestPath;
      const actor = req.auditActor || req.user || null;
      const routeSegments = route.requestPath.split('/').filter(Boolean);
      const dynamicSegmentIndex = routeSegments.findIndex(segment => segment.startsWith(':'));
      const entityType = dynamicSegmentIndex > 0 ? routeSegments[dynamicSegmentIndex - 1] : null;
      const entityParam = Object.entries(req.params || {}).find(([key]) => /^(id|.*Id)$/i.test(key));
      const entityId = req.auditEntityId ?? entityParam?.[1] ?? null;
      const files = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
      const statusCode = result === 'aborted' ? null : res.statusCode;

      return Promise.resolve(activityWriter({
        req,
        userId: actor?.id ?? null,
        actorRole: actor?.role ?? null,
        subjectUserId: req.auditSubjectUserId ?? (entityType === 'users' ? entityId : null),
        category: route.category,
        actionType: route.actionType,
        result,
        description: result === 'aborted'
          ? 'API request connection closed before completion'
          : `API request completed with HTTP ${statusCode}`,
        requestPath: route.requestPath,
        entityType,
        entityId,
        sqlQuery: context.sqlQueries.join('\n'),
        metadata: {
          statusCode,
          durationMs: Date.now() - startedAt,
          sqlQueryCount: context.sqlQueries.length,
          sqlQueriesTruncated: context.sqlQueriesTruncated,
          uploadedFileCount: files.length
        }
      })).catch(error => {
        console.error('Failed to write activity log:', error.message);
      });
    };

    activityContext.run(context, () => {
      res.once('finish', () => {
        void recordActivity(res.statusCode >= 400 ? 'failure' : 'success');
      });
      res.once('close', () => {
        if (!res.writableFinished) void recordActivity('aborted');
      });
      next();
    });
  };
}

module.exports = createActivityAuditMiddleware();
module.exports.createActivityAuditMiddleware = createActivityAuditMiddleware;
module.exports.getRouteDetails = getRouteDetails;