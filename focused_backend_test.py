#!/usr/bin/env python3

import requests
import sys
import json
import time
from datetime import datetime

class FocusedEmberAPITester:
    def __init__(self, base_url="https://datingspark-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_user_email = None
        self.test_user_password = None
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []

    def log_test(self, name, success, details="", is_critical=False):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            if is_critical:
                self.critical_failures.append({"test": name, "details": details})

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, is_critical=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True, is_critical=is_critical)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text}", is_critical=is_critical)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}", is_critical=is_critical)
            return False, {}

    def test_database_connection(self):
        """Test MongoDB Atlas connection by checking if we can register a user"""
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_email = f"ember.db.test.{timestamp}@example.com"
        self.test_user_password = "EmberDBTest123!"
        test_user = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": f"DB Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "Database Connection Test (User Registration)",
            "POST",
            "auth/register",
            200,
            data=test_user,
            is_critical=True
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            print(f"   ✅ MongoDB Atlas connection working - User created: {response['user']['name']}")
            print(f"   ✅ Database: ember_dating")
            print(f"   ✅ User ID: {self.user_id}")
            return True
        else:
            print(f"   ❌ MongoDB Atlas connection failed")
            return False

    def test_data_persistence(self):
        """Test data persistence by updating profile and retrieving it"""
        if not self.token:
            return False
            
        # Update profile
        profile_data = {
            "age": 30,
            "gender": "woman",
            "interested_in": "men",
            "location": "San Francisco, CA",
            "bio": "Testing data persistence in MongoDB Atlas",
            "photos": ["https://images.unsplash.com/photo-1759873821395-c29de82a5b99?w=400"],
            "prompts": [{"question": "Test question", "answer": "Test answer"}],
            "interests": ["Testing", "MongoDB", "Atlas"]
        }
        
        success, response = self.run_test(
            "Data Persistence Test (Profile Update)",
            "PUT",
            "profile",
            200,
            data=profile_data,
            is_critical=True
        )
        
        if not success:
            return False
            
        # Retrieve profile to verify persistence
        success, response = self.run_test(
            "Data Persistence Test (Profile Retrieval)",
            "GET",
            f"profile/{self.user_id}",
            200,
            is_critical=True
        )
        
        if success and response.get('age') == 30 and response.get('bio') == "Testing data persistence in MongoDB Atlas":
            print(f"   ✅ Data persisted correctly in MongoDB Atlas")
            print(f"   ✅ Profile age: {response.get('age')}")
            print(f"   ✅ Profile bio: {response.get('bio')[:50]}...")
            return True
        else:
            print(f"   ❌ Data persistence failed")
            return False

    def test_authentication_flow(self):
        """Test complete authentication flow"""
        if not self.test_user_email or not self.test_user_password:
            return False
            
        # Test login
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, response = self.run_test(
            "User Login with Valid Credentials",
            "POST",
            "auth/login",
            200,
            data=login_data,
            is_critical=True
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   ✅ JWT token generated successfully")
            
            # Test JWT token validation
            success, response = self.run_test(
                "JWT Token Validation (Get Current User)",
                "GET",
                "auth/me",
                200,
                is_critical=True
            )
            
            if success and 'user_id' in response:
                print(f"   ✅ JWT token validation working")
                print(f"   ✅ Current user: {response.get('name', 'Unknown')}")
                return True
        
        return False

    def test_profile_endpoints(self):
        """Test profile management endpoints"""
        if not self.token:
            return False
            
        # Test profile update
        profile_data = {
            "age": 28,
            "gender": "woman", 
            "interested_in": "men",
            "location": "New York, NY",
            "bio": "Updated bio for testing",
            "interests": ["Travel", "Photography", "Hiking"]
        }
        
        success, response = self.run_test(
            "Update User Profile",
            "PUT",
            "profile",
            200,
            data=profile_data,
            is_critical=True
        )
        
        if not success:
            return False
            
        # Test get profile by ID
        success, response = self.run_test(
            "Get User Profile by ID",
            "GET",
            f"profile/{self.user_id}",
            200,
            is_critical=True
        )
        
        if not success:
            return False
            
        # Test location update
        location_data = {
            "city": "Los Angeles",
            "state": "CA",
            "country": "United States",
            "latitude": 34.0522,
            "longitude": -118.2437
        }
        
        success, response = self.run_test(
            "Update Profile Location",
            "PUT",
            "profile/location",
            200,
            data=location_data,
            is_critical=True
        )
        
        if success and 'location' in response:
            print(f"   ✅ Location updated to: {response['location']}")
            return True
        
        return False

    def test_premium_plans(self):
        """Test premium plans endpoint"""
        success, response = self.run_test(
            "Get Premium Plans and Pricing",
            "GET",
            "premium/plans",
            200,
            is_critical=True
        )
        
        if success and 'plans' in response:
            plans = response['plans']
            print(f"   ✅ Found {len(plans)} premium plans")
            for plan in plans:
                print(f"   ✅ {plan.get('name', 'Unknown')}: ${plan.get('price', 0)}")
            return True
        
        return False

    def test_discover_system(self):
        """Test discover system endpoints"""
        if not self.token:
            return False
            
        # Test discover feed
        success, response = self.run_test(
            "Get Discover Feed (with Ambassador Priority)",
            "GET",
            "discover",
            200,
            is_critical=True
        )
        
        if not success:
            return False
            
        profiles_count = len(response) if isinstance(response, list) else 0
        print(f"   ✅ Discover feed returned {profiles_count} profiles")
        
        # Check for ambassador priority
        if isinstance(response, list) and len(response) > 0:
            ambassador_profiles = [p for p in response if p.get('is_ambassador', False)]
            print(f"   ✅ Ambassador profiles: {len(ambassador_profiles)}")
        
        # Test AI-powered matches
        success, response = self.run_test(
            "Get AI-Powered Most Compatible Matches",
            "GET",
            "discover/most-compatible",
            200,
            is_critical=True
        )
        
        if not success:
            return False
            
        compatible_count = len(response) if isinstance(response, list) else 0
        print(f"   ✅ AI-powered matches returned {compatible_count} profiles")
        
        # Test standouts
        success, response = self.run_test(
            "Get Premium Standout Profiles",
            "GET",
            "discover/standouts",
            200,
            is_critical=True
        )
        
        if success:
            standouts_count = len(response) if isinstance(response, list) else 0
            print(f"   ✅ Standout profiles returned {standouts_count} profiles")
            return True
        
        return False

    def run_focused_tests(self):
        """Run focused tests on the specific endpoints mentioned in the review request"""
        print("🔥 Starting Focused Backend Testing - Critical Features\n")
        
        print("🗄️  Testing Database Connection & Persistence...")
        db_success = self.test_database_connection()
        if db_success:
            self.test_data_persistence()
        
        print("\n🔐 Testing Authentication & Session Management...")
        if db_success:
            self.test_authentication_flow()
        
        print("\n👤 Testing User Profile Management...")
        if db_success:
            self.test_profile_endpoints()
        
        print("\n💎 Testing Premium Plans...")
        self.test_premium_plans()
        
        print("\n🔍 Testing Discover System...")
        if db_success:
            self.test_discover_system()
        
        # Print summary
        print(f"\n📊 Focused Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.critical_failures:
            print(f"\n🚨 Critical Failures ({len(self.critical_failures)}):")
            for critical in self.critical_failures:
                print(f"   • {critical['test']}: {critical['details']}")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All critical tests passed!")
            return 0
        else:
            print("⚠️  Some critical tests failed")
            return 1

def main():
    tester = FocusedEmberAPITester()
    return tester.run_focused_tests()

if __name__ == "__main__":
    sys.exit(main())