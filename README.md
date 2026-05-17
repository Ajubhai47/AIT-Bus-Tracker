# 🚌 AIT Bus Tracking System

A real-time bus tracking application for Adichunchanagiri Institute of Technology with driver authentication and live location updates.

## 🚀 Quick Start (Simple Setup)

### Windows Users
1. **Double-click** `start.bat` 
2. **Wait** for the server to start
3. **Open** http://localhost:5000 in your browser

### Mac/Linux Users
1. **Make executable**: `chmod +x start.sh`
2. **Run**: `./start.sh`
3. **Open** http://localhost:5000 in your browser

### Manual Setup
If the scripts don't work:
```bash
npm install
npm run dev
```

## 📱 How to Use

### For Students
1. Open http://localhost:5000
2. Click **"Student View"** (default)
3. View real-time bus locations on the map
4. Select different buses to track

### For Drivers
1. Open http://localhost:5000
2. Click **"Driver Portal"**
3. **Register** with:
   - Your full name
   - Bus ID (AIT1-AIT7)
   - Route (Bus Stand, Vijaipura, Kote, Hostel)
   - Password (minimum 6 characters)
4. **Login** with your credentials
5. **Allow location access** when prompted
6. Click **"Start Tracking"** to begin broadcasting your location

## 🔧 Requirements

- **Node.js** (version 16 or higher)
- **Modern web browser** with location support
- **Internet connection** for MongoDB Atlas

## 🌐 Database

The app connects to MongoDB Atlas automatically using the configured connection string. All user data and location information is stored securely in the cloud database.

## 📍 Location Features

- **Real-time GPS tracking** for drivers
- **Live map updates** for students
- **Multiple bus routes** support
- **WebSocket communication** for instant updates
- **Location troubleshooting** for common issues

## 🛠 Troubleshooting

### Location Not Working?
1. **Allow location permissions** in your browser
2. **Check GPS** is enabled on your device
3. **Move outdoors** for better signal
4. **Use the troubleshooting guide** in the driver dashboard

### Can't Start Server?
1. **Check Node.js** is installed: `node --version`
2. **Kill existing processes**: `taskkill /F /IM node.exe` (Windows)
3. **Try a different port** if 5000 is busy
4. **Check internet connection** for database access

### Browser Issues?
- **Use modern browsers**: Chrome, Firefox, Safari, Edge
- **Enable JavaScript** and location services
- **Clear browser cache** if experiencing issues

## 📋 Features

✅ **Driver Authentication** - Secure login with JWT tokens  
✅ **Real-time Tracking** - Live GPS location updates  
✅ **Interactive Maps** - Google Maps integration  
✅ **Multiple Routes** - Support for different bus routes  
✅ **WebSocket Communication** - Instant real-time updates  
✅ **Responsive Design** - Works on mobile and desktop  
✅ **Location Troubleshooting** - Built-in help for GPS issues  
✅ **Secure Database** - MongoDB Atlas cloud storage  

## 🏗 Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + Node.js
- **Database**: MongoDB Atlas
- **Real-time**: WebSocket connections
- **Authentication**: JWT with bcrypt encryption
- **Maps**: Google Maps JavaScript API

---

**Need Help?** Check the troubleshooting section in the driver dashboard or ensure location permissions are enabled in your browser.