# Appointment Booking Lifecycle

**Status:** ✅ Complete

Covers appointment creation (with pricing snapshot), patient-initiated cancellation, and the coupon refund flow. Doctor approval / rejection is documented separately in [doctor-workflow.md](./doctor-workflow.md).

Related: [../coupons/booking-application.md](../coupons/booking-application.md).

---

## Feature Summary

### Booking
Patients book via `POST /api/appointments`. Payload accepts `couponCode` optionally. Server:
- Validates doctor availability (date, time-slot match)
- Fetches `DoctorProfile.consultationFee` → `original_price`
- If a coupon is provided, validates it and computes discount / final price
- Inserts the appointment row with the full pricing snapshot
- Records `coupon_usage` and increments `used_count` if a coupon was applied

### Patient cancellation
Patients can cancel their own **pending** or **confirmed** appointments:
- `PATCH /api/appointments/:id/cancel`
- Sets status to `cancelled`
- Refunds any applied coupon (deletes `coupon_usage` row, decrements `used_count`)
- Preserves the pricing snapshot on the appointment for audit

Doctors and admins can also cancel — same endpoint, different authorization branch.

---

## Backend

### Route
[backend/routes/appointment.routes.js](../../backend/routes/appointment.routes.js):

```
PATCH /api/appointments/:id/cancel   → patient / doctor / admin
```

### Cancellation logic
[backend/controllers/appointment.controller.js](../../backend/controllers/appointment.controller.js) — `cancelAppointment`:

1. Loads the appointment
2. Authorization:
   - `patient` → must own the appointment
   - `doctor` → must be the assigned doctor's profile
   - `admin` → allowed
3. State check: rejects if already `cancelled` / `completed` (409)
4. If the appointment has a `couponId`:
   - Counts related `coupon_usage` rows
   - Deletes them
   - Decrements `coupons.used_count` by that count (never below 0)
5. Sets `status = 'cancelled'` and saves

---

## Frontend

### Patient My Appointments
See [patient-view.md](./patient-view.md). Highlights:
- **Cancel** button visible only for `pending` / `confirmed` rows
- `confirm()` dialog explains that any applied coupon will be refunded
- Refreshes the list on success

### Service
[src/app/services/appointment.service.ts](../../src/app/services/appointment.service.ts):
```ts
cancelAppointment(id: number): Observable<{ success, message, data }>
```

---

## Design Decisions

- **Refund via delete + decrement** — the `coupon_usage` row is removed entirely and `used_count` decremented. Simpler than a `refunded` flag and there's no reporting need to see refunded usage separately. The appointment's own snapshot serves as the audit trail.
- **Pricing snapshot preserved on cancel** — the appointment retains `original_price`, `discount_amount`, `final_price`, `coupon_code`, `coupon_id`. Only `status`, `coupon_usage`, and `used_count` change.
- **Time-window not enforced** — a doctor may want "no cancellation within 2 hours". Not implemented yet; add later if needed.
- **Doctor cancel available** — same endpoint. Doctors sometimes need to cancel on the patient's behalf (e.g. no-show).
- **Admin cancel available** — same endpoint. Support scenarios.
- **Bulk cancel not exposed** — no product need identified.

---

## How to Test

### Cancel + refund
1. Book an appointment with a coupon:
   ```sql
   SELECT id, used_count FROM coupons WHERE code = 'HEALTH20';   -- baseline
   ```
2. Cancel via the appointment history page
3. Verify:
   ```sql
   SELECT status, coupon_id, original_price, final_price FROM appointments WHERE id = <id>;
   -- status = 'cancelled', pricing snapshot still intact

   SELECT * FROM coupon_usage WHERE appointment_id = <id>;
   -- empty

   SELECT used_count FROM coupons WHERE id = <coupon_id>;
   -- decremented by 1 from baseline
   ```

### Authorization
- Try `PATCH /api/appointments/:id/cancel` with a token for a different patient → 403
- Try with a doctor token for an appointment not theirs → 403
- Admin token can cancel any appointment
