---
pdf_options:
  format: A4
  margin: 20mm
  displayHeaderFooter: true
  headerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888;">Tenant App — Project Overview</div>'
  footerTemplate: '<div style="font-size:8px;width:100%;text-align:center;color:#888;">Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>'
stylesheet: []
---

# Tenant App — Full Project Overview

## Architecture at a Glance

This is a **serverless, mobile-first** app built with a React frontend that talks directly to **Firebase** (no custom backend server). It's packaged as an **Android APK** via Capacitor.

```
┌──────────────────────────────────────────────────────────┐
│                  FRONTEND (Client-Side)                  │
│  ┌──────────────────────────────────────────────────┐    │
│  │  React 18 + TypeScript + Vite                    │    │
│  │  Tailwind CSS + shadcn/ui                        │    │
│  │  Capacitor 8 (Android Shell)                     │    │
│  └──────────┬───────────────────────────┬───────────┘    │
└─────────────┼───────────────────────────┼────────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐  ┌─────────────────────────────┐
│  BACKEND (Firebase BaaS)│  │  EXTERNAL INTEGRATIONS      │
│  ┌───────────────────┐  │  │  ┌─────────────────────┐    │
│  │ Firebase Auth      │  │  │  │ WhatsApp Deep Links │    │
│  │ Cloud Firestore    │  │  │  │ Google Sheets API   │    │
│  │ Firebase Analytics │  │  │  │ Google AdMob        │    │
│  │ Firebase App Check │  │  │  │ Google Auth Native  │    │
│  └───────────────────┘  │  │  └─────────────────────┘    │
└─────────────────────────┘  └─────────────────────────────┘
```

---

## 🎨 Frontend

### Tech Stack

| Layer          | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | **React 18** (TypeScript)                       |
| Build Tool     | **Vite**                                        |
| Styling        | **Tailwind CSS** + **shadcn/ui** (Radix)        |
| State          | React Context + `useLocalStorage`               |
| Routing        | **React Router v6**                             |
| Data Fetching  | **TanStack React Query**                        |
| Animation      | **Framer Motion** + **React Spring**            |
| Mobile Shell   | **Capacitor 8** (Android)                       |

### Pages (4 Routes)

| Route      | File                   | Purpose                                             |
| ---------- | ---------------------- | --------------------------------------------------- |
| `/`        | `pages/Index.tsx`      | Main landlord dashboard — tenant list, billing      |
| `/login`   | `pages/Login.tsx`      | Auth screen (Google, Email, Guest, Tenant access)   |
| `/tenant`  | `pages/TenantDashboard.tsx` | Public tenant view (read-only via access key)  |
| `*`        | `pages/NotFound.tsx`   | 404 page                                            |

### Key Components (16 Custom)

| Component        | File                     | What It Does                                     |
| ---------------- | ------------------------ | ------------------------------------------------ |
| TenantList       | `TenantList.tsx`         | Main tenant listing with selection, reordering   |
| TenantDirectory  | `TenantDirectory.tsx`    | Complete tenant directory/management view         |
| Settings         | `Settings.tsx`           | Owner info, message templates, Sheets URL        |
| BillSummary      | `BillSummary.tsx`        | Bill preview with WhatsApp send & payment record |
| TenantForm       | `TenantForm.tsx`         | Add/Edit tenant form                             |
| HistoryView      | `HistoryView.tsx`        | Payment history for a tenant                     |
| ElectricityTab   | `ElectricityTab.tsx`     | Electricity unit input & calculation             |
| WaterBillTab     | `WaterBillTab.tsx`       | Water bill input                                 |
| RoomRentTab      | `RoomRentTab.tsx`        | Room rent display                                |
| ExtraChargesTab  | `ExtraChargesTab.tsx`    | Extra charges input                              |
| BillingDateTab   | `BillingDateTab.tsx`     | Billing date picker                              |
| BottomNavigation | `BottomNavigation.tsx`   | Mobile bottom nav bar                            |
| UserMenu         | `UserMenu.tsx`           | User profile dropdown                            |
| AuthButton       | `AuthButton.tsx`         | Login/logout button                              |
| AdBanner         | `AdBanner.tsx`           | AdMob banner ad wrapper                          |
| NavLink          | `NavLink.tsx`            | Navigation link component                        |

### State Management

Two React Contexts drive the entire app:

1. **AuthContext** (`context/AuthContext.tsx`) — Handles 4 login methods:
   - Google Sign-In (popup on web, native on Android via Capacitor plugin)
   - Email/Password (Firebase Auth)
   - Guest mode (localStorage flag)
   - Tenant Access Key (read-only tenant dashboard)

2. **BillingContext** (`context/BillingContext.tsx`) — Core business logic:
   - Tenant CRUD (add, update, soft-delete, permanent-delete, reorder)
   - Per-tenant billing state (electricity units, extra charges, billing date)
   - Bill calculation: `rent + (electricity × rate) + water + extras`
   - Payment history management
   - WhatsApp message generation with customizable templates
   - Real-time Firestore sync with conflict resolution

### Custom Hooks (6)

| Hook                | File                     | Purpose                                |
| ------------------- | ------------------------ | -------------------------------------- |
| `useTenants`        | `hooks/useTenants.ts`    | Tenant CRUD with dual sync             |
| `useLocalStorage`   | `hooks/useLocalStorage.ts` | Generic localStorage wrapper         |
| `useOwnerInfo`      | `hooks/useOwnerInfo.ts`  | Owner name, UPI, mobile, elec rate     |
| `useMessageSettings`| `hooks/useMessageSettings.ts` | WhatsApp message template prefs   |
| `use-mobile`        | `hooks/use-mobile.tsx`   | Mobile viewport detection              |
| `use-toast`         | `hooks/use-toast.ts`     | Toast notification hook                |

---

## ⚙️ Backend (Firebase — No Custom Server)

> **Important:** There is **no custom backend server**. The app uses Firebase as a
> Backend-as-a-Service (BaaS). All business logic runs on the client.

### Firebase Services Used

| Service              | Purpose                          | Config File               |
| -------------------- | -------------------------------- | ------------------------- |
| Firebase Auth        | User authentication              | `lib/firebase.ts`         |
| Cloud Firestore      | Real-time database               | `lib/firestoreService.ts` |
| Firebase Analytics   | Usage tracking                   | `lib/firebase.ts`         |
| Firebase App Check   | Bot protection (ReCaptcha)       | `lib/firebase.ts`         |

### Firestore Data Model

```
┌──────────────────────────────────────────────────────────┐
│  Collection: users/{uid}                                 │
│  ─────────────────────────────────────────────────────   │
│  • tenants[]        → Array of Tenant objects            │
│  • billingState{}   → Map: tenantId → billing state      │
│                                                          │
│           │ publishes (auto-sync, 2s debounce)           │
│           ▼                                              │
│  Collection: public_tenant_views/{tenantId}              │
│  ─────────────────────────────────────────────────────   │
│  • landlordUid      → Owner reference                   │
│  • billData         → Current bill snapshot              │
│  • paymentHistory[] → Payment records                    │
│  • ownerName        → Landlord name                     │
│  • ownerUpiId       → UPI for payment                   │
└──────────────────────────────────────────────────────────┘
```

### Security Rules (`firestore.rules`)

| Collection              | Read                     | Write                          |
| ----------------------- | ------------------------ | ------------------------------ |
| `users/{userId}`        | Only matching auth UID   | Only matching auth UID         |
| `public_tenant_views/*` | Anyone (with key)        | Only the owning landlord       |
| Everything else         | **Denied**               | **Denied**                     |

### Data Sync Strategy

The app uses a **local-first with cloud sync** approach:

1. Data is always saved to **localStorage** first (works offline / guest mode)
2. If the user is logged in, data is **also synced to Firestore** in real-time
3. On first login, if Firestore is empty but localStorage has data → **uploads local to cloud** (migration)
4. After initial sync, **Firestore takes precedence** (real-time listener via `onSnapshot`)

---

## 🔌 External Integrations

### 1. WhatsApp Messaging
- Generates formatted bill messages using customizable templates
- Opens via `whatsapp://send?phone=91{number}&text={message}` deep link
- Template includes: rent, electricity, water, extras, total, landlord info

### 2. Google Sheets (`services/GoogleSheetsService.ts`)
- User deploys a Google Apps Script as a web app
- App POSTs payment records to the script URL
- Used for ledger/accounting backup outside the app

### 3. Google AdMob (`lib/admob.ts`)
- **Banner ads** at the bottom of the screen
- **Interstitial ads** on app open (10s delay) and after login
- Real ad unit IDs configured for Android
- Only runs on native (Capacitor), skipped on web

### 4. Google Auth (Native)
- Uses `@codetrix-studio/capacitor-google-auth` for native Android sign-in
- Falls back to `signInWithPopup` on web

---

## 📱 Mobile / Android

| Aspect       | Details                                               |
| ------------ | ----------------------------------------------------- |
| Platform     | Android (via **Capacitor 8**)                         |
| App ID       | `com.tenant`                                          |
| Build        | Gradle (`assembleDebug`), requires Java 21            |
| APK Output   | `android/app/build/outputs/apk/debug/app-debug.apk`  |
| Native Plugins | AdMob, Google Auth, Contacts, Haptics, Notifications |

---

## Summary Table

| Aspect          | Technology                                              |
| --------------- | ------------------------------------------------------- |
| Frontend        | React 18 + TypeScript + Vite + Tailwind + shadcn/ui    |
| Backend         | Firebase (Auth, Firestore, Analytics, App Check)        |
| Database        | Cloud Firestore (2 collections)                         |
| Mobile          | Capacitor 8 → Android APK                              |
| Monetization    | Google AdMob (banner + interstitial)                    |
| Messaging       | WhatsApp deep links                                     |
| Data Export     | Google Sheets via Apps Script                           |
| Auth Methods    | Google, Email/Password, Guest, Tenant Access Key        |
