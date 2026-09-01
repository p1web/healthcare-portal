$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api'
$hospEmail = 'admin@apollobay.example'
$hospPass = 'password123'

function Login($email, $pw) {
    $body = @{ email = $email; password = $pw } | ConvertTo-Json
    $res = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body $body
    return $res.data.token
}

function ReadErr($ex) {
    $s = $ex.Exception.Response.StatusCode.value__
    $r = New-Object System.IO.StreamReader($ex.Exception.Response.GetResponseStream())
    $b = $r.ReadToEnd()
    return "status=$s body=$b"
}

$t1 = Login $hospEmail $hospPass
$t2 = Login $hospEmail $hospPass
$h1 = @{ Authorization = "Bearer $t1" }
$h2 = @{ Authorization = "Bearer $t2" }

$s1 = Invoke-RestMethod -Uri "$base/hospital/availability" -Headers $h1
$s2 = Invoke-RestMethod -Uri "$base/hospital/availability" -Headers $h2
Write-Host "Session1 sees version=$($s1.data.version)  Session2 sees version=$($s2.data.version)"

$body1 = @{
    expectedVersion = $s1.data.version
    availability = @(
        @{ dayOfWeek = 1; startTime = '09:00'; endTime = '17:00' },
        @{ dayOfWeek = 2; startTime = '09:00'; endTime = '17:00' }
    )
} | ConvertTo-Json -Depth 5

$r1 = Invoke-RestMethod -Method Put -Uri "$base/hospital/availability" -Headers $h1 -ContentType 'application/json' -Body $body1
Write-Host "Session1 PUT ok  -> new version=$($r1.data.version)"

$body2 = @{
    expectedVersion = $s2.data.version
    availability = @(@{ dayOfWeek = 3; startTime = '10:00'; endTime = '16:00' })
} | ConvertTo-Json -Depth 5

try {
    Invoke-RestMethod -Method Put -Uri "$base/hospital/availability" -Headers $h2 -ContentType 'application/json' -Body $body2 | Out-Null
    Write-Host 'UNEXPECTED: session2 PUT succeeded on stale version'
} catch {
    Write-Host "Session2 PUT (stale) -> $(ReadErr $_)"
}

$s2b = Invoke-RestMethod -Uri "$base/hospital/availability" -Headers $h2
$togBody = @{ acceptsBookings = $false; expectedVersion = $s2b.data.version } | ConvertTo-Json
$rTog = Invoke-RestMethod -Method Patch -Uri "$base/hospital/accepts-bookings" -Headers $h2 -ContentType 'application/json' -Body $togBody
Write-Host "Session2 toggle ok  -> version=$($rTog.data.version) acceptsBookings=$($rTog.data.acceptsBookings)"

$togBody1 = @{ acceptsBookings = $true; expectedVersion = $r1.data.version } | ConvertTo-Json
try {
    Invoke-RestMethod -Method Patch -Uri "$base/hospital/accepts-bookings" -Headers $h1 -ContentType 'application/json' -Body $togBody1 | Out-Null
    Write-Host 'UNEXPECTED: session1 toggle succeeded on stale version'
} catch {
    Write-Host "Session1 toggle (stale) -> $(ReadErr $_)"
}

$s1c = Invoke-RestMethod -Uri "$base/hospital/availability" -Headers $h1
$restore = @{ acceptsBookings = $true; expectedVersion = $s1c.data.version } | ConvertTo-Json
$rRestore = Invoke-RestMethod -Method Patch -Uri "$base/hospital/accepts-bookings" -Headers $h1 -ContentType 'application/json' -Body $restore
Write-Host "Restored acceptsBookings=$($rRestore.data.acceptsBookings) version=$($rRestore.data.version)"
