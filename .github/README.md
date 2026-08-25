# Healthcare Portal — Planning Documents

Feature-based specifications for the promotional coupon system and the appointment workflow it feeds into.

## Structure

```
.github/
├── README.md                          ← this file
├── coupons/
│   ├── admin-management.md            ← categories, coupons, hospital map, soft-delete
│   ├── bulk-generation.md             ← generate many coupons from a template
│   ├── booking-application.md         ← apply a coupon at appointment booking
│   ├── per-user-limits.md             ← max_uses_per_user enforcement
│   └── analytics.md                   ← admin analytics dashboard
└── appointments/
    ├── booking-lifecycle.md           ← book, pricing snapshot, patient cancel + refund
    ├── doctor-workflow.md             ← filters, bulk approve, reject with reason
    └── patient-view.md                ← My Appointments (filters, pricing, cancel, rejection visibility)
```

## Delivery timeline

| Feature | Status | Notes |
|---------|--------|-------|
| Coupon admin management | ✅ Complete | Categories + coupons + hospital mapping + soft-delete |
| Coupon booking application | ✅ Complete | Applied at appointment booking; server-side validation |
| Per-user usage limit | ✅ Complete | `max_uses_per_user` column + enforcement |
| Bulk coupon generation | ✅ Complete | Up to 500 codes per request |
| Analytics dashboard | ✅ Complete | Redemptions, top coupons, categories, expiring soon |
| Appointment cancel + refund | ✅ Complete | Patient/doctor/admin cancel; refunds coupon usage |
| Doctor Patient Bookings workflow | ✅ Complete | Filters, bulk approve, reject with reason, pagination |
| Patient My Appointments | ✅ Complete | Same filter pattern + pricing view + rejection visibility |

## Design principles

- **Two independent state flags** on each coupon: `is_active` (admin toggle) and `is_deleted` (soft-delete marker). Delete never touches active.
- **Snapshot pricing** on appointments — the original fee, discount, and final price captured at booking time survive any later change (audit trail).
- **Refund on cancel/reject** — cancelling or rejecting an appointment removes the associated `coupon_usage` row and decrements `used_count`, but keeps the appointment's price snapshot intact.
- **Server-side filtering** — status/date filters are query params, not client-side after fetching. Keeps the wire small as data grows.
- **Consistent professional design** — filters panel, result-count pill, empty state with filter chip, pagination footer used by both doctor and patient views.

## Out of scope (deferred)

- Notifications to patients when their appointment is rejected (email/push)
- Time-window enforcement for cancellation (e.g. "no cancellation within 2 hours")
- Date-range filters on analytics dashboard
- Pagination on the doctor list at server level (currently client-side)
