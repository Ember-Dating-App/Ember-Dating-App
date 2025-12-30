#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class EmberAPITester:
    def __init__(self, base_url="https://datingspark.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
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
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {response.text}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_prompts_library(self):
        """Test prompts library endpoint"""
        success, response = self.run_test(
            "Get Prompts Library",
            "GET",
            "prompts/library",
            200
        )
        if success and 'prompts' in response:
            print(f"   Found {len(response['prompts'])} prompts")
            return True
        return False

    def test_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            print(f"   Registered user: {response['user']['name']}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            return False
            
        # Use the same credentials from registration
        timestamp = datetime.now().strftime('%H%M%S')
        login_data = {
            "email": f"test.user.{timestamp}@example.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            print(f"   Login successful")
            return True
        return False

    def test_auth_me(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        
        if success and 'user_id' in response:
            print(f"   User ID: {response['user_id']}")
            return True
        return False

    def test_profile_update(self):
        """Test profile update"""
        profile_data = {
            "age": 25,
            "gender": "woman",
            "interested_in": "men",
            "location": "New York",
            "bio": "Test bio for testing",
            "photos": ["https://images.unsplash.com/photo-1759873821395-c29de82a5b99?w=400"],
            "prompts": [{"question": "A perfect Sunday looks like...", "answer": "Brunch and coffee"}],
            "interests": ["Travel", "Music", "Fitness"]
        }
        
        success, response = self.run_test(
            "Update Profile",
            "PUT",
            "profile",
            200,
            data=profile_data
        )
        
        if success and response.get('is_profile_complete'):
            print(f"   Profile completed successfully")
            return True
        return False

    def test_discover(self):
        """Test discover endpoint"""
        success, response = self.run_test(
            "Discover Profiles",
            "GET",
            "discover",
            200
        )
        
        if success:
            profiles_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {profiles_count} profiles")
            return True
        return False

    def test_most_compatible(self):
        """Test most compatible endpoint"""
        success, response = self.run_test(
            "Most Compatible Profiles",
            "GET",
            "discover/most-compatible",
            200
        )
        
        if success:
            profiles_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {profiles_count} compatible profiles")
            return True
        return False

    def test_matches(self):
        """Test matches endpoint"""
        success, response = self.run_test(
            "Get Matches",
            "GET",
            "matches",
            200
        )
        
        if success:
            matches_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {matches_count} matches")
            return True
        return False

    def test_received_likes(self):
        """Test received likes endpoint"""
        success, response = self.run_test(
            "Get Received Likes",
            "GET",
            "likes/received",
            200
        )
        
        if success:
            likes_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {likes_count} received likes")
            return True
        return False

    def test_premium_plans(self):
        """Test premium plans endpoint"""
        success, response = self.run_test(
            "Get Premium Plans",
            "GET",
            "premium/plans",
            200
        )
        
        if success and 'plans' in response:
            plans_count = len(response['plans'])
            print(f"   Found {plans_count} premium plans")
            return True
        return False

    def test_standouts(self):
        """Test standouts endpoint"""
        success, response = self.run_test(
            "Get Standouts",
            "GET",
            "discover/standouts",
            200
        )
        
        if success:
            standouts_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {standouts_count} standout profiles")
            return True
        return False

    def test_notifications(self):
        """Test notifications endpoint"""
        success, response = self.run_test(
            "Get Notifications",
            "GET",
            "notifications",
            200
        )
        
        if success:
            notifications_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {notifications_count} notifications")
            return True
        return False

    def test_photo_upload_base64(self):
        """Test base64 photo upload endpoint"""
        # Simple base64 encoded 1x1 pixel image
        test_data = {
            "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg==",
            "extension": "png"
        }
        
        success, response = self.run_test(
            "Upload Photo Base64",
            "POST",
            "upload/photo/base64",
            200,
            data=test_data
        )
        
        if success and 'url' in response:
            print(f"   Photo uploaded: {response['url']}")
            return True
        return False

    def test_popular_locations(self):
        """Test popular locations endpoint"""
        success, response = self.run_test(
            "Get Popular Locations",
            "GET",
            "locations/popular",
            200
        )
        
        if success and 'locations' in response:
            locations_count = len(response['locations'])
            print(f"   Found {locations_count} popular locations")
            # Check if expected cities are present
            cities = [loc['city'] for loc in response['locations']]
            if 'New York' in cities and 'Tokyo' in cities and 'London' in cities:
                print(f"   Popular cities include: {', '.join(cities[:5])}...")
                return True
        return False

    def test_location_update(self):
        """Test profile location update"""
        location_data = {
            "city": "Tokyo",
            "state": None,
            "country": "Japan",
            "latitude": 35.6762,
            "longitude": 139.6503
        }
        
        success, response = self.run_test(
            "Update Profile Location",
            "PUT",
            "profile/location",
            200,
            data=location_data
        )
        
        if success and 'location' in response:
            print(f"   Location updated to: {response['location']}")
            return True
        return False

    def test_stripe_checkout(self):
        """Test Stripe checkout session creation"""
        checkout_data = {
            "package_id": "monthly",
            "origin_url": "https://datingspark.preview.emergentagent.com"
        }
        
        success, response = self.run_test(
            "Create Stripe Checkout Session",
            "POST",
            "payments/checkout",
            200,
            data=checkout_data
        )
        
        if success and 'url' in response and 'session_id' in response:
            print(f"   Checkout session created: {response['session_id']}")
            print(f"   Checkout URL: {response['url'][:50]}...")
            return True, response['session_id']
        return False, None

    def test_payment_status(self, session_id):
        """Test payment status check"""
        if not session_id:
            return False
            
        success, response = self.run_test(
            "Check Payment Status",
            "GET",
            f"payments/status/{session_id}",
            200
        )
        
        if success:
            status = response.get('status', 'unknown')
            print(f"   Payment status: {status}")
            return True
        return False

    def test_ice_servers(self):
        """Test ICE servers endpoint for TURN support"""
        success, response = self.run_test(
            "Get ICE Servers",
            "GET",
            "calls/ice-servers",
            200
        )
        
        if success and 'iceServers' in response:
            ice_servers = response['iceServers']
            print(f"   Found {len(ice_servers)} ICE servers")
            
            # Check for TURN servers
            turn_servers = [server for server in ice_servers if 'turn:' in server.get('urls', '')]
            stun_servers = [server for server in ice_servers if 'stun:' in server.get('urls', '')]
            
            print(f"   STUN servers: {len(stun_servers)}, TURN servers: {len(turn_servers)}")
            
            if turn_servers:
                print(f"   TURN server example: {turn_servers[0]['urls']}")
                return True
        return False

    def run_all_tests(self):
        """Run all API tests"""
        print("🔥 Starting Ember Dating App API Tests\n")
        
        # Test public endpoints first
        self.test_prompts_library()
        self.test_premium_plans()
        self.test_popular_locations()  # NEW: Test popular locations
        
        # Test authentication flow
        if self.test_registration():
            self.test_auth_me()
            
            # Test profile management
            self.test_profile_update()
            self.test_location_update()  # NEW: Test location update
            
            # Test discovery features
            self.test_discover()
            self.test_most_compatible()
            self.test_standouts()
            
            # Test social features
            self.test_matches()
            self.test_received_likes()
            
            # Test notifications
            self.test_notifications()
            
            # Test file upload
            self.test_photo_upload_base64()
            
            # NEW: Test Stripe payment integration
            session_id = None
            checkout_success, session_id = self.test_stripe_checkout()
            if checkout_success and session_id:
                self.test_payment_status(session_id)
            
            # NEW: Test TURN server support
            self.test_ice_servers()
        
        # Print summary
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("⚠️  Some tests failed")
            return 1

def main():
    tester = EmberAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())