#!/usr/bin/env python3
"""
Backend API Testing for Virtual Pillbox Application
Tests basic connectivity, status endpoints, and CORS functionality
"""

import requests
import json
import sys
from datetime import datetime
import os
from pathlib import Path

# Load environment variables to get the backend URL
def load_env_file(file_path):
    """Load environment variables from .env file"""
    env_vars = {}
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"\'')
                    env_vars[key] = value
    return env_vars

# Get backend URL from frontend .env file
frontend_env = load_env_file('/app/frontend/.env')
BACKEND_URL = frontend_env.get('EXPO_PUBLIC_BACKEND_URL', 'http://localhost:8001')
API_BASE_URL = f"{BACKEND_URL}/api"

print(f"Testing backend at: {API_BASE_URL}")
print("=" * 60)

def test_basic_connectivity():
    """Test basic API connectivity at /api/"""
    print("🔍 Testing basic API connectivity...")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ Basic connectivity test PASSED")
                return True
            else:
                print("❌ Basic connectivity test FAILED - Unexpected response")
                return False
        else:
            print(f"❌ Basic connectivity test FAILED - Status code: {response.status_code}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Basic connectivity test FAILED - Connection error: {e}")
        return False
    except Exception as e:
        print(f"❌ Basic connectivity test FAILED - Error: {e}")
        return False

def test_cors_headers():
    """Test CORS headers are present with preflight request"""
    print("\n🔍 Testing CORS headers...")
    try:
        # Test with OPTIONS preflight request
        headers = {
            'Origin': BACKEND_URL,
            'Access-Control-Request-Method': 'GET'
        }
        response = requests.options(f"{API_BASE_URL}/", headers=headers, timeout=10)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
        }
        
        print(f"CORS Headers: {cors_headers}")
        
        if cors_headers['Access-Control-Allow-Origin'] and cors_headers['Access-Control-Allow-Methods']:
            print("✅ CORS test PASSED - Headers present and configured properly")
            return True
        else:
            print("❌ CORS test FAILED - Missing required CORS headers")
            return False
            
    except Exception as e:
        print(f"❌ CORS test FAILED - Error: {e}")
        return False

def test_status_get_endpoint():
    """Test GET /api/status endpoint"""
    print("\n🔍 Testing GET /api/status endpoint...")
    try:
        response = requests.get(f"{API_BASE_URL}/status", timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            print("✅ GET /api/status test PASSED")
            return True
        else:
            print(f"❌ GET /api/status test FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ GET /api/status test FAILED - Error: {e}")
        return False

def test_status_post_endpoint():
    """Test POST /api/status endpoint"""
    print("\n🔍 Testing POST /api/status endpoint...")
    try:
        test_data = {
            "client_name": "Virtual Pillbox Test Client"
        }
        
        response = requests.post(
            f"{API_BASE_URL}/status", 
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {data}")
            
            # Verify response structure
            if all(key in data for key in ['id', 'client_name', 'timestamp']):
                if data['client_name'] == test_data['client_name']:
                    print("✅ POST /api/status test PASSED")
                    return True
                else:
                    print("❌ POST /api/status test FAILED - Client name mismatch")
                    return False
            else:
                print("❌ POST /api/status test FAILED - Missing required fields in response")
                return False
        else:
            print(f"❌ POST /api/status test FAILED - Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ POST /api/status test FAILED - Error: {e}")
        return False

def test_backend_health():
    """Overall backend health check"""
    print("\n🔍 Testing overall backend health...")
    
    # Test if backend is responding at all
    try:
        response = requests.get(BACKEND_URL, timeout=5)
        print(f"Backend root status: {response.status_code}")
        return True
    except Exception as e:
        print(f"❌ Backend health check FAILED - Backend not responding: {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Virtual Pillbox Backend API Tests")
    print(f"Backend URL: {BACKEND_URL}")
    print(f"API Base URL: {API_BASE_URL}")
    print("=" * 60)
    
    tests = [
        ("Backend Health", test_backend_health),
        ("Basic Connectivity", test_basic_connectivity),
        ("CORS Headers", test_cors_headers),
        ("GET Status Endpoint", test_status_get_endpoint),
        ("POST Status Endpoint", test_status_post_endpoint)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"❌ {test_name} FAILED with exception: {e}")
            results[test_name] = False
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\nOverall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All backend tests PASSED! Backend is healthy and working properly.")
        return True
    else:
        print("⚠️  Some backend tests FAILED. Check the details above.")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)