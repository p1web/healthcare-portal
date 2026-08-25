# Per-user Usage Limits

**Status:** ✅ Complete

Optional cap on how many times a single patient can redeem a given coupon (e.g. "one-time use per patient").

Related: [booking-application.md](./booking-application.md).

---

## Feature Summary

- New `coupons.max_uses_per_user` column (nullable integer)
- `null` = unlimited (default)
- Admin sets the value from the coupon form
- Enforced at booking time — counts existing `CouponUsage` rows for `(couponId, userId)` and rejects if reached
- Rejection returns a friendly error to the client

---

## Database Schema

`coupons.max_uses_per_user` — INTEGER, nullable ([20260826020000](../../backend/migrations/20260826020000-add-max-uses-per-user-to-coupons.js))

---

## Backend

### Model
[backend/models/coupon.js](../../backend/models/coupon.js) — new `maxUsesPerUser` field mapped to `max_uses_per_user`.

### Admin Controller
[backend/controllers/admin/coupon.controller.js](../../backend/controllers/admin/coupon.controller.js) accepts and returns `maxUsesPerUser` on create/update. Validation: optional; if present, must be a positive integer.

### Booking enforcement
[backend/controllers/appointment.controller.js](../../backend/controllers/appointment.controller.js) — `resolveCouponForBooking()`:

```js
if (coupon.maxUsesPerUser && userId) {
  const userUses = await CouponUsage.count({ where: { couponId: coupon.id, userId } });
  if (userUses >= coupon.maxUsesPerUser) {
    return { error: `You have already used this coupon the maximum allowed times (${coupon.maxUsesPerUser})` };
  }
}
```

The check runs before discount calculation. It's guarded by `userId` because the same helper is potentially reused for pre-login validation.

---

## Frontend

### Admin form
[src/app/admin/pages/coupons/coupon-form/coupon-form.component.*](../../src/app/admin/pages/coupons/coupon-form/) — new "Max Uses Per User" input in the **Discount & Limits** section with hint text:

> _e.g. 1 = one-time use per patient_

---

## Design Decisions

- **`null` by default** — meaning "unlimited". Admin opts in explicitly.
- **Counted post-booking, not pre-booking** — the count includes only successful redemptions (rows in `coupon_usage`). A cancelled/rejected booking's row is deleted (see [../appointments/booking-lifecycle.md](../appointments/booking-lifecycle.md)) so the user regains a use.
- **Public `POST /api/coupons/apply/:code`** (unauthenticated legacy) does not enforce per-user because there's no reliable user context. Consider auth-gating or removing later.

---

## How to Test

1. Admin: create a coupon with `Max Uses Per User = 1`
2. Patient A books an appointment with that coupon → success
3. Patient A tries to book again with the same coupon → rejected: _"You have already used this coupon the maximum allowed times (1)"_
4. Patient B books with the same coupon → success (limit is per-user, not global)
5. Cancel Patient A's appointment → `coupon_usage` row deleted → Patient A can book again with the same coupon
