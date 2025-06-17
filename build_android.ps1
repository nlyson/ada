
# Android Build Script for Capacitor App
# This script builds the Next.js app and prepares it for Android development

Write-Host "🚀 Starting Android build process..." -ForegroundColor Green

try {
    # Step 1: Build Next.js app
    Write-Host "`n📦 Step 1: Building Next.js app..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed"
    }
    Write-Host "✅ Next.js build completed" -ForegroundColor Green

    # Step 2: Copy web assets to Android
    Write-Host "`n📁 Step 2: Copying web assets to Android..." -ForegroundColor Cyan
    npx cap copy android
    if ($LASTEXITCODE -ne 0) {
        throw "cap copy android failed"
    }
    Write-Host "✅ Web assets copied to Android" -ForegroundColor Green

    # Step 3: Sync Capacitor plugins and dependencies
    Write-Host "`n🔄 Step 3: Syncing Capacitor plugins..." -ForegroundColor Cyan
    npx cap sync android
    if ($LASTEXITCODE -ne 0) {
        throw "cap sync android failed"
    }
    Write-Host "✅ Capacitor sync completed" -ForegroundColor Green

    # Step 4: Open in Android Studio
    Write-Host "`n🎯 Step 4: Opening Android Studio..." -ForegroundColor Cyan
    npx cap open android
    if ($LASTEXITCODE -ne 0) {
        throw "cap open android failed"
    }
    Write-Host "✅ Android Studio launched" -ForegroundColor Green

    Write-Host "`n🎉 Build process completed successfully!" -ForegroundColor Green
    Write-Host "Android Studio should now be open with your project." -ForegroundColor Yellow

} catch {
    Write-Host "`n❌ Build process failed: $_" -ForegroundColor Red
    Write-Host "Please check the error messages above and try again." -ForegroundColor Yellow
    exit 1
}