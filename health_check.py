"""
Health check script for Splitwise Clone application
"""

import requests
import time
import sys

def check_service(name, url, timeout=30):
    """Check if a service is healthy"""
    print(f"🔍 Checking {name}...")
    
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {name} is healthy")
                return True
        except requests.exceptions.RequestException:
            pass
        
        time.sleep(2)
    
    print(f"❌ {name} is not responding")
    return False

def main():
    print("🏥 Health Check for Splitwise Clone")
    print("=" * 40)
    
    services = [
        ("Backend API", "http://localhost:8000/"),
        ("Frontend", "http://localhost:3000/"),
        ("API Documentation", "http://localhost:8000/docs")
    ]
    
    all_healthy = True
    
    for name, url in services:
        if not check_service(name, url):
            all_healthy = False
    
    print()
    if all_healthy:
        print("🎉 All services are healthy!")
        print()
        print("📱 Frontend: http://localhost:3000")
        print("🔌 Backend API: http://localhost:8000")
        print("📚 API Documentation: http://localhost:8000/docs")
    else:
        print("❌ Some services are not healthy")
        print("Try running: docker-compose up --build")
        sys.exit(1)

if __name__ == "__main__":
    main()
