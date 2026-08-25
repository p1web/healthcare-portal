# Admin Coupon Analytics

**Status:** ✅ Complete

Read-only dashboard summarising coupon inventory, redemptions, revenue impact, top performers, category breakdown, and coupons expiring soon.

Related: [admin-management.md](./admin-management.md).

---

## Feature Summary

- **Summary cards** — total coupons, active, deleted, expired, total redemptions, total discount given
- **Top coupons by usage** — top 5 with title, category, and usage vs limit
- **Category breakdown** — coupon count + total redemptions per category, rendered with progress bars
- **Expiring soon** — coupons active and expiring in the next 7 days

---

## Backend

### Endpoint
`GET /api/admin/coupons-analytics` — admin auth required.

Response:
```json
{
  "success": true,
  "data": {
    "totals": {
      "totalCoupons": 42,
      "activeCoupons": 30,
      "deletedCoupons": 5,
      "expiredCoupons": 7,
      "totalRedemptions": 128,
      "totalDiscountGiven": 42500.00
    },
    "topCoupons": [
      { "id": 1, "code": "HEALTH20", "title": "…", "usedCount": 50, "usageLimit": 1000, "category": { "id": 1, "name": "Consultation" } }
    ],
    "categoryBreakdown": [
      { "categoryId": 1, "categoryName": "Consultation", "couponCount": 12, "totalUses": 80 }
    ],
    "expiringSoon": [
      { "id": 5, "code": "CARDIO25", "title": "…", "validUntil": "2026-08-31T…" }
    ]
  }
}
```

### Controller
[backend/controllers/admin/coupon.controller.js](../../backend/controllers/admin/coupon.controller.js) — `getAnalytics`:

- Uses `Coupon.unscoped()` for count queries so soft-deleted rows are included in the correct buckets
- Aggregates with `Sequelize.fn` / `col`:
  - `COUNT(coupon_usage.id)` for total redemptions
  - `COALESCE(SUM(discount_amount), 0)` for total discount given
- Top coupons ordered by `used_count DESC LIMIT 5`
- Category breakdown grouped by `category_id`
- Expiring-soon uses `validUntil BETWEEN NOW() AND NOW() + INTERVAL '7 days'`

---

## Frontend

### Page
[src/app/admin/pages/coupon-analytics/](../../src/app/admin/pages/coupon-analytics/) — new dedicated page.

### Layout
- **Row 1** — four summary cards (Total Coupons, Total Redemptions, Discount Given, Expired) with icon in soft-color background
- **Row 2** — Top Coupons table (7 cols wide) + Category breakdown (5 cols wide) with progress bars
- **Row 3** — Expiring Soon list, full width

### Navigation
- Route: `/admin/coupon-analytics`
- Sidebar: added under the **Coupon Management** collapsible group (below Coupons and Coupon Categories)

### Service
[src/app/services/admin.service.ts](../../src/app/services/admin.service.ts):
```ts
getCouponAnalytics(): Observable<any>
```

---

## Design Decisions

- **Read-only** — no filters yet. Reports lifetime totals only.
- **Uses `.unscoped()`** on `Coupon` so deleted rows show up in "totals" but not in the "top coupons" table (which specifically excludes deleted).
- **Progress bars** on category breakdown normalise against `totalRedemptions` — an empty categorization state falls back gracefully to a 0% bar.
- **Category name fallback** — categories no longer linked to any coupon show as _"Uncategorized"_.

---

## Deferred

- Time-range filter (`?from=YYYY-MM-DD&to=YYYY-MM-DD`)
- Trend charts (day/week/month redemption)
- Export to CSV / PDF

---

## How to Test

1. Log in as admin
2. Sidebar → **Coupon Management** → **Analytics** (or navigate to `/admin/coupon-analytics`)
3. Verify all four summary cards populate; top coupons list appears; category progress bars render
4. Create a coupon expiring within 7 days → it appears in "Expiring soon"
