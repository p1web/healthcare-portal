$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api'

function Login($email, $pw) {
    $body = @{ email = $email; password = $pw } | ConvertTo-Json
    (Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body).data.token
}

$hospToken = Login 'admin@apollobay.example' 'password123'
$adminToken = Login 'systemadmin@gmail.com' 'password123'

if (-not $hospToken) { throw 'hospital token missing' }

$hHosp = @{ Authorization = "Bearer $hospToken" }
$hAdmin = @{ Authorization = "Bearer $adminToken" }

Write-Host '--- Hospital summary totals (splits doctorPayout vs hospitalRetention) ---'
$sum = Invoke-RestMethod -Uri "$base/hospital/summary" -Headers $hHosp
$sum.data.totals | Format-List

Write-Host '--- Admin appointment list (first 3, showing isHospitalBooking + payout amounts) ---'
$adm = Invoke-RestMethod -Uri "$base/admin/appointments" -Headers $hAdmin
$adm.data | Select-Object -First 6 id, doctorId, isHospitalBooking, platformRevenueAmount, doctorPayoutAmount, status | Format-Table -AutoSize
