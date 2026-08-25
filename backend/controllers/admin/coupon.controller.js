const { Coupon, CouponCategory, HospitalProfile, CouponUsage, sequelize } = require('../../models');
const { Op, fn, col, literal } = require('sequelize');

function formatCoupon(coupon) {
  const json = coupon.toJSON();
  return {
    id: json.id,
    code: json.code,
    title: json.title,
    description: json.description,
    discountText: json.discountText,
    discountType: json.discountType,
    discountValue: json.discountValue !== null ? parseFloat(json.discountValue) : null,
    minAmount: json.minAmount !== null ? parseFloat(json.minAmount) : null,
    maxDiscount: json.maxDiscount !== null ? parseFloat(json.maxDiscount) : null,
    validFrom: json.validFrom,
    validUntil: json.validUntil,
    usageLimit: json.usageLimit,
    maxUsesPerUser: json.maxUsesPerUser,
    usedCount: json.usedCount,
    categoryId: json.categoryId,
    category: json.category || null,
    hospitals: (json.hospitals || []).map(h => ({
      id: h.id,
      name: h.hospitalName || h.name || null
    })),
    hospitalIds: (json.hospitals || []).map(h => h.id),
    terms: json.terms || [],
    isActive: json.isActive,
    isDeleted: json.isDeleted,
    created_at: json.created_at,
    updated_at: json.updated_at
  };
}

const hospitalInclude = {
  model: HospitalProfile,
  as: 'hospitals',
  attributes: ['id', 'hospitalName'],
  through: { attributes: [] }
};

module.exports = {
  // GET /api/admin/coupons?status=all|active|inactive&includeDeleted=true&categoryId=&search=
  async getCoupons(req, res) {
    try {
      const { status, includeDeleted, categoryId, search } = req.query;
      const where = {};
      if (includeDeleted !== 'true') where.isDeleted = false;
      if (status === 'active') where.isActive = true;
      else if (status === 'inactive') where.isActive = false;
      if (categoryId) where.categoryId = categoryId;
      if (search) {
        where[Op.or] = [
          { code: { [Op.iLike]: `%${search}%` } },
          { title: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const coupons = await Coupon.unscoped().findAll({
        where,
        include: [
          {
            model: CouponCategory.unscoped(),
            as: 'category',
            attributes: ['id', 'name', 'slug', 'icon']
          },
          hospitalInclude
        ],
        order: [['id', 'DESC']]
      });

      res.json({ success: true, data: coupons.map(formatCoupon) });
    } catch (error) {
      console.error('Error fetching coupons:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
    }
  },

  async getCouponById(req, res) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.unscoped().findByPk(id, {
        include: [
          { model: CouponCategory.unscoped(), as: 'category' },
          hospitalInclude
        ]
      });
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
      res.json({ success: true, data: formatCoupon(coupon) });
    } catch (error) {
      console.error('Error fetching coupon:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch coupon', error: error.message });
    }
  },

  async createCoupon(req, res) {
    try {
      const {
        code, title, description, discountText, discountType, discountValue,
        minAmount, maxDiscount, validFrom, validUntil, usageLimit,
        categoryId, terms, hospitalIds, isActive, maxUsesPerUser
      } = req.body;

      const errors = validateCouponPayload(req.body, { isCreate: true });
      if (errors.length) {
        return res.status(400).json({ success: false, message: errors[0], errors });
      }

      const upperCode = String(code).trim().toUpperCase();

      const category = await CouponCategory.unscoped().findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId' });
      }

      const existing = await Coupon.unscoped().findOne({ where: { code: upperCode } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Coupon code already exists' });
      }

      const coupon = await Coupon.create({
        code: upperCode,
        title: String(title).trim(),
        description: String(description).trim(),
        discountText: String(discountText).trim(),
        discountType,
        discountValue,
        minAmount: minAmount ?? null,
        maxDiscount: maxDiscount ?? null,
        validFrom,
        validUntil,
        usageLimit: usageLimit ?? null,
        categoryId,
        terms: Array.isArray(terms) ? terms : (terms ? [terms] : []),
        isActive: isActive !== undefined ? !!isActive : true,
        isDeleted: false,
        maxUsesPerUser: maxUsesPerUser ?? null
      });

      if (Array.isArray(hospitalIds) && hospitalIds.length > 0) {
        const hospitals = await HospitalProfile.findAll({ where: { id: hospitalIds } });
        await coupon.setHospitals(hospitals);
      }

      const created = await Coupon.unscoped().findByPk(coupon.id, {
        include: [
          { model: CouponCategory.unscoped(), as: 'category' },
          hospitalInclude
        ]
      });

      res.status(201).json({ success: true, message: 'Coupon created successfully', data: formatCoupon(created) });
    } catch (error) {
      console.error('Error creating coupon:', error);
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ success: false, message: 'Coupon code already exists' });
      }
      res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
    }
  },

  async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.unscoped().findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }

      const errors = validateCouponPayload(req.body, { isCreate: false });
      if (errors.length) {
        return res.status(400).json({ success: false, message: errors[0], errors });
      }

      const {
        code, title, description, discountText, discountType, discountValue,
        minAmount, maxDiscount, validFrom, validUntil, usageLimit,
        categoryId, terms, isActive, hospitalIds, maxUsesPerUser
      } = req.body;

      if (code !== undefined) {
        const upperCode = String(code).trim().toUpperCase();
        if (upperCode !== coupon.code) {
          const conflict = await Coupon.unscoped().findOne({
            where: { code: upperCode, id: { [Op.ne]: id } }
          });
          if (conflict) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
          }
          coupon.code = upperCode;
        }
      }

      if (categoryId !== undefined) {
        const category = await CouponCategory.unscoped().findByPk(categoryId);
        if (!category) {
          return res.status(400).json({ success: false, message: 'Invalid categoryId' });
        }
        coupon.categoryId = categoryId;
      }

      if (title !== undefined) coupon.title = String(title).trim();
      if (description !== undefined) coupon.description = String(description).trim();
      if (discountText !== undefined) coupon.discountText = String(discountText).trim();
      if (discountType !== undefined) coupon.discountType = discountType;
      if (discountValue !== undefined) coupon.discountValue = discountValue;
      if (minAmount !== undefined) coupon.minAmount = minAmount ?? null;
      if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ?? null;
      if (validFrom !== undefined) coupon.validFrom = validFrom;
      if (validUntil !== undefined) coupon.validUntil = validUntil;
      if (usageLimit !== undefined) coupon.usageLimit = usageLimit ?? null;
      if (maxUsesPerUser !== undefined) coupon.maxUsesPerUser = maxUsesPerUser ?? null;
      if (terms !== undefined) coupon.terms = Array.isArray(terms) ? terms : (terms ? [terms] : []);
      if (isActive !== undefined) coupon.isActive = !!isActive;

      await coupon.save();

      if (Array.isArray(hospitalIds)) {
        const hospitals = hospitalIds.length
          ? await HospitalProfile.findAll({ where: { id: hospitalIds } })
          : [];
        await coupon.setHospitals(hospitals);
      }

      const updated = await Coupon.unscoped().findByPk(id, {
        include: [
          { model: CouponCategory.unscoped(), as: 'category' },
          hospitalInclude
        ]
      });

      res.json({ success: true, message: 'Coupon updated successfully', data: formatCoupon(updated) });
    } catch (error) {
      console.error('Error updating coupon:', error);
      res.status(500).json({ success: false, message: 'Failed to update coupon', error: error.message });
    }
  },

  // DELETE (soft) — sets is_deleted=true; does NOT touch is_active
  async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.unscoped().findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
      coupon.isDeleted = true;
      await coupon.save();
      res.json({ success: true, message: 'Coupon deleted successfully' });
    } catch (error) {
      console.error('Error deleting coupon:', error);
      res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
    }
  },

  // RESTORE
  async restoreCoupon(req, res) {
    try {
      const { id } = req.params;
      const coupon = await Coupon.unscoped().findByPk(id);
      if (!coupon) {
        return res.status(404).json({ success: false, message: 'Coupon not found' });
      }
      coupon.isDeleted = false;
      await coupon.save();
      const restored = await Coupon.unscoped().findByPk(id, {
        include: [
          { model: CouponCategory.unscoped(), as: 'category' },
          hospitalInclude
        ]
      });
      res.json({ success: true, message: 'Coupon restored successfully', data: formatCoupon(restored) });
    } catch (error) {
      console.error('Error restoring coupon:', error);
      res.status(500).json({ success: false, message: 'Failed to restore coupon', error: error.message });
    }
  },

  // GET /api/admin/coupons-analytics
  async getAnalytics(req, res) {
    try {
      const now = new Date();

      const totalCoupons = await Coupon.unscoped().count();
      const activeCoupons = await Coupon.unscoped().count({ where: { isActive: true, isDeleted: false } });
      const deletedCoupons = await Coupon.unscoped().count({ where: { isDeleted: true } });
      const expiredCoupons = await Coupon.unscoped().count({
        where: { isDeleted: false, validUntil: { [Op.lt]: now } }
      });

      const usageAgg = await CouponUsage.findOne({
        attributes: [
          [fn('COUNT', col('id')), 'totalRedemptions'],
          [fn('COALESCE', fn('SUM', col('discount_amount')), 0), 'totalDiscountGiven']
        ],
        raw: true
      });

      // Top 5 coupons by usage
      const topCoupons = await Coupon.unscoped().findAll({
        where: { isDeleted: false },
        order: [['usedCount', 'DESC']],
        limit: 5,
        attributes: ['id', 'code', 'title', 'discountText', 'usedCount', 'usageLimit'],
        include: [{ model: CouponCategory.unscoped(), as: 'category', attributes: ['id', 'name'] }]
      });

      // Category breakdown
      const categoryBreakdown = await Coupon.unscoped().findAll({
        where: { isDeleted: false },
        attributes: [
          'categoryId',
          [fn('COUNT', col('Coupon.id')), 'couponCount'],
          [fn('COALESCE', fn('SUM', col('used_count')), 0), 'totalUses']
        ],
        include: [{ model: CouponCategory.unscoped(), as: 'category', attributes: ['id', 'name'] }],
        group: ['Coupon.category_id', 'category.id'],
        raw: false
      });

      // Coupons expiring in next 7 days
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const expiringSoon = await Coupon.unscoped().findAll({
        where: {
          isDeleted: false,
          isActive: true,
          validUntil: { [Op.between]: [now, in7Days] }
        },
        attributes: ['id', 'code', 'title', 'validUntil'],
        order: [['validUntil', 'ASC']],
        limit: 10
      });

      res.json({
        success: true,
        data: {
          totals: {
            totalCoupons,
            activeCoupons,
            deletedCoupons,
            expiredCoupons,
            totalRedemptions: Number(usageAgg?.totalRedemptions || 0),
            totalDiscountGiven: parseFloat(usageAgg?.totalDiscountGiven || 0)
          },
          topCoupons: topCoupons.map(c => ({
            id: c.id,
            code: c.code,
            title: c.title,
            discountText: c.discountText,
            usedCount: c.usedCount,
            usageLimit: c.usageLimit,
            category: c.category ? { id: c.category.id, name: c.category.name } : null
          })),
          categoryBreakdown: categoryBreakdown.map(row => {
            const j = row.toJSON();
            return {
              categoryId: j.categoryId,
              categoryName: j.category?.name || 'Uncategorized',
              couponCount: Number(j.couponCount),
              totalUses: Number(j.totalUses)
            };
          }),
          expiringSoon: expiringSoon.map(c => ({
            id: c.id,
            code: c.code,
            title: c.title,
            validUntil: c.validUntil
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching coupon analytics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
    }
  },

  // POST /api/admin/coupons/bulk  — generate N coupons from a template
  async bulkGenerate(req, res) {
    try {
      const { count, prefix, template } = req.body;
      const n = Number(count);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        return res.status(400).json({ success: false, message: 'count must be a positive integer up to 500' });
      }
      if (!template || typeof template !== 'object') {
        return res.status(400).json({ success: false, message: 'template is required' });
      }
      const cleanPrefix = String(prefix || 'BULK').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 20);

      const errors = validateCouponPayload({ ...template, code: `${cleanPrefix}TEST01` }, { isCreate: true });
      const filtered = errors.filter(e => !/^code /.test(e));
      if (filtered.length) {
        return res.status(400).json({ success: false, message: filtered[0], errors: filtered });
      }

      const category = await CouponCategory.unscoped().findByPk(template.categoryId);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Invalid categoryId in template' });
      }

      const created = [];
      const existingCodes = new Set(
        (await Coupon.unscoped().findAll({
          where: { code: { [Op.like]: `${cleanPrefix}%` } },
          attributes: ['code']
        })).map(c => c.code)
      );

      let attempts = 0;
      while (created.length < n && attempts < n * 5) {
        attempts++;
        const suffix = randomSuffix(6);
        const code = `${cleanPrefix}${suffix}`;
        if (existingCodes.has(code)) continue;
        existingCodes.add(code);

        try {
          const coupon = await Coupon.create({
            code,
            title: String(template.title || 'Bulk Coupon').trim(),
            description: String(template.description || '').trim(),
            discountText: String(template.discountText || '').trim(),
            discountType: template.discountType,
            discountValue: template.discountValue,
            minAmount: template.minAmount ?? null,
            maxDiscount: template.maxDiscount ?? null,
            validFrom: template.validFrom,
            validUntil: template.validUntil,
            usageLimit: template.usageLimit ?? null,
            maxUsesPerUser: template.maxUsesPerUser ?? null,
            categoryId: template.categoryId,
            terms: Array.isArray(template.terms) ? template.terms : [],
            isActive: true,
            isDeleted: false
          });

          if (Array.isArray(template.hospitalIds) && template.hospitalIds.length > 0) {
            const hospitals = await HospitalProfile.findAll({ where: { id: template.hospitalIds } });
            await coupon.setHospitals(hospitals);
          }

          created.push(coupon.code);
        } catch (e) {
          if (e?.name !== 'SequelizeUniqueConstraintError') throw e;
        }
      }

      res.status(201).json({
        success: true,
        message: `${created.length} coupons generated successfully`,
        data: { generated: created, prefix: cleanPrefix }
      });
    } catch (error) {
      console.error('Bulk generation error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate coupons', error: error.message });
    }
  }
};

function randomSuffix(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function validateCouponPayload(body, { isCreate }) {
  const errors = [];
  const required = (field, val) => {
    if (val === undefined || val === null || String(val).trim() === '') {
      errors.push(`${field} is required`);
    }
  };

  if (isCreate) {
    required('code', body.code);
    required('title', body.title);
    required('description', body.description);
    required('discountText', body.discountText);
    required('discountType', body.discountType);
    required('discountValue', body.discountValue);
    required('validFrom', body.validFrom);
    required('validUntil', body.validUntil);
    required('categoryId', body.categoryId);
  }

  if (body.code !== undefined) {
    const c = String(body.code).trim();
    if (c.length < 3 || c.length > 50) errors.push('code must be 3-50 characters');
    if (!/^[A-Za-z0-9_-]+$/.test(c)) errors.push('code must be alphanumeric (dashes/underscores allowed)');
  }
  if (body.discountType !== undefined && !['percentage', 'fixed'].includes(body.discountType)) {
    errors.push("discountType must be 'percentage' or 'fixed'");
  }
  if (body.discountValue !== undefined) {
    const dv = Number(body.discountValue);
    if (isNaN(dv) || dv <= 0) errors.push('discountValue must be greater than 0');
    if (body.discountType === 'percentage' && dv > 100) errors.push('percentage discountValue cannot exceed 100');
  }
  if (body.validFrom !== undefined && body.validUntil !== undefined) {
    if (new Date(body.validFrom) >= new Date(body.validUntil)) {
      errors.push('validFrom must be before validUntil');
    }
  }
  if (body.usageLimit !== undefined && body.usageLimit !== null) {
    const ul = Number(body.usageLimit);
    if (!Number.isInteger(ul) || ul < 1) errors.push('usageLimit must be a positive integer');
  }
  if (body.maxUsesPerUser !== undefined && body.maxUsesPerUser !== null) {
    const m = Number(body.maxUsesPerUser);
    if (!Number.isInteger(m) || m < 1) errors.push('maxUsesPerUser must be a positive integer');
  }
  return errors;
}
