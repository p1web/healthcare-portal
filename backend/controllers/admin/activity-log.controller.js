'use strict';

const { Op } = require('sequelize');
const { ActivityLog, User } = require('../../models');

function parsePositiveInteger(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

function parseDate(value, endOfDay = false) {
  if (!value) return null;
  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
    : value;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

exports.list = async (req, res) => {
  const page = parsePositiveInteger(req.query.page, 1, 1_000_000);
  const limit = parsePositiveInteger(req.query.limit, 25, 100);
  const search = String(req.query.search || '').trim().slice(0, 120);
  const category = String(req.query.category || '').trim().slice(0, 50);
  const result = String(req.query.result || '').trim().toLowerCase();
  const userId = req.query.userId ? Number.parseInt(req.query.userId, 10) : null;
  const from = parseDate(req.query.from);
  const to = parseDate(req.query.to, true);

  if (from === undefined || to === undefined || (req.query.userId && (!Number.isInteger(userId) || userId < 1))) {
    return res.status(400).json({ success: false, message: 'Invalid activity log filters' });
  }
  if (result && !['success', 'failure', 'aborted'].includes(result)) {
    return res.status(400).json({ success: false, message: 'Invalid activity result filter' });
  }

  const where = {};
  if (category) where.category = category;
  if (result) where.result = result;
  if (userId) where.userId = userId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt[Op.gte] = from;
    if (to) where.createdAt[Op.lte] = to;
  }
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
    where[Op.or] = [
      { actionType: { [Op.iLike]: pattern } },
      { category: { [Op.iLike]: pattern } },
      { description: { [Op.iLike]: pattern } },
      { requestPath: { [Op.iLike]: pattern } },
      { entityType: { [Op.iLike]: pattern } },
      { entityId: { [Op.iLike]: pattern } }
    ];
    if (/^\d+$/.test(search)) {
      const searchedUserId = Number.parseInt(search, 10);
      where[Op.or].push({ userId: searchedUserId }, { subjectUserId: searchedUserId });
    }
  }

  try {
    const { count, rows } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'actor',
        attributes: ['id', 'name', 'email', 'role'],
        required: false
      }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true
    });

    return res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Failed to load activity logs:', error);
    return res.status(500).json({ success: false, message: 'Failed to load activity logs' });
  }
};