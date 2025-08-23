# 🧭 NaviQ - Indoor Navigation PWA

NaviQ is a Progressive Web App (PWA) built with Vite + React + TailwindCSS for AI-powered indoor navigation. The app features QR code scanning, interactive maps, voice-enabled AI chatbot, and modern mobile-first design.

## ✨ Features

- 📱 **Mobile-First PWA** - Installable on any device
- 🔐 **Authentication** - Secure login/signup with Appwrite
- 📷 **QR Scanner** - Instant location detection
- 🗺️ **Interactive Maps** - Real-time navigation with Leaflet
- 🤖 **AI Assistant** - Voice-enabled chatbot for navigation help
- 🎨 **Modern UI** - Black & blue gradient theme with Tailwind CSS
- 🔄 **Offline Support** - Service worker for offline functionality

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Appwrite account (optional for auth)

### Installation

1. **Clone and install dependencies:**

   ```bash
   cd UserFrontend
   npm install --legacy-peer-deps
   ```

2. **Environment setup:**
   The `.env` file is already configured with Appwrite credentials.

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Open in browser:**
   Navigate to `http://localhost:5175`

## 📂 Project Structure

```
UserFrontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx      # Bottom navigation
│   │   ├── QRScanner.jsx   # QR code scanning
│   │   ├── MapView.jsx     # Interactive map
│   │   ├── AIBot.jsx       # Floating AI assistant
│   │   └── ChatBox.jsx     # Chat interface
│   ├── pages/              # Application pages
│   │   ├── LoginPage.jsx   # Authentication
│   │   ├── HomePage.jsx    # Main dashboard
│   │   ├── QRPage.jsx      # QR scanning
│   │   ├── MapPage.jsx     # Full map view
│   │   ├── ChatPage.jsx    # AI chat
│   │   └── ProfilePage.jsx # User profile
│   ├── contexts/           # React contexts
│   │   └── AuthContext.jsx # Authentication state
│   ├── lib/                # Configuration
│   │   └── appwrite.js     # Appwrite setup
│   └── styles/
│       └── index.css       # Tailwind + custom styles
```

## 🎯 User Flow

1. **Login/Signup** - Secure authentication
2. **QR Scan** - Scan location QR codes
3. **Navigation** - Interactive map with route guidance
4. **AI Assistant** - Voice & text chat for help
5. **Profile** - User preferences and settings

## 🎨 Design System

- **Primary Colors:** Blue gradient (#3B82F6 → #1E40AF)
- **Background:** Dark gradient (#0F172A → #1E3A8A)
- **Accent:** Green (#22C55E) for success states
- **Typography:** System fonts with modern weights
- **Components:** Glass-morphism cards with backdrop blur

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM
- **Auth:** Appwrite
- **Maps:** Leaflet + React-Leaflet
- **QR Scanner:** html5-qrcode
- **Icons:** React Icons (Heroicons v2)
- **PWA:** Vite PWA Plugin
- **Voice:** Web Speech API

## 📱 PWA Features

- **Installable:** Add to home screen on mobile/desktop
- **Offline:** Service worker caching for offline usage
- **App-like:** Standalone display mode
- **Fast:** Optimized loading and navigation
- **Responsive:** Mobile-first responsive design

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Components

1. **AuthContext** - Manages user authentication state
2. **ProtectedRoute** - Route guard for authenticated users
3. **QRScanner** - Camera-based QR code scanning
4. **MapView** - Interactive map with navigation
5. **ChatBox** - AI assistant with voice support

## 🌟 Demo Features

- **Demo Login:** Use `demo@naviq.app` / `demo12345`
- **QR Simulation:** Built-in QR code simulation
- **Voice Chat:** Speech recognition and synthesis
- **Offline Mode:** Cached assets work offline
- **Installation:** Install as PWA on any device

## 🔮 Future Enhancements

- Real-time positioning with indoor GPS
- 3D floor plans and AR navigation
- Multi-language support
- Advanced AI features
- Real-time collaboration
- Analytics dashboard

## 📄 License

MIT License - feel free to use for your projects!

---

**NaviQ** - Making indoor navigation intelligent and accessible! 🧭✨+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
