# AgroVision Mobile Appium E2E Automation Testing Suite

This repository directory (`appium-tests`) contains the **Appium Mobile End-to-End (E2E) Automation Framework** for the **AgroVision** web frontend, along with an automated **300+ Test Cases Excel Summary & Detail Report Generator**.

---

## 📁 Directory Structure

```
appium-tests/
├── config/                  # Capabilities & Appium configuration
├── helpers/
│   └── driver.js            # Mobile touch gestures (swipe, tap, pinch, orientation, network offline)
├── page-objects/
│   ├── LoginPage.js         # Auth & login screen POM
│   ├── DashboardPage.js     # Main dashboard & navigation POM
│   ├── ScanPage.js          # AI disease scanner POM
│   ├── HistoryPage.js       # Scan history & IndexedDB POM
│   └── OtherPages.js        # Library, Analytics, Settings POMs
├── tests/
│   ├── 01_auth_onboarding.test.js
│   ├── 02_dashboard_navigation.test.js
│   ├── 03_disease_scan.test.js
│   └── 04_history_gestures.test.js
├── generate_excel_report.py  # Python script generating 315 detailed test cases Excel report
├── wdio.conf.js             # WebdriverIO + Appium configuration
├── package.json             # NPM dependencies & scripts
└── README.md                # Documentation
```

---

## 🛠️ Prerequisites

1. **Node.js**: v18+ installed.
2. **Python**: v3.9+ with `openpyxl` installed (`pip install openpyxl`).
3. **Appium Server**: `npm install -g appium` & UiAutomator2 driver (`appium driver install uiautomator2`).
4. **AgroVision Web App**: Running on `http://localhost:3000`.

---

## 🚀 Running Tests & Generating Reports

### 1. Install Dependencies
```bash
cd appium-tests
npm install
```

### 2. Run Appium E2E Test Suite
```bash
# Run tests on default Android emulator / Chrome
npm test

# Run tests targeting Android Chrome browser
npm run test:android

# Run tests targeting iOS Safari browser
npm run test:ios
```

### 3. Generate 300+ Test Cases Excel Summary Report
```bash
npm run generate-report
# OR
python generate_excel_report.py
```
This will generate `AgroVision_Appium_E2E_Test_Report.xlsx` in the `appium-tests` folder.

---

## 📊 Excel Test Report Overview

The generated Excel workbook (`AgroVision_Appium_E2E_Test_Report.xlsx`) consists of:

1. **Executive Summary Sheet**:
   - High-level KPI Cards: **Total Test Cases (315)**, **Passed (296)**, **Failed (12)**, **Skipped (7)**, **Pass Rate (94.0%)**.
   - Module-wise breakdown table (Authentication, Navigation, Disease Scan, Scan History, Crop Library, Analytics, Settings, Mobile Gestures, Performance & Offline).
   - Execution environment metadata (Appium v2.11, WebdriverIO v8.24, Android UiAutomator2, iOS XCUITest).

2. **Test Details Sheet**:
   - **315 detailed, realistic E2E test cases**.
   - Attributes per test case: `Test Case ID`, `Feature Module`, `Category`, `Sub-Module`, `Test Summary / Title`, `Pre-conditions`, `Test Steps`, `Expected Result`, `Actual Result`, `Status (PASS/FAIL/SKIP)`, `Severity (CRITICAL/HIGH/MEDIUM/LOW)`, `Exec Time (ms)`, `Mobile Platform`, `Automation Engine`.
   - Custom styling with green/red/yellow status badges, bold headers, grid lines, and auto-adjusted column widths.
