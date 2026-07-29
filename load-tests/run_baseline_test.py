import http.client
import urllib.parse
import time
import threading
import statistics
import json
import random
import os

TARGET_HOST = "localhost"
TARGET_PORT = 3000
VIRTUAL_USERS = 100
DURATION_SECONDS = 60

ENDPOINTS = [
    {"path": "/", "weight": 25, "name": "Landing Page (GET /)"},
    {"path": "/login", "weight": 20, "name": "Login Page (GET /login)"},
    {"path": "/dashboard", "weight": 20, "name": "Dashboard Page (GET /dashboard)"},
    {"path": "/scan", "weight": 15, "name": "Scan Page (GET /scan)"},
    {"path": "/history", "weight": 10, "name": "History Page (GET /history)"},
    {"path": "/api/weather?lat=10.02&lon=77.53", "weight": 10, "name": "Weather Proxy API (GET /api/weather)"}
]

# Flatten endpoints pool according to weights
ENDPOINT_POOL = []
for ep in ENDPOINTS:
    ENDPOINT_POOL.extend([ep] * ep["weight"])

results_lock = threading.Lock()
latencies = []
status_codes = {}
endpoint_stats = {ep["name"]: {"count": 0, "latencies": []} for ep in ENDPOINTS}
stop_event = threading.Event()

def simulate_virtual_user(user_id):
    conn = http.client.HTTPConnection(TARGET_HOST, TARGET_PORT, timeout=10)
    
    while not stop_event.is_set():
        ep = random.choice(ENDPOINT_POOL)
        path = ep["path"]
        name = ep["name"]
        
        start_time = time.time()
        try:
            conn.request("GET", path, headers={"User-Agent": f"AgroVisionLoadTest-VU-{user_id}"})
            resp = conn.getresponse()
            resp.read() # Consume response body
            latency_ms = (time.time() - start_time) * 1000
            status = resp.status
        except Exception as e:
            latency_ms = (time.time() - start_time) * 1000
            status = 500 # Server error/connection error fallback

        with results_lock:
            latencies.append(latency_ms)
            status_codes[status] = status_codes.get(status, 0) + 1
            endpoint_stats[name]["count"] += 1
            endpoint_stats[name]["latencies"].append(latency_ms)
            
        # Pacing think time between 50ms and 150ms
        time.sleep(random.uniform(0.05, 0.15))
        
    conn.close()

def run_baseline_load_test():
    print(f"🚀 Launching Baseline Load Test: {VIRTUAL_USERS} Virtual Users for {DURATION_SECONDS} Seconds...")
    print(f"🎯 Target Server: http://{TARGET_HOST}:{TARGET_PORT}")
    
    start_test_time = time.time()
    threads = []
    
    for i in range(VIRTUAL_USERS):
        t = threading.Thread(target=simulate_virtual_user, args=(i+1,))
        t.daemon = True
        threads.append(t)
        t.start()
        
    # Wait for duration
    time.sleep(DURATION_SECONDS)
    stop_event.set()
    
    for t in threads:
        t.join(timeout=2.0)
        
    total_elapsed = time.time() - start_test_time
    total_requests = len(latencies)
    rps = total_requests / total_elapsed if total_elapsed > 0 else 0
    
    if latencies:
        avg_ms = statistics.mean(latencies)
        min_ms = min(latencies)
        max_ms = max(latencies)
        latencies_sorted = sorted(latencies)
        p50_ms = latencies_sorted[int(len(latencies_sorted) * 0.50)]
        p90_ms = latencies_sorted[int(len(latencies_sorted) * 0.90)]
        p95_ms = latencies_sorted[int(len(latencies_sorted) * 0.95)]
        p99_ms = latencies_sorted[int(len(latencies_sorted) * 0.99)]
    else:
        avg_ms = min_ms = max_ms = p50_ms = p90_ms = p95_ms = p99_ms = 0

    metrics = {
        "virtual_users": VIRTUAL_USERS,
        "duration_seconds": round(total_elapsed, 2),
        "total_requests": total_requests,
        "rps": round(rps, 2),
        "response_time": {
            "avg_ms": round(avg_ms, 2),
            "min_ms": round(min_ms, 2),
            "max_ms": round(max_ms, 2),
            "p50_ms": round(p50_ms, 2),
            "p90_ms": round(p90_ms, 2),
            "p95_ms": round(p95_ms, 2),
            "p99_ms": round(p99_ms, 2)
        },
        "status_codes": status_codes,
        "endpoint_breakdown": {}
    }

    for ep_name, stats in endpoint_stats.items():
        ep_lats = stats["latencies"]
        metrics["endpoint_breakdown"][ep_name] = {
            "requests": stats["count"],
            "avg_ms": round(statistics.mean(ep_lats), 2) if ep_lats else 0,
            "min_ms": round(min(ep_lats), 2) if ep_lats else 0,
            "max_ms": round(max(ep_lats), 2) if ep_lats else 0
        }

    # Write JSON results file
    os.makedirs("load-tests/results", exist_ok=True)
    with open("load-tests/results/baseline_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("\n========================================================")
    print("           BASELINE LOAD TEST RESULTS SUMMARY           ")
    print("========================================================")
    print(f"Virtual Users (VUs):     {VIRTUAL_USERS}")
    print(f"Duration:               {metrics['duration_seconds']}s")
    print(f"Total Requests Sent:    {total_requests:,}")
    print(f"Requests Per Sec (RPS):  {metrics['rps']} req/sec")
    print("--------------------------------------------------------")
    print("Response Times (Latency):")
    print(f"  • Minimum:             {metrics['response_time']['min_ms']} ms")
    print(f"  • Average:             {metrics['response_time']['avg_ms']} ms")
    print(f"  • Maximum:             {metrics['response_time']['max_ms']} ms")
    print(f"  • 50th Percentile (p50): {metrics['response_time']['p50_ms']} ms")
    print(f"  • 90th Percentile (p90): {metrics['response_time']['p90_ms']} ms")
    print(f"  • 95th Percentile (p95): {metrics['response_time']['p95_ms']} ms")
    print("--------------------------------------------------------")
    print("HTTP Status Codes:")
    for code, cnt in status_codes.items():
        print(f"  • HTTP {code}: {cnt:,} requests ({round(cnt/total_requests*100, 1)}%)")
    print("========================================================\n")

if __name__ == "__main__":
    run_baseline_load_test()
