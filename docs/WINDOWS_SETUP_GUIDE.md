# NutriScan Pro - Windows Development Setup Guide

This comprehensive guide will help you set up your Windows development environment to run, test, and develop the NutriScan Pro React Native application for both Android and iOS platforms.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Required Tools and Versions](#required-tools-and-versions)
3. [Step-by-Step Installation](#step-by-step-installation)
4. [Android Development Setup](#android-development-setup)
5. [iOS Development Setup (macOS Required)](#ios-development-setup-macos-required)
6. [Project Installation](#project-installation)
7. [Running the Application](#running-the-application)
8. [Testing the Application](#testing-the-application)
9. [Troubleshooting](#troubleshooting)
10. [Additional Resources](#additional-resources)

## Prerequisites

- **Windows 10/11** (64-bit)
- **Administrator privileges** for installing software
- **Stable internet connection** for downloading tools and dependencies
- **At least 16GB RAM** (recommended for smooth development)
- **50GB+ free disk space** for all development tools

## Required Tools and Versions

### Core Development Tools

| Tool | Recommended Version | Purpose |
|------|-------------------|---------|
| **Node.js** | 18.18.0 LTS | JavaScript runtime |
| **npm** | 9.8.1+ | Package manager |
| **Git** | 2.42.0+ | Version control |
| **Visual Studio Code** | Latest | Code editor |
| **React Native CLI** | 12.3.0+ | React Native command line |

### Android Development

| Tool | Recommended Version | Purpose |
|------|-------------------|---------|
| **Android Studio** | Flamingo 2022.2.1+ | Android IDE and SDK |
| **Android SDK** | API Level 33 (Android 13) | Android development kit |
| **Android Build Tools** | 33.0.0+ | Build tools |
| **Java Development Kit** | JDK 17 | Java runtime for Android |

### iOS Development (Requires macOS)

| Tool | Recommended Version | Purpose |
|------|-------------------|---------|
| **Xcode** | 15.0+ | iOS IDE and SDK |
| **iOS SDK** | 17.0+ | iOS development kit |
| **CocoaPods** | 1.12.0+ | iOS dependency manager |

### Testing Tools

| Tool | Recommended Version | Purpose |
|------|-------------------|---------|
| **Jest** | 29.2.1+ | Unit testing framework |
| **Detox** | 20.13.5+ | E2E testing framework |

## Step-by-Step Installation

### 1. Install Node.js and npm

1. **Download Node.js LTS**:
   - Visit [https://nodejs.org/](https://nodejs.org/)
   - Download the **LTS version (18.18.0)**
   - Choose the Windows Installer (.msi) for your system (x64)

2. **Install Node.js**:
   - Run the downloaded installer
   - Follow the installation wizard
   - ✅ Check "Automatically install the necessary tools" option
   - Complete the installation

3. **Verify Installation**:
   ```cmd
   node --version
   # Should output: v18.18.0 (or similar)
   
   npm --version
   # Should output: 9.8.1 (or similar)
   ```

### 2. Install Git

1. **Download Git**:
   - Visit [https://git-scm.com/download/win](https://git-scm.com/download/win)
   - Download the latest version

2. **Install Git**:
   - Run the installer
   - Use recommended settings
   - Choose "Git from the command line and also from 3rd-party software"
   - Choose "Use the OpenSSL library"
   - Choose "Checkout Windows-style, commit Unix-style line endings"

3. **Verify Installation**:
   ```cmd
   git --version
   # Should output: git version 2.42.0 (or similar)
   ```

### 3. Install Visual Studio Code

1. **Download VS Code**:
   - Visit [https://code.visualstudio.com/](https://code.visualstudio.com/)
   - Download for Windows

2. **Install VS Code**:
   - Run the installer
   - ✅ Check "Add to PATH"
   - ✅ Check "Register Code as an editor for supported file types"

3. **Install Recommended Extensions**:
   - React Native Tools
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - ESLint
   - TypeScript and JavaScript Language Features

### 4. Install Java Development Kit (JDK)

1. **Download JDK 17**:
   - Visit [https://adoptium.net/](https://adoptium.net/)
   - Download **Eclipse Temurin JDK 17** for Windows x64

2. **Install JDK**:
   - Run the installer
   - Note the installation path (usually `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot\`)

3. **Set Environment Variables**:
   - Open **System Properties** → **Advanced** → **Environment Variables**
   - Add new **System Variable**:
     - Variable name: `JAVA_HOME`
     - Variable value: `C:\Program Files\Eclipse Adoptium\jdk-17.x.x.x-hotspot\`
   - Edit **Path** variable and add: `%JAVA_HOME%\bin`

4. **Verify Installation**:
   ```cmd
   java -version
   # Should output: openjdk version "17.x.x"
   
   javac -version
   # Should output: javac 17.x.x
   ```

## Android Development Setup

### 1. Install Android Studio

1. **Download Android Studio**:
   - Visit [https://developer.android.com/studio](https://developer.android.com/studio)
   - Download Android Studio Flamingo or later

2. **Install Android Studio**:
   - Run the installer
   - Choose "Standard" installation
   - Accept all license agreements
   - Wait for the initial setup to complete

### 2. Configure Android SDK

1. **Open Android Studio**:
   - Start Android Studio
   - Go to **File** → **Settings** (or **Configure** → **Settings** from welcome screen)

2. **Install SDK Components**:
   - Navigate to **Appearance & Behavior** → **System Settings** → **Android SDK**
   - In **SDK Platforms** tab, install:
     - ✅ Android 13 (API Level 33)
     - ✅ Android 12 (API Level 31)
     - ✅ Android 11 (API Level 30)
   - In **SDK Tools** tab, install:
     - ✅ Android SDK Build-Tools 33.0.0
     - ✅ Android Emulator
     - ✅ Android SDK Platform-Tools
     - ✅ Intel x86 Emulator Accelerator (HAXM installer)

3. **Set Environment Variables**:
   - Add new **System Variable**:
     - Variable name: `ANDROID_HOME`
     - Variable value: `C:\Users\%USERNAME%\AppData\Local\Android\Sdk`
   - Edit **Path** variable and add:
     - `%ANDROID_HOME%\platform-tools`
     - `%ANDROID_HOME%\emulator`
     - `%ANDROID_HOME%\tools`
     - `%ANDROID_HOME%\tools\bin`

4. **Verify Installation**:
   ```cmd
   adb version
   # Should output: Android Debug Bridge version
   ```

### 3. Create Android Virtual Device (AVD)

1. **Open AVD Manager**:
   - In Android Studio: **Tools** → **AVD Manager**

2. **Create New AVD**:
   - Click **Create Virtual Device**
   - Choose **Phone** → **Pixel 4** (or similar)
   - Select **API Level 33** system image
   - Choose **x86_64** architecture for better performance
   - Name your AVD (e.g., "Pixel_4_API_33")
   - Click **Finish**

3. **Test AVD**:
   - Click the **Play** button next to your AVD
   - Wait for the emulator to boot up

### 4. Enable Developer Options on Physical Device (Optional)

If you want to test on a real Android device:

1. **Enable Developer Options**:
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
   - Go back to **Settings** → **Developer Options**
   - Enable **USB Debugging**

2. **Connect Device**:
   - Connect your device via USB
   - Accept the debugging prompt on your device
   - Verify connection: `adb devices`

## iOS Development Setup (macOS Required)

**⚠️ Important**: iOS development requires a macOS machine. You have several options:

### Option 1: Use a Mac (Recommended)

If you have access to a Mac:

1. **Install Xcode**:
   - Download from Mac App Store
   - Install Xcode 15.0 or later

2. **Install Command Line Tools**:
   ```bash
   xcode-select --install
   ```

3. **Install CocoaPods**:
   ```bash
   sudo gem install cocoapods
   ```

### Option 2: macOS Virtual Machine (Advanced)

**⚠️ Legal Notice**: Check Apple's Software License Agreement before proceeding.

1. **VMware Workstation Pro** or **VirtualBox**
2. **macOS Monterey/Ventura ISO**
3. **Minimum 8GB RAM allocated to VM**
4. **100GB+ disk space**

### Option 3: Cloud-based macOS (Paid Services)

- **MacStadium**: Cloud Mac rental
- **AWS EC2 Mac Instances**: Amazon's Mac cloud service
- **MacinCloud**: Virtual Mac rental

### Option 4: React Native for Web (Alternative)

For testing purposes, you can run the app in a web browser:

```bash
npm install react-native-web
npx expo start --web
```

## Project Installation

### 1. Clone the Repository

```cmd
# Navigate to your development folder
cd C:\Development

# Clone the repository
git clone https://github.com/aniket-shopoholic/Nutriscan.git

# Navigate to project directory
cd Nutriscan
```

### 2. Install Dependencies

```cmd
# Install Node.js dependencies
npm install

# For iOS (if on macOS)
cd ios && pod install && cd ..
```

### 3. Configure Environment Variables

1. **Copy Environment Template**:
   ```cmd
   copy .env.example .env
   ```

2. **Edit `.env` file** with your API keys:
   ```env
   # Firebase Configuration
   FIREBASE_API_KEY=your_firebase_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id

   # Stripe Configuration
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key

   # AWS Configuration
   AWS_ACCESS_KEY_ID=your_aws_access_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret_key
   AWS_REGION=us-east-1
   ```

### 4. Install React Native CLI

```cmd
npm install -g @react-native-community/cli
```

## Running the Application

### Android

1. **Start Metro Bundler**:
   ```cmd
   npm start
   ```

2. **In a new terminal, run Android app**:
   ```cmd
   # Make sure Android emulator is running or device is connected
   npm run android
   ```

3. **Alternative method**:
   ```cmd
   npx react-native run-android
   ```

### iOS (macOS only)

1. **Start Metro Bundler**:
   ```bash
   npm start
   ```

2. **In a new terminal, run iOS app**:
   ```bash
   npm run ios
   ```

3. **Alternative method**:
   ```bash
   npx react-native run-ios
   ```

### Web (Alternative)

```cmd
npm run web
```

## Testing the Application

### Unit Tests

```cmd
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Android)

1. **Build the app for testing**:
   ```cmd
   npm run test:e2e:build
   ```

2. **Run E2E tests**:
   ```cmd
   npm run test:e2e
   ```

### Linting and Type Checking

```cmd
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Metro Bundler Issues

**Problem**: Metro bundler fails to start or shows caching issues.

**Solution**:
```cmd
# Clear Metro cache
npm start -- --reset-cache

# Or use the clean script
npm run clean
```

#### 2. Android Build Failures

**Problem**: Android build fails with SDK or Gradle issues.

**Solutions**:
```cmd
# Clean Android build
npm run clean:android

# Rebuild
npm run android
```

**Check**:
- Ensure `ANDROID_HOME` is set correctly
- Verify Android SDK is installed
- Check Java version is JDK 17

#### 3. iOS Build Failures (macOS)

**Problem**: iOS build fails with CocoaPods or Xcode issues.

**Solutions**:
```bash
# Clean iOS build
npm run clean:ios

# Reinstall pods
cd ios && pod deintegrate && pod install && cd ..

# Rebuild
npm run ios
```

#### 4. Node.js Version Issues

**Problem**: Compatibility issues with Node.js version.

**Solution**:
```cmd
# Check Node version
node --version

# If wrong version, reinstall Node.js 18.18.0 LTS
```

#### 5. Permission Issues

**Problem**: Permission denied errors on Windows.

**Solutions**:
- Run Command Prompt as Administrator
- Check antivirus software isn't blocking files
- Ensure proper folder permissions

#### 6. Emulator Performance Issues

**Problem**: Android emulator is slow or unresponsive.

**Solutions**:
- Enable Hardware Acceleration (HAXM)
- Allocate more RAM to emulator
- Use x86_64 system images
- Close unnecessary applications

### Environment Verification Script

Create a file `verify-setup.js` in your project root:

```javascript
const { execSync } = require('child_process');

const commands = [
  'node --version',
  'npm --version',
  'git --version',
  'java -version',
  'adb version',
];

console.log('🔍 Verifying development environment...\n');

commands.forEach(cmd => {
  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(`✅ ${cmd}:`);
    console.log(`   ${output.split('\n')[0]}\n`);
  } catch (error) {
    console.log(`❌ ${cmd}: Not found or error\n`);
  }
});

console.log('🎉 Environment verification complete!');
```

Run it with:
```cmd
node verify-setup.js
```

## Additional Resources

### Documentation

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stripe Documentation](https://stripe.com/docs)

### Useful Commands Reference

```cmd
# Project commands
npm start                    # Start Metro bundler
npm run android             # Run on Android
npm run ios                 # Run on iOS (macOS only)
npm test                    # Run unit tests
npm run lint                # Run ESLint
npm run type-check          # TypeScript type checking

# React Native commands
npx react-native doctor     # Check environment
npx react-native info       # Show environment info
npx react-native clean      # Clean project

# Android commands
adb devices                 # List connected devices
adb logcat                  # View Android logs
adb reverse tcp:8081 tcp:8081  # Port forwarding

# iOS commands (macOS only)
xcrun simctl list devices   # List iOS simulators
npx react-native log-ios   # View iOS logs
```

### Performance Tips

1. **Use Release Builds for Testing**:
   ```cmd
   npm run android:release
   npm run ios:release
   ```

2. **Enable Hermes** (already configured in project):
   - Improves app startup time
   - Reduces memory usage

3. **Optimize Images**:
   - Use WebP format when possible
   - Compress images before adding to project

4. **Monitor Bundle Size**:
   ```cmd
   npm run analyze:bundle
   ```

### Getting Help

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Search existing GitHub issues**: [Project Issues](https://github.com/aniket-shopoholic/Nutriscan/issues)
3. **Create a new issue** with:
   - Your operating system and version
   - Node.js and npm versions
   - Complete error message
   - Steps to reproduce the issue

---

**Happy Coding! 🚀**

This setup guide should get you up and running with the NutriScan Pro React Native application on your Windows machine. Remember that iOS development will require access to a macOS environment, but you can fully develop and test the Android version on Windows.

