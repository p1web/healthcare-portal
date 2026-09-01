$ErrorActionPreference = 'Stop'
$base = 'http://localhost:3000/api'
$t = (Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json' -Body (@{ email = 'systemadmin@gmail.com'; password = 'password123' } | ConvertTo-Json)).data.token
$h = @{ Authorization = "Bearer $t" }
$r = Invoke-RestMethod -Uri "$base/admin/appointments" -Headers $h
$r.data | Select-Object -First 3 id, originalPrice, discountAmount, netCostAfterCashback | Format-Table -AutoSize
$hasOld = $r.data | Where-Object { $_.PSObject.Properties.Name -contains 'finalPrice' } | Select-Object -First 1
Write-Host ("has finalPrice? " + ($null -ne $hasOld))
Write-Host ("has netCostAfterCashback? " + ($null -ne ($r.data | Where-Object { $_.PSObject.Properties.Name -contains 'netCostAfterCashback' } | Select-Object -First 1)))
