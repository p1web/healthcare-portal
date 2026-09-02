# Docker-only verification for the hospital-managed doctor migration.
# Runs migrations forward, undoes only the phase-1 migration, migrates
# again on a disposable database, then checks the resulting schema.
#
# Assumes docker compose services `postgres` and `backend` are running.

$ErrorActionPreference = 'Stop'
$dbUser = 'healthcare_user'
$dbName = 'healthcare_phase1_verify'
$migrationName = '20260902000000-add-hospital-managed-doctor-foundation'

function DockerExec([string]$service, [string[]]$argsList) {
    docker compose exec -T $service @argsList
    if ($LASTEXITCODE -ne 0) { throw "docker compose exec $service failed" }
}

function Psql([string]$sql) {
    docker compose exec -T postgres psql -U $dbUser -d $dbName -tAc $sql
    if ($LASTEXITCODE -ne 0) { throw "psql failed: $sql" }
}

function ExpectRow([string]$sql, [string]$expected, [string]$label) {
    $actual = (Psql $sql).Trim()
    if ($actual -ne $expected) { throw "$label expected '$expected' but got '$actual'" }
    Write-Host "  OK: $label = $actual"
}

Write-Host '=== Reset disposable database ==='
docker compose exec -T postgres dropdb -U $dbUser --if-exists $dbName | Out-Null
docker compose exec -T postgres createdb -U $dbUser $dbName | Out-Null

Write-Host '=== Migrate up (all migrations) ==='
DockerExec 'backend' @('sh', '-lc', "DB_NAME=$dbName npx sequelize-cli db:migrate")

Write-Host '=== Migrate down (undo phase-1 migration) ==='
DockerExec 'backend' @('sh', '-lc', "DB_NAME=$dbName npx sequelize-cli db:migrate:undo --name $migrationName.js")

Write-Host '=== Migrate up again ==='
DockerExec 'backend' @('sh', '-lc', "DB_NAME=$dbName npx sequelize-cli db:migrate")

Write-Host '=== Schema checks ==='
ExpectRow "SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('departments','hospital_staff_availability');" '2' 'new tables present'
ExpectRow "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='appointments' AND column_name IN ('hospital_staff_id','department_id');" '2' 'appointment columns added'
ExpectRow "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='hospital_staff' AND column_name IN ('department_id','consultation_fee','is_bookable');" '3' 'hospital_staff columns added'
ExpectRow "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='hospital_profiles' AND column_name='consultation_fee_mode';" '1' 'consultation_fee_mode column added'
ExpectRow "SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_name='appointments_managed_doctor_target_check';" '1' 'managed-doctor constraint present'
ExpectRow "SELECT COUNT(*) FROM pg_indexes WHERE indexname='departments_hospital_name_unique';" '1' 'department unique index present'

Write-Host '=== Cleanup ==='
docker compose exec -T postgres dropdb -U $dbUser $dbName | Out-Null
Write-Host 'Migration cycle verified.'
