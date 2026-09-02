# Docker-friendly smoke tests for the hospital-managed doctor APIs.
# Hits the running backend and confirms new endpoints, auth boundaries,
# hospital pricing controls, and the public booking-options aggregate.
#
# Assumes docker compose services `postgres` and `backend` are running,
# with the standard demo hospital account `admin@apollobay.example`.

$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api'
$hospEmail = 'admin@apollobay.example'
$hospPass = 'password123'

function Login($email, $pw) {
    $body = @{ email = $email; password = $pw } | ConvertTo-Json
    (Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body).data.token
}

function ExpectStatus([scriptblock]$call, [int]$expected, [string]$label) {
    try {
        & $call | Out-Null
        throw "$label expected status $expected but request succeeded"
    } catch {
        $ex = $_.Exception
        while ($ex.InnerException -and -not ($ex.PSObject.Properties['StatusCode'] -or $ex.Response)) {
            $ex = $ex.InnerException
        }
        $actual = 0
        if ($ex.PSObject.Properties['StatusCode']) { $actual = [int]$ex.StatusCode }
        elseif ($ex.Response) { $actual = [int]$ex.Response.StatusCode }
        if ($actual -ne $expected) { throw "$label expected status $expected but got $actual ($($ex.Message))" }
        Write-Host "  OK: $label -> $actual"
    }
}

$hospToken = Login $hospEmail $hospPass
$hHosp = @{ Authorization = "Bearer $hospToken" }

Write-Host '=== Hospital-owned endpoints require authentication ==='
ExpectStatus { Invoke-RestMethod -Uri "$base/hospital/departments" } 401 'GET /hospital/departments'
ExpectStatus { Invoke-RestMethod -Method Patch -Uri "$base/hospital/consultation-fee" -ContentType 'application/json' -Body '{}' } 401 'PATCH /hospital/consultation-fee'

Write-Host '=== Hospital-owned endpoints reachable with hospital token ==='
$departments = Invoke-RestMethod -Uri "$base/hospital/departments" -Headers $hHosp
if (-not $departments.success) { throw 'departments listing failed' }
Write-Host "  OK: hospital departments listed (count=$($departments.data.Count))"

$staff = Invoke-RestMethod -Uri "$base/hospital/staff" -Headers $hHosp
if (-not $staff.success) { throw 'staff listing failed' }
if (-not $staff.pricing) { throw 'pricing payload missing on staff listing' }
Write-Host "  OK: hospital doctors listed (count=$($staff.data.Count), mode=$($staff.pricing.consultationFeeMode))"

Write-Host '=== Pricing mode enforcement ==='
$invalidMode = @{ consultationFeeMode = 'INVALID' } | ConvertTo-Json
ExpectStatus { Invoke-RestMethod -Method Patch -Uri "$base/hospital/consultation-fee" -Headers $hHosp -ContentType 'application/json' -Body $invalidMode } 400 'PATCH consultation-fee invalid mode'

$missingFee = @{ consultationFeeMode = 'STANDARD' } | ConvertTo-Json
ExpectStatus { Invoke-RestMethod -Method Patch -Uri "$base/hospital/consultation-fee" -Headers $hHosp -ContentType 'application/json' -Body $missingFee } 400 'PATCH consultation-fee missing standard fee'

$validStandard = @{ consultationFeeMode = 'STANDARD'; defaultConsultationFee = $staff.pricing.defaultConsultationFee } | ConvertTo-Json
$restored = Invoke-RestMethod -Method Patch -Uri "$base/hospital/consultation-fee" -Headers $hHosp -ContentType 'application/json' -Body $validStandard
if ($restored.data.consultationFeeMode -ne 'STANDARD') { throw 'standard mode restore failed' }
Write-Host "  OK: standard mode restored (fee=$($restored.data.defaultConsultationFee))"

Write-Host '=== Public booking options ==='
$hospitalId = if ($staff.data.Count -gt 0) { $staff.data[0].hospitalProfileId } else { 11 }
$options = Invoke-RestMethod -Uri "$base/hospitals/$hospitalId/booking-options"
if (-not $options.success) { throw 'booking-options request failed' }
if ($options.data.hospitalId -ne $hospitalId) { throw 'hospital id mismatch in booking-options' }
Write-Host "  OK: booking-options for $hospitalId (mode=$($options.data.consultationFeeMode), departments=$($options.data.departments.Count))"

Write-Host '=== Invalid hospital id rejected ==='
ExpectStatus { Invoke-RestMethod -Uri "$base/hospitals/999999/booking-options" } 404 'GET /hospitals/999999/booking-options'

Write-Host 'Hospital-managed doctor smoke tests passed.'
