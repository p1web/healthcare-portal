# Doctor Patient Bookings Workflow

**Status:** ✅ Complete

Doctor's view of their patients' bookings — filter, bulk-approve, reject-with-reason, paginate.

Related: [booking-lifecycle.md](./booking-lifecycle.md), [../coupons/booking-application.md](../coupons/booking-application.md).

---

## Feature Summary

- **Filter by status** — All / Pending / Confirmed / Rejected / Cancelled / Completed
- **Filter by date range** — `fromDate` / `toDate` on `appointment_date`
- **Bulk confirm** — check any subset of pending rows and confirm in a single request; other statuses are silently skipped
- **Reject with reason** — required textarea (min 5 chars); status becomes `rejected`; reason stored on the appointment; coupon refunded
- **Pagination** — client-side with page size selector (5 / 10 / 25 / 50) and windowed page numbers
- **Empty state** — differentiates "no bookings yet" from "no records for current filters" (with filter chip and Clear button)

---

## Database Schema

### `appointments` — new column ([20260826030000](../../backend/migrations/20260826030000-add-rejection-to-appointments.js))
| Column | Type | Notes |
|--------|------|-------|
| rejection_reason | TEXT | nullable |

### `appointments.status` — new enum value
`'rejected'` added via:
```sql
ALTER TYPE "enum_appointments_status" ADD VALUE IF NOT EXISTS 'rejected'
```
Runs outside a transaction (Postgres requirement for `ADD VALUE`).

---

## Backend

### Routes
[backend/routes/appointment.routes.js](../../backend/routes/appointment.routes.js):

```
GET   /api/appointments/doctor              → doctor: list with query filters
PATCH /api/appointments/:id/approve         → doctor: pending → confirmed
PATCH /api/appointments/:id/reject          → doctor: pending → rejected (body: reason)
POST  /api/appointments/doctor/bulk-approve → doctor: pending → confirmed for many
```

### Controller
[backend/controllers/appointment.controller.js](../../backend/controllers/appointment.controller.js):

**`getDoctorAppointments`** — accepts `status`, `fromDate`, `toDate` query params; applies as `WHERE` clauses.

**`rejectAppointment`** — doctor-only:
1. Validates reason non-empty
2. Loads the appointment scoped to this doctor's profile
3. Rejects if not `pending`
4. Refunds coupon (delete `coupon_usage`, decrement `used_count`) — same flow as [booking-lifecycle.md](./booking-lifecycle.md)
5. Sets `status = 'rejected'` and `rejection_reason = <reason>`

**`bulkApproveAppointments`** — doctor-only:
- Accepts `{ ids: number[] }`
- Loads all matching appointments where `id ∈ ids AND doctor_profile_id = this doctor AND status = 'pending'`
- Sets each to `confirmed` and saves
- Returns `{ approved: [...], skipped: <count> }` — skipped = ids not owned or not pending

### Response format
`formatDoctorAppointment` now includes `rejectionReason`.

---

## Frontend

### Page
[src/app/components/user/doctor-appointments/](../../src/app/components/user/doctor-appointments/):

**Filters panel** — Status dropdown / From date / To date / Clear filters button.

**Bulk bar** — visible only when pending rows are on the current page:
- **Select all pending on this page** checkbox (uses `selectAllChecked` synced boolean, not a getter, for reliable state)
- Selection counter chip (e.g. _"3 selected"_)
- **Clear** button
- **Confirm Selected** button (disabled when nothing selected or during request)

**Table columns**: checkbox | Patient (avatar + name + email + phone) | Date & Time | Reason (+ inline rejection note) | Status pill | Actions.

**Actions on pending rows**: Approve (green) + Reject (outline danger) buttons. Non-pending rows show `—`.

**Reject modal** — Bootstrap modal with red gradient header, patient/slot summary, required reason textarea, min 5 chars.

**Pagination footer** — range info ("Showing 1–10 of 42"), page size dropdown, first/prev/numbered/next/last.

**Empty state** — icon changes based on `hasActiveFilters`; message shows a filter chip and Clear button when a filter is active.

### Service
[src/app/services/appointment.service.ts](../../src/app/services/appointment.service.ts):
```ts
getDoctorAppointmentsFiltered({ status, fromDate, toDate })
rejectAppointment(id: number, reason: string)
bulkApproveAppointments(ids: number[])
```

### Design polish
- **Header + row checkboxes** — larger (1.35rem), rounded corners, 2px border. Row checkboxes turn solid **green** when checked; the header select-all turns solid **blue** — visually distinguishing the two roles.
- Custom hover: 1.06× scale + soft blue shadow.
- Focus ring: 3px translucent blue.
- Consistent visual language with the patient My Appointments page — same filters panel styling, same pagination, same empty state pattern.

---

## API Reference

### `GET /api/appointments/doctor`
Query params (all optional):
- `status` — `pending` / `confirmed` / `cancelled` / `completed` / `rejected`
- `fromDate` — `YYYY-MM-DD`, matches `appointment_date >= …`
- `toDate` — `YYYY-MM-DD`, matches `appointment_date <= …`

### `PATCH /api/appointments/:id/reject`
Body:
```json
{ "reason": "Doctor is unavailable on the requested slot" }
```
- `400` if reason empty
- `409` if appointment is not pending
- `200` returns the updated appointment (status `rejected`, `rejectionReason` populated)

### `POST /api/appointments/doctor/bulk-approve`
Body:
```json
{ "ids": [12, 13, 15] }
```
Response:
```json
{
  "success": true,
  "message": "3 appointment(s) confirmed",
  "data": { "approved": [ {...}, {...}, {...} ], "skipped": 0 }
}
```
`skipped` counts ids that were not pending or not owned by the doctor.

---

## Design Decisions

- **New status `'rejected'` (not reusing `'cancelled'`)** — semantically distinct: cancelled = patient/doctor withdrew after acceptance; rejected = doctor declined a pending request.
- **Reject refunds coupon usage** — matches the cancel flow. Fair to the patient.
- **Server-side filtering** — status/date params reach the backend. Client-side pagination is fine at current scale but could move server-side later.
- **Bulk approve is best-effort** — invalid ids (non-pending, not-owned) are silently skipped. `skipped` count is reported. No partial-failure error to keep the UX simple.
- **Reject reason ≥ 5 chars** — front-end validation prevents empty/whitespace rejects; backend also rejects empty strings.
- **Rejection reason preserved** — the reason stays on the row forever, even if the appointment is later mutated. Audit trail.
- **Select-all pending scoped to current page** — safer UX than selecting across all filtered pages. Users can page and repeat if they need bulk approval across many pages.

---

## How to Test

1. Log in as a doctor with pending appointments
2. **Filter**: pick `Pending` + a date range → server filters and returns matching rows
3. **Bulk confirm**: check the header select-all → **Confirm Selected** → all confirmed at once
4. **Reject with comment**: click **Reject** → enter reason (min 5 chars) → submit → row shows red **Rejected** pill with the reason inline
5. Verify DB:
   ```sql
   SELECT id, status, rejection_reason, coupon_id FROM appointments WHERE id = <id>;
   SELECT * FROM coupon_usage WHERE appointment_id = <id>;   -- empty if a coupon was applied
   ```

---

## Known Follow-ups

- **Notifications** — the patient isn't notified when their appointment is rejected. Add email/push in a future phase.
- **Bulk reject** — not included; per-row reject was chosen because each rejection carries its own reason.
- **Server-side pagination** — currently client-side; consider moving as appointment volume grows.
