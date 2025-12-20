const { Coupon, CouponCategory, Hospital, CouponUsage } = require('../models');
const { Op } = require('sequelize');

// Format coupon for frontend
function formatCouponForFrontend(coupon) {
  const couponJSON = coupon.toJSON();
  
  return {
    id: couponJSON.id,
    code: couponJSON.code,
    title: couponJSON.title,
    description: couponJSON.description,
    discount: couponJSON.discountText,
    discountType: couponJSON.discountType,
    discountValue: parseFloat(couponJSON.discountValue),
    minAmount: couponJSON.minAmount ? parseFloat(couponJSON.minAmount) : null,
    maxDiscount: couponJSON.maxDiscount ? parseFloat(couponJSON.maxDiscount) : null,
    validFrom: couponJSON.validFrom,
    validUntil: couponJSON.validUntil,
    usageLimit: couponJSON.usageLimit,
    usedCount: couponJSON.usedCount,
    applicableFor: couponJSON.category?.slug || '',
    categoryName: couponJSON.category?.name || '',
    hospitals: couponJSON.hospitals ? couponJSON.hospitals.map(h => h.name) : [],
    isActive: couponJSON.isActive,
    terms: couponJSON.terms || []
  };
}

// GET all coupons
exports.getAll = async (req, res) => {


  try {
    
    const { category, isActive, current } = req.query;
    // console.log(category);

    let whereClause = {};
    
    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Filter by current date (valid coupons)
    if (current === 'true') {
      const now = new Date();
      whereClause.validFrom = { [Op.lte]: now };
      whereClause.validUntil = { [Op.gte]: now };
    }

    // Build include clause
    const include = [
      {
        model: CouponCategory,
        as: 'category',
        attributes: ['id', 'name', 'slug', 'icon']
      },
      {
        model: Hospital,
        as: 'hospitals',
        attributes: ['id', 'name'],
        through: { attributes: [] }
      }
    ];

    // Filter by category
    if (category) {
      include[0].where = { slug: category };
      include[0].required = true;
    }

    const coupons = await Coupon.findAll({
      where: whereClause,
      include: include,
      order: [['created_at', 'DESC']]
    });

    const formattedCoupons = coupons.map(formatCouponForFrontend);

    res.status(200).json({
      success: true,
      count: formattedCoupons.length,
      data: formattedCoupons
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupons',
      error: error.message
    });
  }
};

// GET single coupon by ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id, {
      include: [
        {
          model: CouponCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'description', 'icon']
        },
        {
          model: Hospital,
          as: 'hospitals',
          attributes: ['id', 'name', 'location'],
          through: { attributes: [] }
        }
      ]
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatCouponForFrontend(coupon)
    });

  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupon',
      error: error.message
    });
  }
};

// GET coupon by code
exports.getByCode = async (req, res) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
      include: [
        {
          model: CouponCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'icon']
        },
        {
          model: Hospital,
          as: 'hospitals',
          attributes: ['id', 'name'],
          through: { attributes: [] }
        }
      ]
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    res.status(200).json({
      success: true,
      data: formatCouponForFrontend(coupon)
    });

  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching coupon',
      error: error.message
    });
  }
};

// VALIDATE coupon
exports.validate = async (req, res) => {
  try {
    const { code } = req.params;
    const { amount, hospitalId } = req.body;

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
      include: [
        {
          model: Hospital,
          as: 'hospitals',
          attributes: ['id'],
          through: { attributes: [] }
        },
        {
          model: CouponCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        }
      ]
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Check if coupon is valid
    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is expired or usage limit reached'
      });
    }

    // Check minimum amount
    if (!coupon.canBeUsed(amount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum amount of ₹${coupon.minAmount} required`
      });
    }

    // Check hospital restriction
    if (hospitalId && coupon.hospitals && coupon.hospitals.length > 0) {
      const validHospital = coupon.hospitals.some(h => h.id === parseInt(hospitalId));
      if (!validHospital) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not valid for selected hospital'
        });
      }
    }

    // Calculate discount
    const discountAmount = coupon.calculateDiscount(amount);

    res.status(200).json({
      success: true,
      message: 'Coupon is valid',
      data: {
        code: coupon.code,
        discountAmount: discountAmount,
        finalAmount: amount - discountAmount,
        discountType: coupon.discountType,
        discountValue: parseFloat(coupon.discountValue)
      }
    });

  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error validating coupon',
      error: error.message
    });
  }
};

// APPLY coupon (record usage)
exports.apply = async (req, res) => {
  try {
    const { code } = req.params;
    const { amount, userId, orderId, hospitalId } = req.body;

    const coupon = await Coupon.findOne({
      where: { code: code.toUpperCase() },
      include: [
        {
          model: Hospital,
          as: 'hospitals',
          through: { attributes: [] }
        }
      ]
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Invalid coupon code'
      });
    }

    // Validate coupon
    if (!coupon.isValid() || !coupon.canBeUsed(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Coupon cannot be applied'
      });
    }

    // Check hospital restriction
    if (hospitalId && coupon.hospitals && coupon.hospitals.length > 0) {
      const validHospital = coupon.hospitals.some(h => h.id === parseInt(hospitalId));
      if (!validHospital) {
        return res.status(400).json({
          success: false,
          message: 'Coupon not valid for selected hospital'
        });
      }
    }

    const discountAmount = coupon.calculateDiscount(amount);

    // Record usage
    await CouponUsage.create({
      couponId: coupon.id,
      userId: userId || null,
      orderId: orderId || null,
      discountAmount: discountAmount,
      usedAt: new Date()
    });

    // Increment used count
    await coupon.increment('usedCount');

    res.status(200).json({
      success: true,
      message: 'Coupon applied successfully',
      data: {
        code: coupon.code,
        discountAmount: discountAmount,
        finalAmount: amount - discountAmount
      }
    });

  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error applying coupon',
      error: error.message
    });
  }
};

// GET all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await CouponCategory.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug', 'description', 'icon'],
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

// CREATE coupon
exports.create = async (req, res) => {
  try {
    const couponData = req.body;

    // Ensure code is uppercase
    couponData.code = couponData.code.toUpperCase();

    const coupon = await Coupon.create({
      code: couponData.code,
      title: couponData.title,
      description: couponData.description,
      discountText: couponData.discount,
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      minAmount: couponData.minAmount,
      maxDiscount: couponData.maxDiscount,
      validFrom: couponData.validFrom,
      validUntil: couponData.validUntil,
      usageLimit: couponData.usageLimit,
      categoryId: couponData.categoryId,
      terms: couponData.terms,
      isActive: couponData.isActive !== undefined ? couponData.isActive : true
    });

    // Add hospital associations if provided
    if (couponData.hospitalIds && couponData.hospitalIds.length > 0) {
      const hospitals = await Hospital.findAll({
        where: { id: couponData.hospitalIds }
      });
      await coupon.setHospitals(hospitals);
    }

    // Fetch with associations
    const createdCoupon = await Coupon.findByPk(coupon.id, {
      include: [
        { model: CouponCategory, as: 'category' },
        { model: Hospital, as: 'hospitals', through: { attributes: [] } }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Coupon created successfully',
      data: formatCouponForFrontend(createdCoupon)
    });

  } catch (error) {
    console.error('Error creating coupon:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Coupon code already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating coupon',
      error: error.message
    });
  }
};

// UPDATE coupon
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    // Update fields
    if (updateData.code) updateData.code = updateData.code.toUpperCase();
    
    await coupon.update(updateData);

    // Update hospital associations if provided
    if (updateData.hospitalIds) {
      const hospitals = await Hospital.findAll({
        where: { id: updateData.hospitalIds }
      });
      await coupon.setHospitals(hospitals);
    }

    // Fetch updated coupon
    const updatedCoupon = await Coupon.findByPk(id, {
      include: [
        { model: CouponCategory, as: 'category' },
        { model: Hospital, as: 'hospitals', through: { attributes: [] } }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Coupon updated successfully',
      data: formatCouponForFrontend(updatedCoupon)
    });

  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating coupon',
      error: error.message
    });
  }
};

// DELETE coupon
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    await coupon.destroy();

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting coupon',
      error: error.message
    });
  }
};