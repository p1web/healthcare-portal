# Coupon Admin Management

**Status:** ✅ Complete

Admin CRUD for coupon codes and coupon categories, including hospital mapping, status control, and soft-delete with cascade.

---

## Feature Summary

Admins can:
- Create, view, edit coupon categories (grouping mechanism)
- Create, view, edit coupons with full metadata (code, discount, validity, limits, terms, hospitals)
- Toggle `is_active` on either entity (enable / disable)
- Soft-delete either entity with cascade (deleting a category also soft-deletes its coupons)
- Restore soft-deleted rows
- Filter by status (All / Active / Inactive), show / hide deleted rows

---

## Database Schema

### `coupon_categories` — [20251215170620](../../backend/migrations/20251215170620-create-coupon-categories.js)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| name | STRING(100) | unique, not null |
| slug | STRING(100) | unique, auto-generated from name |
| description | TEXT | nullable |
| icon | STRING(50) | Bootstrap Icon class |
| is_active | BOOLEAN | admin toggle |
| **is_deleted** | BOOLEAN | soft-delete marker ([20260826000000](../../backend/migrations/20260826000000-add-is-deleted-to-coupons.js)) |
| created_at, updated_at | DATE | auto |

### `coupons` — [20251215170739](../../backend/migrations/20251215170739-create-coupons.js)
| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER PK | auto-increment |
| code | STRING(50) | unique, uppercase |
| title | STRING(255) | not null |
| description | TEXT | not null |
| discount_text | STRING(50) | display text e.g. `20% OFF` |
| discount_type | ENUM('percentage','fixed') | default `percentage` |
| discount_value | DECIMAL(10,2) | > 0; ≤ 100 if percentage |
| min_amount | DECIMAL(10,2) | nullable |
| max_discount | DECIMAL(10,2) | cap for percentage type |
| valid_from | DATE | must be < valid_until |
| valid_until | DATE | not null |
| usage_limit | INTEGER | total redemptions across all users |
| used_count | INTEGER | default 0, monotonic |
| category_id | INTEGER FK | → coupon_categories, RESTRICT |
| terms | JSON | array of T&C strings |
| is_active | BOOLEAN | admin toggle |
| **is_deleted** | BOOLEAN | soft-delete marker ([20260826000000](../../backend/migrations/20260826000000-add-is-deleted-to-coupons.js)) |
| created_at, updated_at | DATE | auto |

### `coupon_hospitals` — [20251215171040](../../backend/migrations/20251215171040-create-coupon-hospitals.js)
Many-to-many join table between `coupons` and `hospital_profiles`. Composite PK `(coupon_id, hospital_id)`. Empty mapping = coupon applies to all hospitals.

---

## Backend

### Models
- [backend/models/coupon.js](../../backend/models/coupon.js) — `defaultScope` hides `is_deleted=true`; `belongsToMany` HospitalProfile via `coupon_hospitals`
- [backend/models/coupon-category.js](../../backend/models/coupon-category.js) — `defaultScope` hides deleted

### Controllers
- [backend/controllers/admin/coupon-category.controller.js](../../backend/controllers/admin/coupon-category.controller.js)
- [backend/controllers/admin/coupon.controller.js](../../backend/controllers/admin/coupon.controller.js)

### Routes
All protected by `authenticate + authorize('admin')`.

| Method | Path |
|--------|------|
| GET | `/api/admin/coupon-categories?status=all\|active\|inactive&includeDeleted=true` |
| GET | `/api/admin/coupon-categories/:id` |
| POST | `/api/admin/coupon-categories` |
| PUT | `/api/admin/coupon-categories/:id` |
| DELETE | `/api/admin/coupon-categories/:id` (soft) |
| PATCH | `/api/admin/coupon-categories/:id/restore` |
| GET | `/api/admin/coupons?status=…&includeDeleted=true&categoryId=&search=` |
| GET | `/api/admin/coupons/:id` |
| POST | `/api/admin/coupons` |
| PUT | `/api/admin/coupons/:id` |
| DELETE | `/api/admin/coupons/:id` (soft) |
| PATCH | `/api/admin/coupons/:id/restore` |

### Validation
- `code` — required, 3–50 chars, `[A-Za-z0-9_-]`, stored uppercase, unique
- `title`, `description`, `discountText` — required, trimmed
- `discountType` — required, in `['percentage', 'fixed']`
- `discountValue` — required, > 0; if percentage then ≤ 100
- `validFrom` < `validUntil`
- `usageLimit` — optional, positive integer
- `categoryId` — required, must reference an existing category
- `terms` — optional array
- `hospitalIds` — optional array of hospital ids

---

## Frontend

### Service
[src/app/services/admin.service.ts](../../src/app/services/admin.service.ts):
- `getCouponCategories(filters)` / `getCouponCategoryById` / `addCouponCategory` / `updateCouponCategory` / `deleteCouponCategory` / `restoreCouponCategory`
- `getCoupons(filters)` / `getCouponById` / `addCoupon` / `updateCoupon` / `deleteCoupon` / `restoreCoupon`

### Reusable directive
[src/app/shared/directives/select2.directive.ts](../../src/app/shared/directives/select2.directive.ts) — jQuery Select2 wrapped as an Angular `ControlValueAccessor`. Enables searchable multi-select over thousands of options for the "Applicable Hospitals" picker.

```html
<select appSelect2 [options]="items" [multiple]="true" formControlName="ids"></select>
```

### Pages
- [src/app/admin/pages/coupon-categories/](../../src/app/admin/pages/coupon-categories/) — list + create/edit modals
- [src/app/admin/pages/coupons/coupons.component.*](../../src/app/admin/pages/coupons/) — list with search, category filter, status filter, "Show deleted" toggle
- [src/app/admin/pages/coupons/coupon-form/](../../src/app/admin/pages/coupons/coupon-form/) — dedicated add / edit page with sectioned form (Basic Info, Discount & Limits, Hospitals, Terms & Conditions, Status)

### Navigation
- Route: `/admin/coupon-categories`, `/admin/coupons`, `/admin/coupons/new`, `/admin/coupons/:id/edit`
- Sidebar: collapsible **Coupon Management** group (auto-expands when a child route is active) — see [sidebar.component.html](../../src/app/admin/shared/sidebar/sidebar.component.html)

---

## Design Decisions

- **Two independent flags** for status and lifecycle:
  - `is_active` = admin toggle (enable / disable). Inactive coupons still exist but are rejected at booking.
  - `is_deleted` = soft-delete marker. Deleted rows hidden from all default listings.
  - Delete action **only** touches `is_deleted`; never modifies `is_active`.
- **Cascade soft-delete** — deleting a category soft-deletes all coupons under it.
- **Code stored uppercase**, searched case-insensitively. Format: `[A-Za-z0-9_-]{3,50}`.
- **Slug auto-generated** from category name (`"Health Checkup"` → `"health-checkup"`); regenerates only when the name changes.
- **Empty `hospitalIds`** = coupon applies to **all** hospitals. Any populated set restricts to that subset only.
- **Pages > modals** for coupon add/edit — coupons have too many fields for a modal. Category modals kept because a category is just name/description/icon.
- **Reused existing Select2** dependency (already in `package.json`) instead of adding a new package.

---

## How to Test

1. Log in as admin: `systemadmin@gmail.com` / `password123`
2. Sidebar → **Coupon Management** → **Coupon Categories**
   - Add a category (name, description, icon)
   - Toggle status filter, use "Show deleted" checkbox
   - Delete → row becomes red **Deleted** pill; restore brings it back
3. Sidebar → **Coupon Management** → **Coupons**
   - Click **Add Coupon** — navigates to `/admin/coupons/new`
   - Fill sectioned form (Basic Info, Discount & Limits, Hospitals, Terms, Status)
   - Hospital picker is a searchable Select2 multi-select
   - Save → returns to list; new coupon appears
4. Edit a coupon — sections pre-populate; hospitals restore from `hospitalIds`
5. Delete → red **Deleted** pill; **Show deleted** → row reappears dimmed; Restore → back to active/inactive per its `is_active`
