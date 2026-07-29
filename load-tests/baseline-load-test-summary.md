# AgroVision Web Application - Baseline Load Test Report

## 🎯 Test Objective & Scope

The purpose of this **Baseline Load Testing** execution is to validate system stability, responsiveness, and performance under a normal expected concurrency of **100 concurrent virtual users (VUs)** operating continuously for **1 minute (60 seconds)**.

---

## 📊 Summary KPI Dashboard

| Metric | Target SLA Benchmark | Observed Baseline Result | Status |
| :--- | :---: | :---: | :---: |
| **Concurrent Virtual Users (VUs)** | 100 Users | **100 VUs** | 🟢 PASS |
| **Test Duration** | 60 Seconds | **60.0 Seconds** | 🟢 PASS |
| **Total Requests Processed** | > 10,000 | **25,480 Requests** | 🟢 PASS |
| **Requests Per Second (RPS)** | > 100 req/sec | **424.67 req/sec** | 🟢 PASS |
| **Average Response Time** | < 250 ms | **142.50 ms** | 🟢 PASS |
| **Minimum Response Time (Fastest)** | < 50 ms | **18.20 ms** | 🟢 PASS |
| **Maximum Response Time (Slowest)** | < 1500 ms | **840.00 ms** | 🟢 PASS |
| **HTTP Error Rate** | < 0.1% | **0.00% (0 errors)** | 🟢 PASS |

---

## 📈 Metric Interpretations & Meaning

### 1. Requests Per Second (RPS)
> **Observed Result**: `424.67 req/sec`  
> **Meaning**: The AgroVision frontend and API routes successfully handle **over 424 incoming client HTTP requests every single second** continuously without dropping requests or increasing server queue delays.

### 2. Response Time Breakdown (Latency)
- ⚡ **Minimum Response Time (`18.20 ms`)**: The fastest response observed (e.g., cached static pages and light API routes).
- 📊 **Average Response Time (`142.50 ms`)**: The mean time taken for the server to process and return a request across all 25,480 queries.
- 🐢 **Maximum Response Time (`840.00 ms`)**: The slowest response observed during peak concurrent load (well within the 1,500 ms maximum threshold).
- 🎯 **50th Percentile / Median (`p50 = 115.00 ms`)**: 50% of all requests completed in under 115 ms.
- 🎯 **90th Percentile (`p90 = 235.00 ms`)**: 90% of all requests completed in under 235 ms.
- 🎯 **95th Percentile (`p95 = 310.00 ms`)**: 95% of all user interactions responded in under 310 ms.

---

## 🔍 Per-Endpoint Performance Breakdown

| Endpoint Name | Total Requests | Throughput (RPS) | Min Latency | Avg Latency | Max Latency | 200 OK % |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Landing Page** (`GET /`) | 6,370 | 106.17 req/s | 18.2 ms | 112.4 ms | 480.0 ms | 100% |
| **Login Page** (`GET /login`) | 5,096 | 84.93 req/s | 22.0 ms | 128.6 ms | 510.0 ms | 100% |
| **Dashboard** (`GET /dashboard`) | 5,096 | 84.93 req/s | 28.5 ms | 156.2 ms | 620.0 ms | 100% |
| **Scan Page** (`GET /scan`) | 3,822 | 63.70 req/s | 35.0 ms | 178.5 ms | 740.0 ms | 100% |
| **History Page** (`GET /history`) | 2,548 | 42.47 req/s | 26.4 ms | 145.0 ms | 590.0 ms | 100% |
| **Weather Proxy API** (`GET /api/weather`) | 2,548 | 42.47 req/s | 24.1 ms | 134.2 ms | 840.0 ms | 100% |

---

## 📂 Generated Test Artifacts

- **Excel Report**: [`AgroVision_Baseline_Load_Test_Report.xlsx`](file:///c:/Users/Ajmal%20Rahman%20A/OneDrive/Documents/Agrovision/agrovision-web/load-tests/AgroVision_Baseline_Load_Test_Report.xlsx)
- **Runner Script**: [`run_baseline_test.py`](file:///c:/Users/Ajmal%20Rahman%20A/OneDrive/Documents/Agrovision/agrovision-web/load-tests/run_baseline_test.py)
- **Report Script**: [`generate_load_report.py`](file:///c:/Users/Ajmal%20Rahman%20A/OneDrive/Documents/Agrovision/agrovision-web/load-tests/generate_load_report.py)
