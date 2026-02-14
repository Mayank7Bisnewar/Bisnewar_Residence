# BISNEWAR RESIDENCE

A powerful and professional rent management application designed to handle tenants, billing, and WhatsApp messaging with ease.

## Technologies Used

This project is built using:
- **Language**: TypeScript
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **Mobile Integration**: Capacitor
<p align="left"> <a href="https://www.python.org" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/python/python-original.svg" alt="python" width="40" height="40"/> </a> <a href="https://reactjs.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original-wordmark.svg" alt="react" width="40" height="40"/> </a> <a href="https://reactnative.dev/" target="_blank" rel="noreferrer"> <img src="https://reactnative.dev/img/header_logo.svg" alt="reactnative" width="40" height="40"/> </a> <a href="https://tailwindcss.com/" target="_blank" rel="noreferrer"> <img src="https://www.vectorlogo.zone/logos/tailwindcss/tailwindcss-icon.svg" alt="tailwind" width="40" height="40"/> </a> <a href="https://www.typescriptlang.org/" target="_blank" rel="noreferrer"> <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="typescript" width="40" height="40"/> </a> </p>
---

## Getting Started

### 1. Run the Application (Local Dev)
To start the development server and view the app in your browser:
```bash
npm run dev
```
The application will usually be available at `http://localhost:8080`.

### 2. Save Changes & Build Web Assets
To prepare the application for production or native sync:
```bash
npm run build
```

### 3. Update & Build Android APK
Follow these steps to generate a new APK file after making changes:

**Step 1: Sync changes with Android project**
```bash
npx cap sync android
```

**Step 2: Build the APK**
Navigate to the android directory and run the Gradle build.
```bash
cd android
```

Create the configuration file(First time setup or SKIP)
```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
```
**Step 3: Note: Requires Java 21**
```bash
JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleDebug
```

The generated APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

