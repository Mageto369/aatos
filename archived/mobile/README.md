# AATOS Mobile App

React Native mobile application for AATOS trade infrastructure platform.

## Features

- **RFQ Management** — Browse and respond to RFQs
- **Deal Tracking** — View deal details, milestones, and status
- **Messaging** — Real-time messaging with trade partners
- **Profile** — Account management and settings

## Tech Stack

- React Native 0.73+
- TypeScript
- React Navigation 6
- Zustand (state management)
- Axios (API client)

## Getting Started

```bash
# Install dependencies
npm install

# iOS (requires macOS + Xcode)
npx pod-install
cd ios && xcodebuild -workspace AatosMobile.xcworkspace -scheme AatosMobile

# Android
npm run android

# Start Metro bundler
npm start
```

## Project Structure

```
src/
  navigation/     — React Navigation setup
  screens/        — Screen components
  components/     — Reusable UI components
  services/       — API clients
  store/          — Zustand stores
  types/          — TypeScript types
```

## Environment

Update `src/services/api.ts` to point to the correct API base URL:

- Development: `http://localhost:3000/v1`
- Production: `https://api.aatos.io/v1`

## Roadmap

- [ ] Push notifications
- [ ] Offline support
- [ ] Biometric authentication
- [ ] Document upload
- [ ] Barcode scanning for inventory
