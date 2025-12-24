
param (
    [Parameter(Mandatory=$true)]
    [string]$RepoUrl
)

Write-Host "Initializing Git Repository..." -ForegroundColor Cyan

# 1. Initialize Git
if (-not (Test-Path .git)) {
    git init
    Write-Host "Initialized empty Git repository." -ForegroundColor Green
} else {
    Write-Host "Git repository already initialized." -ForegroundColor Yellow
}

# 2. Create .gitignore if missing
if (-not (Test-Path .gitignore)) {
    $ignoreContent = @"
node_modules/
.next/
.env
.env.local
.DS_Store
dist/
build/
.vscode/
"@
    Set-Content .gitignore $ignoreContent
    Write-Host "Created .gitignore." -ForegroundColor Green
}

# 3. Add Files
Write-Host "Adding files..." -ForegroundColor Cyan
git add .

# 4. Commit
Write-Host "Committing files..." -ForegroundColor Cyan
git commit -m "Initial commit of Bible Study App"

# 5. Add Remote
$currentRemote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or -not $currentRemote) {
    Write-Host "Adding remote origin: $RepoUrl" -ForegroundColor Cyan
    git remote add origin $RepoUrl
} else {
    Write-Host "Remote origin already exists: $currentRemote" -ForegroundColor Yellow
    Write-Host "Updating remote to: $RepoUrl" -ForegroundColor Cyan
    git remote set-url origin $RepoUrl
}

# 6. Branch Rename to Main
git branch -M main

# 7. Push
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host "Push failed. Please check your URL and permissions." -ForegroundColor Red
}
