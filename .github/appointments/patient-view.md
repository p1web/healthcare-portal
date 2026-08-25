# Patient My Appointments

**Status:** ✅ Complete

Patient's view of their own bookings — filter, paginate, see pricing breakdown, view rejection reasons, and cancel where applicable.

Related: [booking-lifecycle.md](./booking-lifecycle.md), [doctor-workflow.md](./doctor-workflow.md), [../coupons/booking-application.md](../coupons/booking-application.md).

---

## Feature Summary

- **Filter by status** — All / Pending / Confirmed / Rejected / Cancelled / Completed
- **Filter by date range** — `fromDate` / `toDate` on `appointment_date`
- **Cancel button** — visible for `pending` and `confirmed` appointments
- **Pricing column** — shows final price, strikethrough original, discount, coupon chip
- **Rejection visibility** — the reason the doctor gave surfaces inline
- **Pagination** — client-side with page size selector and windowed page numbers
- **Empty state** — differentiates "no appointments yet" from "no records for current filters"

---

## Backend

### Route
[backend/routes/appointment.routes.js](../../backend/routes/appointment.routes.js):
```
GET   /api/appointments                → patient: list with query filters
PATCH /api/appointments/:id/cancel     → patient / doctor / admin
```

### Controller
[backend/controllers/appointment.controller.js](../../backend/controllers/appointment.controller.js):

- **`getPatientAppointments`** accepts optional `status`, `fromDate`, `toDate` query params — mirrors the doctor endpoint
- **`formatAppointment`** returns `rejectionReason` so patients can see why the doctor rejected them

### Cancel logic
See [booking-lifecycle.md](./booking-lifecycle.md) for the shared cancel handler and coupon refund flow.

---

## Frontend

### Page
[src/app/components/user/appointment-history/](../../src/app/components/user/appointment-history/) — the "My Appointments" page.

### Layout
Mirrors the doctor's Patient Bookings for consistency:

- Card wrapper with header: title + description + result-count pill + **Book** button
- **Filters panel**: Status / From date / To date / Clear filters
- **Table columns**: Doctor (avatar + name + specialty + hospital) | Date & Time | Reason (+ inline rejection note if rejected) | Pricing | Status pill | Booked On | Actions
- **Empty state**: differentiates "no data" from "no matches" — the latter shows a filter chip and Clear button
- **Pagination footer**: range info + page size + numbered pages

### Pricing column
- Final price (bold), e.g. `₹400`
- If a coupon was applied: strikethrough original price (`~~₹500~~`) + green discount (`−₹100`)
- Coupon code shown as a monospaced blue chip

### Rejection reason
When the appointment was rejected by the doctor, a red-bordered note appears inline in the reason cell:

```
Reason for Visit: Not specified
────────────────────────────
Rejected: Doctor is unavailable on that slot
```

### Cancel action
`confirm()` dialog explains: _"Cancel this appointment? Any applied coupon will be refunded for future use."_ — sets expectations before deletion of the `coupon_usage` row.

### Service
[src/app/services/appointment.service.ts](../../src/app/services/appointment.service.ts):
```ts
getAppointments(): Observable<{ success, data: AppointmentHistory[] }>
getAppointmentsFiltered(filters): Observable<{ success, data: AppointmentHistory[] }>
cancelAppointment(id): Observable<{ success, message, data }>
```

### Model
[src/app/models/appointment.model.ts](../../src/app/models/appointment.model.ts) — `AppointmentHistory` includes:
- `status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'rejected'`
- `rejectionReason?: string | null`
- `couponCode?: string | null`, `couponId?: number | null`
- `originalPrice?: number | null`, `discountAmount?: number`, `finalPrice?: number | null`

---

## Design Decisions

- **Consistent design language with doctor-workflow** — same filters panel, same result-count pill, same pagination component, same empty-state pattern. Reduces cognitive load across roles.
- **Rejection reason surfaced to the patient** — the patient deserves to know why they were rejected. Shown inline (not hidden behind a click).
- **Cancel action guarded by confirm()** — irreversible and refunds a coupon, so an explicit confirmation is warranted.
- **Book button in the header** — the empty-state Book button covers the "no bookings yet" case; the header-level button covers the "let me book another" case.
- **No breadcrumb / duplicate H1** — page consistency across patient-facing pages (see also [src/app/components/doctor-detail](../../src/app/components/doctor-detail/)). Card-embedded heading only.

---

## How to Test

1. Log in as a patient with a mix of pending / confirmed / cancelled / rejected appointments
2. Navigate to `/appointments`
3. **Filter by status** — pick each option; the list narrows and the pill count updates
4. **Filter by date range** — the list narrows further
5. **Empty case** — filter by `Rejected` when you have no rejected rows → empty state with `Rejected` chip and **Clear filters** button
6. **Pricing** — confirm that appointments booked with a coupon show the strikethrough, discount, and coupon chip
7. **Rejection reason** — if you have a rejected appointment, the reason from the doctor appears in the reason cell as a red note
8. **Cancel** — click Cancel on a pending/confirmed row → dialog → confirmation → list refreshes; if a coupon was applied, verify the coupon's `used_count` decremented
