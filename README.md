# 🧮 React Wages Calculator

A modern **Wages Calculator Web App** built with **React + Vite + Firebase**, designed to make employee wage tracking fast, accurate, and accessible from **any device**.

This version is a complete rebuild of my earlier vanilla JS app — now featuring **cloud storage**, **authentication**, and **cross-device data sync**.

🔗 **Live Demo:** [https://Ezaz-Ahmad.github.io/React-wages-calculator](https://Ezaz-Ahmad.github.io/React-wages-calculator)

---

## 🚀 Features

### 🔐 Firebase Cloud Integration
- **Email/Password Authentication** — secure user login system.
- **Firestore Cloud Database** — replaces `localStorage` for real-time autosave.
- **Per-User Data Isolation** — each user’s wage data is private under their UID.
- **Cross-Device Sync** — automatically loads your saved data on any device after login.
- **Auto-Save & Recovery** — data is saved continuously and restored instantly even after logout or page refresh.

### 🧾 Core Calculator Features
- **Employee Information**
  - Capture date, name, and address.
- **Work Schedule**
  - Add/remove multiple shifts per day.
  - Enable/disable working days using checkboxes.
  - Supports overnight shifts.
- **Rates & Expenses**
  - Separate weekday/weekend rates.
  - Fuel cost, other expenses, and closing balance.
  - Pouch date/day tracking.
- **Wage Calculations**
  - Calculates total hours, expenses, and gross/net wages.
  - Computes remaining wages after closing amount.
- **PDF Export**
  - 2-page professionally formatted report using [pdf-lib](https://pdf-lib.js.org/).
  - Auto-downloads to the user’s device.
- **Real-Time Overlay Loader**
  - Animated wave overlay while generating PDFs.

---

## ☁️ Firebase Setup

This project uses **Firebase Web SDK** for authentication and database.

### Firebase Services Used
- **Firebase Authentication** → Email/Password sign-in  
- **Cloud Firestore** → Real-time data persistence  
- **Firebase Hosting (optional)** → Live deployment support

### 🔒 Sensitive Information Disclaimer
All Firebase configuration keys in this repository are **for testing and demo purposes only**.  
While Firebase web config values are **not secret**, the associated project may be reset or locked at any time.  
Do **not** use these credentials in production or connect them to sensitive data.

If you clone this project:
1. Create your own Firebase project.
2. Enable **Authentication** → Email/Password.
3. Enable **Firestore Database**.
4. Replace credentials in `.env`:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
