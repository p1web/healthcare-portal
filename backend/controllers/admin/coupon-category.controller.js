const { CouponCategory, Coupon } = require('../../models');
const { Op } = require('sequelize');

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

module.exports = {
  // GET /api/admin/coupon-categories?status=all|active|inactive&includeDeleted=true
  async getCategories(req, res) {
    try {
      const { status, includeDeleted } = req.query;
      const where = {};
      if (includeDeleted !== 'true') where.isDeleted = false;
      if (status === 'active') where.isActive = true;
      else if (status === 'inactive') where.isActive = false;

      const categories = await CouponCategory.unscoped().findAll({
        where,
        order: [['id', 'DESC']],
        attributes: ['id', 'name', 'slug', 'description', 'icon', 'isActive', 'isDeleted', 'created_at']
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching coupon categories:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch coupon categories', error: error.message });
    }
  },

  async getCategoryById(req, res) {
    try {
      const { id } = req.params;
      const category = await CouponCategory.unscoped().findByPk(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Coupon category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      console.error('Error fetching coupon category:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch coupon category', error: error.message });
    }
  },

  async createCategory(req, res) {
    try {
      const { name, description, icon, isActive } = req.body;

      if (!name || String(name).trim() === '') {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }

      const trimmedName = String(name).trim();
      const slug = slugify(trimmedName);

      const existing = await CouponCategory.unscoped().findOne({
        where: { [Op.or]: [{ name: trimmedName }, { slug }] }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Coupon category with this name/slug already exists' });
      }

      const category = await CouponCategory.create({
        name: trimmedName,
        slug,
        description: description || null,
        icon: icon || null,
        isActive: isActive !== undefined ? !!isActive : true,
        isDeleted: false
      });

      res.status(201).json({ success: true, message: 'Coupon category created successfully', data: category });
    } catch (error) {
      console.error('Error creating coupon category:', error);
      res.status(500).json({ success: false, message: 'Failed to create coupon category', error: error.message });
    }
  },

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, icon, isActive } = req.body;

      const category = await CouponCategory.unscoped().findByPk(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Coupon category not found' });
      }

      if (name !== undefined) {
        const trimmedName = String(name).trim();
        if (trimmedName === '') {
          return res.status(400).json({ success: false, message: 'Category name cannot be empty' });
        }
        const slug = slugify(trimmedName);
        const conflict = await CouponCategory.unscoped().findOne({
          where: {
            id: { [Op.ne]: id },
            [Op.or]: [{ name: trimmedName }, { slug }]
          }
        });
        if (conflict) {
          return res.status(400).json({ success: false, message: 'Another category with this name/slug already exists' });
        }
        category.name = trimmedName;
        category.slug = slug;
      }

      if (description !== undefined) category.description = description || null;
      if (icon !== undefined) category.icon = icon || null;
      if (isActive !== undefined) category.isActive = !!isActive;

      await category.save();
      res.json({ success: true, message: 'Coupon category updated successfully', data: category });
    } catch (error) {
      console.error('Error updating coupon category:', error);
      res.status(500).json({ success: false, message: 'Failed to update coupon category', error: error.message });
    }
  },

  // DELETE (soft) — sets is_deleted=true; does NOT touch is_active
  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await CouponCategory.unscoped().findByPk(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Coupon category not found' });
      }
      category.isDeleted = true;
      await category.save();

      // Cascade soft-delete linked coupons
      await Coupon.unscoped().update(
        { isDeleted: true },
        { where: { categoryId: id } }
      );

      res.json({ success: true, message: 'Coupon category deleted successfully' });
    } catch (error) {
      console.error('Error deleting coupon category:', error);
      res.status(500).json({ success: false, message: 'Failed to delete coupon category', error: error.message });
    }
  },

  // RESTORE — sets is_deleted=false
  async restoreCategory(req, res) {
    try {
      const { id } = req.params;
      const category = await CouponCategory.unscoped().findByPk(id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Coupon category not found' });
      }
      category.isDeleted = false;
      await category.save();
      res.json({ success: true, message: 'Coupon category restored successfully', data: category });
    } catch (error) {
      console.error('Error restoring coupon category:', error);
      res.status(500).json({ success: false, message: 'Failed to restore coupon category', error: error.message });
    }
  }
};
