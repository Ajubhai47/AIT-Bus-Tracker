@echo off
echo.
echo ========================================
echo    Cloud Deployment Helper
echo ========================================
echo.

echo Building application for production...
call npm run deploy:build

if %ERRORLEVEL% neq 0 (
    echo Build failed! Please check the errors above.
    pause
    exit /b 1
)

echo.
echo Build successful! Choose deployment option:
echo.
echo 1. Vercel (Recommended)
echo 2. Railway 
echo 3. Netlify
echo 4. Manual deployment info
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Installing Vercel CLI...
    call npm install -g vercel
    echo.
    echo Deploying to Vercel...
    call vercel --prod
) else if "%choice%"=="2" (
    echo.
    echo Installing Railway CLI...
    call npm install -g @railway/cli
    echo.
    echo Please run: railway login
    echo Then run: railway deploy
) else if "%choice%"=="3" (
    echo.
    echo Installing Netlify CLI...
    call npm install -g netlify-cli
    echo.
    echo Please run: netlify login
    echo Then run: netlify deploy --prod
) else if "%choice%"=="4" (
    echo.
    echo Manual Deployment Instructions:
    echo.
    echo 1. Upload the 'dist' folder to your cloud provider
    echo 2. Set environment variables in cloud dashboard:
    echo    - MONGODB_URI=your-mongodb-connection-string
    echo    - SESSION_SECRET=your-jwt-secret
    echo    - NODE_ENV=production
    echo    - PORT=3000
    echo 3. Set start command to: npm run deploy:start
    echo 4. Enable HTTPS in your cloud provider settings
    echo.
    echo For detailed instructions, see DEPLOYMENT.md
) else (
    echo Exiting...
)

echo.
echo IMPORTANT: Don't forget to set environment variables!
echo See .env.production for required variables.
echo.
pause