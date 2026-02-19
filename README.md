# VDerm-X - Veterinary Dermatology Diagnostic System

[![Backend CI](https://github.com/Ahmadinit/VDerm_X_Lumpysum/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Ahmadinit/VDerm_X_Lumpysum/actions/workflows/backend-ci.yml)
[![Frontend CI](https://github.com/Ahmadinit/VDerm_X_Lumpysum/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/Ahmadinit/VDerm_X_Lumpysum/actions/workflows/frontend-ci.yml)
[![Code Quality](https://github.com/Ahmadinit/VDerm_X_Lumpysum/actions/workflows/code-quality.yml/badge.svg)](https://github.com/Ahmadinit/VDerm_X_Lumpysum/actions/workflows/code-quality.yml)

A comprehensive mobile application for veterinary dermatology diagnosis using Machine Learning, featuring AI-powered chat consultations and appointment management.

## 🚀 Quick Start

### Prerequisites

Before running the project, ensure you have:

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **Python** 3.8+ - [Download](https://python.org/)
- **MongoDB Atlas Account** (free) - [Sign up](https://www.mongodb.com/cloud/atlas/register)
- **Google Gemini API Key** - [Get key](https://makersuite.google.com/app/apikey)
- **Expo Go App** on your phone (for testing):
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Setup Instructions

#### 1. Clone the Repository

```bash
git clone https://github.com/Ahmadinit/VDerm_X_Lumpysum.git
cd VDerm_X_Lumpysum
```

#### 2. Backend Setup

```bash
cd backend

# Install Node.js dependencies
npm install

# Install Python dependencies for ML model
cd src/model
pip install tensorflow numpy pillow
cd ../..

# Configure environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API Key
```

**Backend .env Configuration:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/vdermx?retryWrites=true&w=majority
GEMINI_API_KEY=your-gemini-api-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password
```

```bash
# Start backend server
npm run start:dev
# Server will run on http://localhost:3000
```

#### 3. Frontend Setup

```bash
cd VDerm-X

# Install dependencies
npm install

# No .env file needed - config is in src/config.ts
```

**Frontend Configuration (src/config.ts):**

For **Android Emulator**:
```typescript
export const BASE_URL = 'http://10.0.2.2:3000';
```

For **iOS Simulator**:
```typescript
export const BASE_URL = 'http://localhost:3000';
```

For **Physical Device** (same WiFi network):
```typescript
// Find your local IP: ipconfig (Windows) or ifconfig (Mac/Linux)
export const BASE_URL = 'http://192.168.1.100:3000'; // Replace with your IP
```

```bash
# Start Expo development server
npm start

# Press 'a' for Android emulator
# Press 'i' for iOS simulator
# Scan QR code with Expo Go app for physical device
```

### Automated Setup (Windows)

For Windows users, use the automated PowerShell script:

```powershell
.\run-project.ps1
```

This will automatically:
- ✅ Check all prerequisites
- ✅ Install all dependencies (Node.js + Python)
- ✅ Setup Python virtual environment
- ✅ Configure environment variables
- ✅ Start backend server on port 3000
- ✅ Start Expo frontend
- ✅ Display QR code for Expo Go app

### Manual Setup

If you prefer to run commands manually, see [SETUP_COMMANDS.md](SETUP_COMMANDS.md) for detailed step-by-step instructions.

---

## 📋 Prerequisites

Before running the project, ensure you have:

- **Node.js** v18+ - [Download](https://nodejs.org/)
- **Python** 3.8+ - [Download](https://python.org/)
- **MongoDB Atlas Account** (free) - [Sign up](https://www.mongodb.com/cloud/atlas/register)
- **Google Gemini API Key** - [Get key](https://makersuite.google.com/app/apikey)
- **Expo Go App** on your phone:
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

---

## 🏗️ Project Structure

```
VDerm-X-master/
├── backend/                      # NestJS Backend API
│   ├── src/
│   │   ├── user/                # User authentication & management
│   │   ├── vet/                 # Veterinarian management
│   │   ├── appointments/        # Appointment booking system
│   │   ├── diagnosis/           # Diagnosis history
│   │   ├── chat/                # AI chat with Gemini
│   │   ├── ai/                  # Gemini AI service
│   │   ├── image/               # Image upload handling
│   │   └── model/               # TensorFlow ML model
│   ├── .env                     # Environment variables
│   └── requirements.txt         # Python dependencies
│
├── VDerm-X/                     # React Native Frontend (Expo)
│   ├── src/
│   │   ├── Screens/            # All UI screens
│   │   │   ├── launchScreen.tsx
│   │   │   ├── loginScreen.tsx
│   │   │   ├── registerScreen.tsx
│   │   │   ├── homeScreen.tsx
│   │   │   ├── diagnosticScreen.tsx
│   │   │   ├── vetsScreen.tsx
│   │   │   ├── chatsScreen.tsx
│   │   │   └── chatConversationScreen.tsx
│   │   ├── utils/              # Utility functions
│   │   └── config.ts           # Backend URL config
│   └── App.tsx                 # Root component
│
├── run-project.ps1             # Automated setup & run script
├── SETUP_COMMANDS.md           # Detailed manual setup guide
├── BACKEND_API_DOCS.md         # API documentation
├── IMPLEMENTATION_SUMMARY.md   # Development summary
└── README.md                   # This file
```

---

## 🎯 Features

### For Pet Owners (Users)
- 📸 **Image Diagnosis** - Upload pet skin images for ML-powered diagnosis
- 💬 **AI Consultation** - Chat with Gemini AI about diagnosis results
- 👨‍⚕️ **Find Vets** - Search and view veterinarian profiles
- 📅 **Book Appointments** - Schedule appointments with vets
- 📊 **History** - View past diagnoses and consultations

### For Veterinarians (Vets)
- 📋 **Manage Appointments** - View and approve/reject bookings
- 💼 **Professional Profile** - Showcase specialization and availability
- 📞 **Contact Info** - Share contact details with clients
- 🔍 **Client Insights** - View client diagnosis history and concerns

### Technical Features
- 🤖 **Machine Learning** - TensorFlow model for skin disease classification
- 🧠 **AI Integration** - Google Gemini for intelligent chat responses with markdown formatting
- 🔐 **Role-Based Auth** - Separate interfaces for users and vets
- 📱 **Mobile-First** - Built with React Native + Expo
- ☁️ **Cloud Database** - MongoDB Atlas for data storage
- 🔄 **CI/CD** - Automated builds and tests with GitHub Actions
- 💬 **Real-time Chat** - Conversation history with delete functionality
- 🎨 **Modern UI** - Clean interface with visual distinction for chat types

---

## 🔧 Development & CI/CD

### GitHub Actions Workflows

This project includes automated CI/CD pipelines that run on every push:

#### Backend CI (`backend-ci.yml`)
- ✅ Builds and tests backend on Node.js 18.x and 20.x
- ✅ Installs Python dependencies for ML model
- ✅ Runs linting and tests
- ✅ Uploads build artifacts

#### Frontend CI (`frontend-ci.yml`)
- ✅ Builds frontend on Node.js 18.x and 20.x
- ✅ TypeScript type checking
- ✅ Expo prebuild for Android
- ✅ Runs Expo Doctor diagnostics

#### Code Quality (`code-quality.yml`)
- ✅ Security audits for npm packages
- ✅ Secret scanning with TruffleHog
- ✅ Code style checks
- ✅ Format validation

### Setting Up GitHub Secrets

For GitHub Actions to work properly, add these secrets in your repository:

1. Go to: `Settings` → `Secrets and variables` → `Actions`
2. Add the following secrets:
   - `MONGODB_URI` - Your MongoDB Atlas connection string
   - `GEMINI_API_KEY` - Your Google Gemini API key

### Local Development

```bash
# Backend
cd backend
npm run start:dev  # Development mode with hot reload
npm run build      # Production build
npm test           # Run tests

# Frontend
cd VDerm-X
npm start          # Start Expo dev server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
```

---

## 📚 API Documentation
- 🌐 **RESTful API** - NestJS backend with comprehensive endpoints

---

## 🔧 Configuration

### Backend Configuration

Create `backend/.env` with your credentials:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vderm-x?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

### Frontend Configuration

Update `VDerm-X/src/config.ts`:

```typescript
export const BASE_URL = 'http://localhost:3000';  // For development
// Or use your computer's IP for mobile testing:
// export const BASE_URL = 'http://192.168.x.x:3000';
```

---

## 🛠️ Development

### Start Backend

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
npm run start:dev
```

Backend runs on: `http://localhost:3000`

### Start Frontend

```powershell
cd VDerm-X
npx expo start --tunnel
```

Scan the QR code with Expo Go app on your phone.

---

## 📱 Using Expo Go

1. **Install Expo Go** on your phone from App Store or Play Store
2. **Open Expo Go** app
3. **Scan QR Code** displayed in terminal/browser
4. **Wait for app to load** (may take 1-2 minutes first time)
5. **Start testing!**

### Connection Options

- **Tunnel Mode** (recommended for Expo Go):
  ```powershell
  npx expo start --tunnel
  ```
  Works from anywhere, no network config needed.

- **LAN Mode** (faster, requires same WiFi):
  ```powershell
  npx expo start --lan
  ```
  Phone and computer must be on same network.

- **Localhost** (development only):
  ```powershell
  npx expo start
  ```
  Only works on computer, not accessible from phone.

---

## 🧪 Testing

### Test Backend APIs

```powershell
# Register a user
Invoke-RestMethod -Uri http://localhost:3000/user/register -Method POST -ContentType "application/json" -Body '{"username":"testuser","email":"test@example.com","password":"password123","role":"user"}'

# Login
Invoke-RestMethod -Uri http://localhost:3000/user/login -Method POST -ContentType "application/json" -Body '{"email":"test@example.com","password":"password123"}'

# Get vets
Invoke-RestMethod -Uri http://localhost:3000/vets -Method GET
```

### Test Mobile App

1. Register as a user or veterinarian
2. Login with your credentials
3. Upload a pet skin image for diagnosis
4. View the ML prediction results
5. Start a chat about the diagnosis
6. Browse available veterinarians
7. Book an appointment

---

## 📚 API Documentation

See [BACKEND_API_DOCS.md](BACKEND_API_DOCS.md) for complete API reference with all endpoints, request/response formats, and examples.

### Main Endpoints

- **Auth**: `/user/register`, `/user/login`
- **Vets**: `/vets`, `/vets/:id`
- **Diagnosis**: `/images/predicts`, `/diagnosis/user/:userId`
- **Chat**: `/chat/conversations/:userId`, `/chat/messages`
- **Appointments**: `/appointments`, `/appointments/user/:userId`

---

## 🐛 Troubleshooting

### Port Already in Use

```powershell
# Kill process on port 3000
Get-Process -Name node | Where-Object {(Get-NetTCPConnection -OwningProcess $_.Id -ErrorAction SilentlyContinue).LocalPort -eq 3000} | Stop-Process -Force
```

### Python Virtual Environment Issues

```powershell
# Enable script execution
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Recreate virtual environment
Remove-Item -Recurse -Force .venv
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Cannot Connect from Phone

Update `VDerm-X/src/config.ts` with your computer's IP:

```powershell
# Get your IP
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike '*Loopback*' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -First 1).IPAddress
```

Then update `BASE_URL` in config.ts to use that IP.

### Expo Cache Issues

```powershell
cd VDerm-X
npx expo start --clear
```

For more troubleshooting, see [SETUP_COMMANDS.md](SETUP_COMMANDS.md).

---

## 🏥 Tech Stack

### Backend
- **Framework**: NestJS (Node.js)
- **Database**: MongoDB Atlas
- **AI**: Google Gemini Pro
- **ML**: TensorFlow (Python)
- **Image**: Multer for uploads
- **Language**: TypeScript

### Frontend
- **Framework**: React Native
- **Platform**: Expo (SDK 52)
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Image**: Expo ImagePicker
- **Language**: TypeScript

---

## 📦 Dependencies

### Backend Dependencies (npm)
- @nestjs/core, @nestjs/common, @nestjs/platform-express
- @nestjs/mongoose (MongoDB integration)
- @google/generative-ai (Gemini AI)
- multer (file uploads)
- bcrypt (password hashing)

### Backend Dependencies (pip)
- tensorflow==2.20.0
- numpy==1.26.4
- Pillow==10.2.0

### Frontend Dependencies (npm)
- react-native
- expo (SDK 52)
- @react-navigation/native, @react-navigation/stack
- @react-native-async-storage/async-storage
- expo-image-picker
- axios

---

## 🚦 Development Status

### ✅ Completed Features
- [x] User & Vet authentication
- [x] Role-based registration (user/vet)
- [x] ML-powered image diagnosis
- [x] Diagnosis history storage
- [x] AI chat with Gemini (about diagnoses)
- [x] Veterinarian listing & search
- [x] Chat conversation management
- [x] Real-time messaging interface
- [x] Appointment booking system (backend)

### 🚧 In Progress
- [ ] Appointment UI screens (mobile)
- [ ] Appointment management for vets
- [ ] Push notifications

### 🔮 Future Enhancements
- [ ] Real-time chat (WebSocket)
- [ ] Video consultations
- [ ] Payment integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] Prescription management

---

## 📄 License

This project is developed for educational and veterinary diagnostic purposes.

---

## 👥 Team

Developed by the VDerm-X team for improving veterinary dermatology care through AI and ML technology.

---

## 📞 Support

For setup issues or questions:
1. Check [SETUP_COMMANDS.md](SETUP_COMMANDS.md) for detailed instructions
2. Review [BACKEND_API_DOCS.md](BACKEND_API_DOCS.md) for API details
3. See troubleshooting section above

---

**Happy Diagnosing! 🐾**
