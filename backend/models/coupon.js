'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    static associate(models) {
      // Belongs to Category
      Coupon.belongsTo(models.CouponCategory, {
        foreignKey: 'category_id',
        as: 'category'
      });

      // Many-to-Many with Hospital
      Coupon.belongsToMany(models.Hospital, {
        through: 'coupon_hospitals',
        foreignKey: 'coupon_id',
        otherKey: 'hospital_id',
        as: 'hospitals'
      });

      // Has Many Usage records
      Coupon.hasMany(models.CouponUsage, {
        foreignKey: 'coupon_id',
        as: 'usage'
      });
    }

    // Instance method to check if coupon is valid
    isValid() {
      const now = new Date();
      return (
        this.isActive &&
        now >= this.validFrom &&
        now <= this.validUntil &&
        (!this.usageLimit || this.usedCount < this.usageLimit)
      );
    }

    // Instance method to check if user can use this coupon
    canBeUsed(amount) {
      if (!this.isValid()) return false;
      if (this.minAmount && amount < this.minAmount) return false;
      return true;
    }

    // Calculate discount amount
    calculateDiscount(amount) {
      if (!this.canBeUsed(amount)) return 0;

      let discount = 0;
      if (this.discountType === 'percentage') {
        discount = (amount * this.discountValue) / 100;
        if (this.maxDiscount) {
          discount = Math.min(discount, this.maxDiscount);
        }
      } else if (this.discountType === 'fixed') {
        discount = this.discountValue;
      }

      return Math.min(discount, amount); // Don't discount more than the amount
    }
  }

  Coupon.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isUppercase: true,
        len: [3, 50]
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    discountText: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: 'discount_text'
    },
    discountType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      allowNull: false,
      defaultValue: 'percentage',
      field: 'discount_type'
    },
    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: 'discount_value'
    },
    minAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'min_amount'
    },
    maxDiscount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'max_discount'
    },
    validFrom: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'valid_from'
    },
    validUntil: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'valid_until'
    },
    usageLimit: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'usage_limit'
    },
    usedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'used_count'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id'
    },
    terms: {
      type: DataTypes.JSON,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('terms');
        return rawValue ? (Array.isArray(rawValue) ? rawValue : JSON.parse(rawValue)) : [];
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    sequelize,
    modelName: 'Coupon',
    tableName: 'coupons',
    underscored: true,
    timestamps: true,
    defaultScope: {
      where: {
        isActive: true
      }
    },
    scopes: {
      active: {
        where: {
          isActive: true
        }
      },
      expired: {
        where: {
          validUntil: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      },
      upcoming: {
        where: {
          validFrom: {
            [sequelize.Sequelize.Op.gt]: new Date()
          }
        }
      },
      current: {
        where: {
          validFrom: {
            [sequelize.Sequelize.Op.lte]: new Date()
          },
          validUntil: {
            [sequelize.Sequelize.Op.gte]: new Date()
          }
        }
      }
    }
  });

  return Coupon;
};