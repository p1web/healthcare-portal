'use strict';

const SENSITIVE_KEY = /password|token|secret|authorization|cookie|bank|account.?number|routing|phone|email|address|birth|medical|diagnos|prescription|document|file.?name/i;
const MAX_TEXT_LENGTH = 4000;

function truncate(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') return null;
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, maxLength);
}

function sanitizeMetadata(value, depth = 0, seen = new WeakSet()) {
  if (value == null || typeof value === 'boolean' || typeof value === 'number') return value;
  if (typeof value === 'string') return truncate(value, 1000);
  if (depth >= 6) return '[TRUNCATED]';
  if (typeof value !== 'object') return String(value).slice(0, 1000);
  if (seen.has(value)) return '[CIRCULAR]';
  seen.add(value);

  if (Array.isArray(value)) {
    return value.slice(0, 100).map(item => sanitizeMetadata(item, depth + 1, seen));
  }

  return Object.fromEntries(Object.entries(value).slice(0, 100).map(([key, item]) => [
    key,
    SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitizeMetadata(item, depth + 1, seen)
  ]));
}

function sanitizeSqlQuery(sqlQuery) {
  if (typeof sqlQuery !== 'string') return null;

  return sqlQuery
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\r\n]*/g, ' ')
    .replace(/(\$[a-zA-Z_0-9]*\$)[\s\S]*?\1/g, '$1[REDACTED]$1')
    .replace(/'(?:''|\\.|[^'])*'/g, "'[REDACTED]'")
    .replace(/\b\d+(?:\.\d+)?\b/g, '?')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 10000);
}

function getBrowser(userAgent) {
  if (!userAgent) return null;

  const browsers = [
    [/Edg\/([\d.]+)/, 'Edge'],
    [/OPR\/([\d.]+)/, 'Opera'],
    [/Firefox\/([\d.]+)/, 'Firefox'],
    [/Chrome\/([\d.]+)/, 'Chrome'],
    [/Version\/([\d.]+).*Safari/, 'Safari'],
    [/MSIE ([\d.]+)/, 'Internet Explorer'],
    [/Trident\/.*rv:([\d.]+)/, 'Internet Explorer']
  ];

  for (const [pattern, name] of browsers) {
    const match = userAgent.match(pattern);
    if (match) return `${name} ${match[1]}`.slice(0, 120);
  }

  return 'Unknown';
}

module.exports = { getBrowser, sanitizeMetadata, sanitizeSqlQuery, truncate };