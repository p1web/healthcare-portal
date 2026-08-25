# Coupon Application at Appointment Booking

**Status:** ✅ Complete

Patients apply a coupon code (or pick from suggested offers) at the moment of booking. The backend validates it, calculates the discount against the doctor's consultation fee, records the usage, and stores a full pricing snapshot on the appointment.

Related: [per-user-limits.md](./per-user-limits.md), [../appointments/booking-lifecycle.md](../appointments/booking-lifecycle.md).

---

## Feature Summary

- Optional `couponCode` on `POST /api/appointments`
- Server validates: existence, active flag, not-deleted, not expired, usage-limit ceiling, min amount, hospital match, per-user limit (see [per-user-limits.md](./per-user-limits.md))
- Pricing computed server-side using `DoctorProfile.consultationFee` — client cannot tamper with the price
- Appointment row stores the applied coupon (`coupon_id`, `coupon_code`) and pricing (`original_price`, `discount_amount`, `final_price`)
- One `coupon_usage` row created per applied booking; `coupons.used_count` incremented atomically
- Patient's Doctor Detail page shows a list of applicable offers filtered by hospital + min amount

---

## Database Schema

### `appointments` — new columns ([20260826010000](../../backend/migrations/20260826010000-add-pricing-and-coupon-to-appointments.js))
| Column | Type | Notes |
|--------|------|-------|
| original_price | DECIMAL(10,2) | doctor's fee at booking time |
| discount_amount | DECIMAL(10,2) | not null, default 0 |
| final_price | DECIMAL(10,2) | `original_price - discount_amount`, clamped ≥ 0 |
| coupon_id | INTEGER FK | → coupons(id), ON DELETE SET NULL, indexed |
| coupon_code | STRING(50) | snapshot of code applied |

### `coupon_usage` — new column
| Column | Type | Notes |
|--------|------|-------|
| appointment_id | INTEGER FK | → appointments(id), ON DELETE SET NULL, indexed |

`order_id` retained on `coupon_usage` for backward compatibility with any external integrations; new writes populate both `order_id` and `appointment_id` with the same value.

---

## Backend

### Models
- [backend/models/appointment.js](../../backend/models/appointment.js) — new pricing fields + `belongsTo Coupon.unscoped() as: 'coupon'`
- [backend/models/coupon-usage.js](../../backend/models/coupon-usage.js) — new `appointmentId`
- [backend/models/index.js](../../backend/models/index.js) — `Appointment.associate({ …, Coupon })`

### Controller
[backend/controllers/appointment.controller.js](../../backend/controllers/appointment.controller.js) — `createAppointment` accepts `couponCode`, delegates to helper:

```js
async function resolveCouponForBooking({ couponCode, amount, hospitalId, userId }) {
  // Looks up coupon (active, not deleted)
  // Runs isValid() → expiry + usage-limit
  // Checks min_amount
  // Checks hospital restriction against coupon.hospitals
  // Checks max_uses_per_user (see per-user-limits.md)
  // Calculates discount via coupon.calculateDiscount(amount)
}
```

- Copies `doctorProfile.consultationFee` → `originalPrice`
- Clamps `finalPrice` to ≥ 0 (a coupon can never make an appointment cost negative)
- Records `CouponUsage` row and increments `usedCount` atomically on success
- `formatAppointment()` returns pricing fields in the response

### Public API (validation preview)
[backend/routes/coupon.routes.js](../../backend/routes/coupon.routes.js) exposes `POST /api/coupons/validate/:code` (unauthenticated) so the client can preview a discount without booking. Body: `{ amount, hospitalId }`. Response: `{ discountAmount, finalAmount, discountType, discountValue }` or a friendly error.

---

## Frontend

### Service
[src/app/services/coupon.service.ts](../../src/app/services/coupon.service.ts):
- `getCoupons()` — public listing
- `validateCouponRemote(code, amount, hospitalId)` — calls the public validate endpoint for the discount preview

### Doctor Detail page
[src/app/components/doctor-detail/doctor-detail.component.*](../../src/app/components/doctor-detail/):

**Available Offers panel** (replaces the old hardcoded HEALTH20 card):
- Fetches `/api/coupons` on load
- Filters client-side: `isActive === true`, `minAmount ≤ doctor.fee`, and either no hospital restriction OR `doctor.hospital_id ∈ coupon.hospitalIds`
- Each offer card shows discount badge, code chip, title, description, min amount
- Clicking a card auto-fills the input and validates it

**Booking form additions**:
- Coupon input + **Apply** button — calls `validateCouponRemote`; shows success/error inline
- **Pricing summary**: Consultation Fee → Discount → Total Payable, live-updated
- On submit, `couponCode` is added to the booking payload
- On success, the returned pricing breakdown (`couponCode`, `originalPrice`, `discountAmount`, `finalPrice`) surfaces in the confirmation banner

### UX safeguards
- Doctor's `fee` string is parsed with `.replace(/[^\d.]/g, '')` to handle values like `"₹500"`
- Selecting a new coupon while one is applied triggers re-validation
- **Remove** button clears the applied coupon and returns to the base fee
- Backend errors (`Invalid or inactive coupon code`, `Minimum order amount…`, `Coupon is not valid for this doctor's hospital`) are shown verbatim

---

## API Reference

### `POST /api/appointments`
Auth: patient.

Request:
```json
{
  "doctorId": 6,
  "date": "2026-09-01",
  "time": "10:30",
  "reason": "General consultation",
  "couponCode": "HEALTH20"
}
```

Success response (`201`):
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "data": {
    "id": 42,
    "doctorName": "Dr. Priya Sharma",
    "date": "2026-09-01",
    "time": "10:30",
    "status": "pending",
    "couponCode": "HEALTH20",
    "couponId": 1,
    "originalPrice": 500.00,
    "discountAmount": 100.00,
    "finalPrice": 400.00
  }
}
```

Rejection responses (`400`):
- `Invalid or inactive coupon code`
- `Coupon is expired or usage limit reached`
- `Minimum order amount of ₹<N> required`
- `Coupon is not valid for this doctor's hospital`
- `You have already used this coupon the maximum allowed times (<N>)` (per-user limit)

---

## Design Decisions

- **Snapshot pricing on appointment** — even if the doctor changes their fee later, the booked appointment retains the original price and discount from booking time. Financial audit trail.
- **Server-sourced `original_price`** — never trusted from the client (prevents price tampering).
- **`final_price` clamped ≥ 0** — a discount can never yield a negative bill.
- **Coupon applied at booking, not later** — no separate "apply coupon" endpoint. Atomic operation with appointment creation.
- **Silent handling of `consultationFee = null`** — treated as 0; free appointments carry `finalPrice = 0`.
- **Deleted / inactive coupons rejected at booking** — the lookup requires both `isDeleted=false` and `isActive=true`.
- **Public formatter returns hospital IDs** — [backend/controllers/coupon.controller.js](../../backend/controllers/coupon.controller.js) exposes `hospitals: [{id, name}]` + `hospitalIds: [id]` so the client can filter without an extra request.

---

## How to Test

### Book without coupon (baseline)
```bash
POST /api/appointments
Authorization: Bearer <patient JWT>
{ "doctorId": 6, "date": "2026-09-01", "time": "10:30", "reason": "check-up" }
```
Expect: `finalPrice = originalPrice`, `discountAmount = 0`, `couponId = null`.

### Book with a valid coupon
```bash
{ "doctorId": 6, "date": "2026-09-01", "time": "10:30", "couponCode": "HEALTH20" }
```
Expect: pricing populated; one row in `coupon_usage`; `coupons.used_count` incremented.

```sql
SELECT id, coupon_code, coupon_id, original_price, discount_amount, final_price FROM appointments WHERE id = <new_id>;
SELECT * FROM coupon_usage WHERE appointment_id = <new_id>;
SELECT code, used_count FROM coupons WHERE code = 'HEALTH20';
```

### End-to-end via the UI
1. Log in as a patient
2. Open a doctor page (`/doctors/<id>`)
3. See **Available Offers** on the right — click an offer → code auto-fills + validation
4. Or type a code and click **Apply**
5. Confirm booking → success banner shows the coupon and pricing
6. Navigate to `/appointments` → pricing column reflects the applied coupon
