# Bulk Coupon Generation

**Status:** ✅ Complete

Admin can generate up to 500 unique coupons in a single request using a shared template and a common prefix.

Related: [admin-management.md](./admin-management.md).

---

## Feature Summary

- One-shot creation of many coupons, all sharing the same discount / validity / category / hospital mapping
- Codes formed as `<PREFIX><6 random chars>` — e.g. `SUMMER37KHTZ`
- Random suffix excludes ambiguous characters (no `I`, `O`, `0`, `1`) to reduce user typos
- Cap of 500 per request keeps the operation synchronous and reasonably fast
- Uniqueness guaranteed by pre-fetching existing codes with the same prefix + retry on collision

---

## Backend

### Endpoint
`POST /api/admin/coupons/bulk` — admin auth required.

Request body:
```json
{
  "count": 50,
  "prefix": "SUMMER",
  "template": {
    "title": "Summer Sale",
    "description": "Seasonal discount",
    "discountText": "15% OFF",
    "discountType": "percentage",
    "discountValue": 15,
    "minAmount": null,
    "maxDiscount": null,
    "validFrom": "2026-09-01",
    "validUntil": "2026-09-30",
    "usageLimit": null,
    "maxUsesPerUser": 1,
    "categoryId": 1,
    "terms": [],
    "hospitalIds": []
  }
}
```

Response:
```json
{
  "success": true,
  "message": "50 coupons generated successfully",
  "data": {
    "generated": ["SUMMER37KHTZ", "SUMMER8MPQR2", "..."],
    "prefix": "SUMMER"
  }
}
```

### Controller
[backend/controllers/admin/coupon.controller.js](../../backend/controllers/admin/coupon.controller.js) — `bulkGenerate`:

1. Validates `count` (1–500) and `template` is an object
2. Sanitises prefix: uppercase, strips non-alphanumeric/`-`/`_`, caps at 20 chars, defaults to `BULK`
3. Reuses `validateCouponPayload` on the template, filtering out `code` errors (codes are generated, not user-supplied)
4. Verifies `categoryId` exists
5. Pre-fetches all existing codes with the same prefix into a Set to avoid collisions
6. Loop: generate a candidate suffix; skip if already used; insert; catch unique-constraint errors and retry
7. Stops when `count` reached or after `count * 5` attempts (safety valve)

```js
function randomSuffix(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // no I, O, 0, 1
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
```

---

## Frontend

### Bulk Generate modal
[src/app/admin/pages/coupons/coupons.component.*](../../src/app/admin/pages/coupons/):

- **Bulk Generate** button added to the coupons list header (next to **Add Coupon**)
- Opens a Bootstrap modal with the template form
- Fields: count, prefix, category, title, description, display text, discount type/value, valid from/until, usage limit, max uses per user
- On success, list refreshes and the modal closes

### Service
[src/app/services/admin.service.ts](../../src/app/services/admin.service.ts):
```ts
bulkGenerateCoupons(payload): Observable<any>
```

---

## Design Decisions

- **Cap of 500 per request** — protects against accidental huge inserts and keeps the operation synchronous. Larger batches should be split.
- **Ambiguous-character exclusion** — reduces support tickets from customers reading "0" as "O" or "1" as "I".
- **Prefix sanitisation** — anything the admin types is uppercased and stripped of odd characters. The prefix caps at 20 chars so the total code stays well under 50.
- **Reuse of `validateCouponPayload`** — filtered to omit `code` errors — means bulk uses the exact same rules as single-create.
- **No hospital picker in the bulk modal** — kept the template simple (`hospitalIds: []` = all hospitals). Individual coupons can be edited after generation if hospital restrictions are needed.
- **No terms editor in the bulk modal** — same reasoning.

---

## How to Test

1. Admin → `/admin/coupons` → click **Bulk Generate**
2. Fill in the template: `count=5, prefix=TEST, categoryId, title, description, discountText, discountType=percentage, discountValue=10, validFrom, validUntil`
3. Submit → alert shows the generated count; list refreshes with 5 new `TEST______` codes
4. Verify uniqueness:
   ```sql
   SELECT code, COUNT(*) FROM coupons WHERE code LIKE 'TEST%' GROUP BY code HAVING COUNT(*) > 1;
   -- should return 0 rows
   ```
5. Try `count = 501` → rejected with 400 _"count must be a positive integer up to 500"_
