# Hospital-Managed Doctor Booking Plan

## Summary

Add hospital-managed doctor booking without creating doctor login credentials. The hospital owns doctor records, appointments, payments, invoices, and operational access.

Hospitals can configure consultation pricing in two ways:

- **Standard fee:** Every doctor uses the hospital's existing default consultation fee.
- **Doctor-specific fees:** Each bookable doctor has an individual consultation fee.

Patients booking from a hospital page must first select a department and then select a doctor in that department. The server calculates the authoritative fee from the hospital's pricing mode and snapshots it on the appointment.

Existing independent-doctor booking through `DoctorProfile` and `DoctorPractice` remains supported and separate.

## Decisions

- Managed doctors do not receive users, credentials, dashboards, payout access, or appointment permissions.
- The existing `HospitalStaff` model becomes the data source for hospital-managed doctors.
- Use **Hospital doctors** as the product and UI name; do not rename the physical table initially.
- Every new hospital-page booking requires a department and doctor.
- Existing hospital-only appointments remain readable.
- A managed doctor belongs to one department within a hospital.
- Fees vary by doctor only, not by appointment type.
- The hospital is the invoice issuer and payment beneficiary after platform commission.
- The selected doctor is shown as clinical attribution on appointments and invoices.

## Phase 1: Data Foundation

### Departments

Add a `departments` table and model with:

- `id`
- `hospital_profile_id`
- `name`
- `description` (optional)
- `is_active`
- timestamps

Department names should be unique within a hospital, using case-insensitive validation.

Associations:

- Hospital has many departments.
- Department belongs to one hospital.
- Department has many managed doctors.

### Hospital Pricing Mode

Extend `hospital_profiles` with `consultation_fee_mode`:

- `STANDARD`
- `PER_DOCTOR`

Default existing hospitals to `STANDARD`. Keep `default_consultation_fee` as the standard fee and as the migration/backfill value.

### Hospital-Managed Doctors

Extend `hospital_staff` with:

- `department_id`
- `consultation_fee` (nullable in standard mode)
- `is_bookable`
- existing `is_active` status

Validation rules:

- A department is required for new bookable doctors.
- `PER_DOCTOR` mode requires a positive consultation fee for every bookable doctor.
- `STANDARD` mode ignores doctor fee overrides for billing.
- The hospital can create and manage these records without creating a `User` or `DoctorProfile`.

### Doctor Availability

Add `hospital_staff_availability` with:

- `hospital_staff_id`
- `day_of_week`
- `start_time`
- `end_time`
- `is_available`
- timestamps

Reject overlapping availability entries for the same doctor and day. Hospital hours can be used as initial defaults, but doctor-specific schedules and appointment conflict checks remain authoritative.

### Appointments

Extend `appointments` with:

- `hospital_staff_id` (nullable for legacy and independent-doctor appointments)
- `department_id` (nullable for legacy appointments)

Rules for new hospital-managed bookings:

- `hospital_profile_id`, `hospital_staff_id`, and `department_id` are required.
- The doctor must belong to the appointment hospital and selected department.
- A hospital-managed booking cannot also contain `doctor_profile_id` or `practice_id`.
- Use restrictive deletion or soft deactivation so historical invoices remain valid.
- Preserve appointment fee snapshots even if current hospital or doctor fees later change.

### Backfill

- Create a `General` department for each existing hospital.
- Assign existing active hospital staff to the General department.
- Keep existing hospitals in `STANDARD` mode.
- Do not automatically publish existing staff as bookable until the hospital confirms department and schedule information.
- Leave historical appointments unchanged.

## Phase 2: Hospital Management

### Department Management

Add hospital-authenticated endpoints and UI for:

- Listing departments
- Creating departments
- Updating departments
- Activating or deactivating departments

A department with active doctors must be reassigned or resolved before deactivation. Historical references must be retained.

### Doctor Management

Extend hospital doctor management to support:

- Required department selection
- Consultation fee according to pricing mode
- Bookable status
- Active status
- Weekly availability

All write operations must validate that departments and doctors belong to the authenticated hospital.

Replace hard deletion with deactivation when a doctor has appointment history.

### Fee Settings

Add hospital settings with these labels:

- **Standard fee**
- **Doctor-specific fees**

In Standard fee mode:

- Require one hospital default consultation fee.
- Disable per-doctor fee inputs.

In Doctor-specific fees mode:

- Require a valid fee for every bookable doctor.
- Show incomplete doctor records before saving or publishing the mode.

## Phase 3: Patient Booking

### Public Booking Options

Add a public hospital booking-options endpoint that returns:

- Active departments
- Active and bookable doctors grouped by department
- Effective consultation fee for each doctor
- Public schedule metadata

Do not expose private staff contact information.

### Booking Flow

Change hospital booking to:

1. Select department.
2. Select a doctor filtered by that department.
3. Select an available date and time.
4. Review the effective consultation fee.
5. Apply a coupon, if available.
6. Submit the booking.

Behavior:

- Preselect a department or doctor when only one option exists.
- Clear or revalidate the coupon when the selected doctor changes the fee.
- Show a clear unavailable state if a department has no bookable doctors or slots.
- Do not allow new direct hospital-only bookings.

The request payload includes:

```json
{
  "hospitalId": 1,
  "departmentId": 10,
  "hospitalStaffId": 25,
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "reason": "Consultation reason",
  "paymentMode": "online",
  "expectedFee": 500,
  "couponCode": "OPTIONAL"
}
```

### Server-Authoritative Pricing

The server resolves the effective fee:

```text
STANDARD    -> hospital.defaultConsultationFee
PER_DOCTOR  -> hospitalStaff.consultationFee
```

The backend must validate:

- Hospital approval and booking status
- Department ownership and active status
- Doctor ownership, department, active status, and bookable status
- Doctor availability
- No conflicting active appointment for the doctor and time
- Valid consultation fee
- No mixed managed-doctor and independent-doctor fields

Retain the existing fee-change guard. Return the existing conflict response when `expectedFee` differs from the server fee so the patient can reconfirm.

Coupon validation, final price, platform commission, and appointment price snapshots continue to be calculated on the server.

## Phase 4: Ownership, Invoice, and Reporting

### Access and Appointment Lifecycle

Hospital-managed appointments use hospital permissions only:

- Hospital confirms or rejects appointments.
- Hospital completes appointments.
- Hospital manages offline payment status.
- Managed doctors have no authentication or direct appointment access.

Independent registered-doctor workflows remain unchanged.

### Invoice and Receipt

For hospital-managed bookings:

- The hospital is the invoice issuer and provider.
- Show the selected doctor as **Consulting doctor**.
- Show the department as contextual information.
- Use the immutable appointment pricing snapshot.
- Display post-platform revenue as hospital net revenue, not doctor payout.

The existing database payout field can remain temporarily for compatibility, but hospital-facing APIs and UI must use correct hospital revenue terminology.

Invoice fields should reuse hospital legal name, address, tax identifier, and other profile data where available. Jurisdiction-specific tax changes are outside this feature unless separately required.

### Reporting

- Count managed-doctor appointments as hospital bookings.
- Attribute their revenue to the hospital.
- Allow hospital reporting filters by department and consulting doctor.
- Keep independent doctor payout and reporting behavior unchanged.

## Primary Implementation Areas

### Backend

- `backend/models/hospital-profile.js`
- `backend/models/hospital-staff.js`
- `backend/models/appointment.js`
- New `backend/models/department.js`
- New `backend/models/hospital-staff-availability.js`
- Additive migrations under `backend/migrations/`
- `backend/controllers/hospitalStaff.controller.js`
- New `backend/controllers/department.controller.js`
- `backend/controllers/appointment.controller.js`
- `backend/controllers/hospitalAppointment.controller.js`
- `backend/routes/hospitalStaff.routes.js`
- `backend/routes/appointment.routes.js`
- New department routes and server registration
- `backend/utils/practiceCommission.js` callers and labels

### Frontend

- `src/app/components/hospital-booking/hospital-booking.component.ts`
- `src/app/components/hospital-booking/hospital-booking.component.html`
- `src/app/components/hospital-detail/hospital-detail.component.ts`
- `src/app/components/hospital-detail/hospital-detail.component.html`
- Hospital profile/settings components
- Hospital staff-management components, relabeled as Hospital doctors
- Appointment list and receipt components
- `src/app/services/hospital-staff.service.ts`
- `src/app/services/appointment.service.ts`
- New `src/app/services/department.service.ts`

## Verification

All verification runs through Docker Compose. Ensure `postgres`, `backend`, and `frontend` services are running.

### Frontend

Focused tests exist for the new services and the affected components. Run inside the frontend container:

```powershell
docker compose exec frontend npx --no-install ng build --configuration=development
docker compose exec frontend npx --no-install ng test --watch=false
```

Coverage focus:

- Pricing-mode controls
- Department-dependent doctor filtering
- Required department and doctor selection
- Effective fee updates
- Coupon revalidation after doctor changes
- Appointment request payload

### Backend

Two PowerShell verification scripts drive Docker-hosted checks:

```powershell
./scripts/verify-hospital-managed-doctor-migration.ps1
./scripts/verify-hospital-managed-doctor-api.ps1
```

The migration script uses a disposable database and confirms:

- All migrations apply forward.
- The phase 1 migration reverses cleanly.
- Migrating forward again restores the expected columns, tables, indexes, and constraints.

The API script hits the running backend and confirms:

- Hospital-owned endpoints require authentication.
- Pricing mode changes reject invalid values and enforce a positive standard fee.
- The public booking-options endpoint responds for a valid hospital and rejects an unknown hospital id.
- Hospital doctor listing includes the pricing block returned by the backend.

Additional manual acceptance:

- Cross-hospital identifiers rejected.
- Mixed doctor and hospital-managed provider payloads rejected.
- Doctor availability and double-booking conflicts.
- Fee-change conflict response.
- Coupon and price snapshots on the appointment.
- Hospital-only appointment lifecycle permissions.
- Hospital-branded receipt fields showing consulting doctor and department.

### Migrations and Acceptance

- Run migrations forward on a disposable database using the migration script above.
- Validate the General department and staff backfill counts in the development database.
- Validate indexes and constraints.
- Run down migrations and then migrate forward again through the same script.
- Manually verify both pricing modes from hospital configuration through patient booking, hospital completion, and receipt generation.
