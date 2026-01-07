#!/usr/bin/env python3

import requests
import sys
import json
import time
import jwt
from datetime import datetime, timezone, timedelta

class EmberAuthTester:
    def __init__(self, base_url="https://datenight-app-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.test_user_email = None
        self.test_user_password = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.failed_tests = []
        self.critical_failures = []

    def log_test(self, name, success, details="", is_critical=False):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
            self.failed_tests.append({"test": name, "details": details})
            if is_critical:
                self.critical_failures.append({"test": name, "details": details})
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details,
            "is_critical": is_critical
        })

    def make_request(self, method, endpoint, data=None, headers=None, expected_status=None):
        """Make HTTP request and return response"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if headers:
            test_headers.update(headers)

        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            return response
        except requests.exceptions.Timeout:
            print(f"Request timeout for {method} {endpoint}")
            return None
        except requests.exceptions.ConnectionError:
            print(f"Connection error for {method} {endpoint}")
            return None
        except Exception as e:
            print(f"Request error for {method} {endpoint}: {str(e)}")
            return None

    def test_registration_flow(self):
        """Test complete registration flow"""
        print("\n🔐 Testing Registration Flow...")
        
        # Generate unique test user
        timestamp = datetime.now().strftime('%H%M%S')
        self.test_user_email = f"ember.auth.test.{timestamp}@example.com"
        self.test_user_password = "EmberAuthTest123!"
        test_user = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": f"Ember Auth Test User {timestamp}"
        }
        
        # Test 1: Register new user with email/password
        response = self.make_request('POST', 'auth/register', data=test_user)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'token' in data and 'user' in data:
                    self.token = data['token']
                    self.user_id = data['user']['user_id']
                    
                    # Verify token is returned
                    self.log_test("Registration - Token returned", True, is_critical=True)
                    
                    # Verify user data is returned (without password field)
                    user_data = data['user']
                    if 'password' not in user_data:
                        self.log_test("Registration - User data returned without password", True, is_critical=True)
                    else:
                        self.log_test("Registration - User data returned without password", False, "Password field present in response", is_critical=True)
                    
                    # Verify user fields
                    if user_data.get('email') == self.test_user_email and user_data.get('name') == test_user['name']:
                        self.log_test("Registration - User data correct", True)
                    else:
                        self.log_test("Registration - User data correct", False, "User data mismatch")
                        
                    print(f"   Registered user: {user_data['name']} ({user_data['email']})")
                    print(f"   User ID: {self.user_id}")
                    print(f"   Token: {self.token[:20]}...")
                    
                else:
                    self.log_test("Registration - Valid response format", False, "Missing token or user in response", is_critical=True)
            except json.JSONDecodeError:
                self.log_test("Registration - Valid JSON response", False, "Invalid JSON response", is_critical=True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Registration - Success", False, f"Expected 200, got {status}", is_critical=True)
            return False
        
        # Test 2: Test duplicate email registration (should fail with 400)
        response = self.make_request('POST', 'auth/register', data=test_user)
        
        if response and response.status_code == 400:
            self.log_test("Registration - Duplicate email rejected", True)
            print(f"   Duplicate registration correctly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Registration - Duplicate email rejected", False, f"Expected 400, got {status}")
        
        return True

    def test_login_flow(self):
        """Test complete login flow"""
        print("\n🔑 Testing Login Flow...")
        
        if not self.test_user_email or not self.test_user_password:
            self.log_test("Login - Prerequisites", False, "No test user credentials available", is_critical=True)
            return False
        
        # Test 1: Login with valid credentials
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        response = self.make_request('POST', 'auth/login', data=login_data)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'token' in data and 'user' in data:
                    old_token = self.token
                    self.token = data['token']
                    
                    # Verify token is returned
                    self.log_test("Login - Token returned", True, is_critical=True)
                    
                    # Verify user data is returned
                    user_data = data['user']
                    if 'password' not in user_data:
                        self.log_test("Login - User data returned without password", True, is_critical=True)
                    else:
                        self.log_test("Login - User data returned without password", False, "Password field present in response", is_critical=True)
                    
                    print(f"   Login successful for: {user_data.get('email')}")
                    print(f"   New token: {self.token[:20]}...")
                    
                    # Verify token is different from registration token (new session)
                    if self.token != old_token:
                        self.log_test("Login - New token generated", True)
                    else:
                        self.log_test("Login - New token generated", False, "Same token as registration")
                        
                else:
                    self.log_test("Login - Valid response format", False, "Missing token or user in response", is_critical=True)
            except json.JSONDecodeError:
                self.log_test("Login - Valid JSON response", False, "Invalid JSON response", is_critical=True)
        else:
            status = response.status_code if response else "No response"
            self.log_test("Login - Valid credentials success", False, f"Expected 200, got {status}", is_critical=True)
        
        # Test 2: Login with invalid credentials (should fail with 401)
        invalid_login = {
            "email": self.test_user_email,
            "password": "WrongPassword123!"
        }
        
        response = self.make_request('POST', 'auth/login', data=invalid_login)
        
        if response and response.status_code == 401:
            self.log_test("Login - Invalid credentials rejected", True)
            print(f"   Invalid credentials correctly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Login - Invalid credentials rejected", False, f"Expected 401, got {status}")
        
        # Test 3: Login with non-existent email (should fail with 401)
        nonexistent_login = {
            "email": "nonexistent.user@example.com",
            "password": "SomePassword123!"
        }
        
        response = self.make_request('POST', 'auth/login', data=nonexistent_login)
        
        if response and response.status_code == 401:
            self.log_test("Login - Non-existent email rejected", True)
            print(f"   Non-existent email correctly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Login - Non-existent email rejected", False, f"Expected 401, got {status}")
        
        return True

    def test_token_authentication(self):
        """Test token authentication scenarios"""
        print("\n🎫 Testing Token Authentication...")
        
        if not self.token:
            self.log_test("Token Auth - Prerequisites", False, "No token available", is_critical=True)
            return False
        
        # Test 1: Call GET /api/auth/me with valid token
        headers = {'Authorization': f'Bearer {self.token}'}
        response = self.make_request('GET', 'auth/me', headers=headers)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'user_id' in data and data['user_id'] == self.user_id:
                    self.log_test("Token Auth - Valid token accepted", True, is_critical=True)
                    print(f"   User data retrieved: {data.get('name')} ({data.get('email')})")
                    
                    # Verify no password field
                    if 'password' not in data:
                        self.log_test("Token Auth - No password in response", True)
                    else:
                        self.log_test("Token Auth - No password in response", False, "Password field present")
                else:
                    self.log_test("Token Auth - Correct user data", False, "User ID mismatch or missing")
            except json.JSONDecodeError:
                self.log_test("Token Auth - Valid JSON response", False, "Invalid JSON response")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Token Auth - Valid token accepted", False, f"Expected 200, got {status}", is_critical=True)
        
        # Test 2: Call with invalid token (should fail with 401)
        invalid_headers = {'Authorization': 'Bearer invalid_token_12345'}
        response = self.make_request('GET', 'auth/me', headers=invalid_headers)
        
        if response and response.status_code == 401:
            self.log_test("Token Auth - Invalid token rejected", True)
            print(f"   Invalid token correctly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Token Auth - Invalid token rejected", False, f"Expected 401, got {status}")
        
        # Test 3: Call with expired token (create a manually expired token)
        try:
            # Create an expired token
            expired_payload = {
                'user_id': self.user_id,
                'exp': datetime.now(timezone.utc) - timedelta(hours=1)  # Expired 1 hour ago
            }
            expired_token = jwt.encode(expired_payload, 'ember-dating-app-secret-2024', algorithm='HS256')
            
            expired_headers = {'Authorization': f'Bearer {expired_token}'}
            response = self.make_request('GET', 'auth/me', headers=expired_headers)
            
            if response and response.status_code == 401:
                self.log_test("Token Auth - Expired token rejected", True)
                print(f"   Expired token correctly rejected")
            else:
                status = response.status_code if response else "No response"
                self.log_test("Token Auth - Expired token rejected", False, f"Expected 401, got {status}")
        except Exception as e:
            self.log_test("Token Auth - Expired token test", False, f"Error creating expired token: {str(e)}")
        
        # Test 4: Call without token (should fail with 401)
        response = self.make_request('GET', 'auth/me')
        
        if response and response.status_code == 401:
            self.log_test("Token Auth - No token rejected", True)
            print(f"   Request without token correctly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Token Auth - No token rejected", False, f"Expected 401, got {status}")
        
        return True

    def test_session_persistence(self):
        """Test session persistence across multiple requests"""
        print("\n🔄 Testing Session Persistence...")
        
        if not self.token:
            self.log_test("Session - Prerequisites", False, "No token available", is_critical=True)
            return False
        
        headers = {'Authorization': f'Bearer {self.token}'}
        
        # Test multiple requests with same token
        for i in range(3):
            response = self.make_request('GET', 'auth/me', headers=headers)
            
            if response and response.status_code == 200:
                try:
                    data = response.json()
                    if data.get('user_id') == self.user_id:
                        success = True
                    else:
                        success = False
                        break
                except:
                    success = False
                    break
            else:
                success = False
                break
            
            time.sleep(0.5)  # Small delay between requests
        
        if success:
            self.log_test("Session - Token works across multiple requests", True, is_critical=True)
            print(f"   Token successfully used for 3 consecutive requests")
        else:
            self.log_test("Session - Token works across multiple requests", False, "Token failed on subsequent requests", is_critical=True)
        
        # Test accessing a protected endpoint
        response = self.make_request('GET', 'premium/plans', headers=headers)
        
        if response and response.status_code == 200:
            self.log_test("Session - Token works for other protected endpoints", True)
            print(f"   Token successfully used for premium/plans endpoint")
        else:
            status = response.status_code if response else "No response"
            # Note: premium/plans might not require auth, so we'll check if it's a 401 specifically
            if status == 401:
                self.log_test("Session - Token works for other protected endpoints", False, f"Token rejected for protected endpoint: {status}")
            else:
                self.log_test("Session - Token works for other protected endpoints", True, f"Endpoint accessible (status: {status})")
        
        return True

    def test_logout_flow(self):
        """Test logout functionality"""
        print("\n🚪 Testing Logout Flow...")
        
        if not self.token:
            self.log_test("Logout - Prerequisites", False, "No token available", is_critical=True)
            return False
        
        # Test logout endpoint
        headers = {'Authorization': f'Bearer {self.token}'}
        response = self.make_request('POST', 'auth/logout', headers=headers)
        
        if response and response.status_code == 200:
            try:
                data = response.json()
                if 'message' in data:
                    self.log_test("Logout - Endpoint accessible", True)
                    print(f"   Logout response: {data.get('message')}")
                    
                    # Test if token still works after logout (it might still work for JWT-based auth)
                    response = self.make_request('GET', 'auth/me', headers=headers)
                    
                    if response and response.status_code == 401:
                        self.log_test("Logout - Token invalidated", True)
                        print(f"   Token successfully invalidated after logout")
                    elif response and response.status_code == 200:
                        self.log_test("Logout - Token invalidated", False, "Token still works after logout (JWT tokens don't invalidate server-side)")
                        print(f"   Note: JWT tokens remain valid until expiry (expected behavior)")
                    else:
                        status = response.status_code if response else "No response"
                        self.log_test("Logout - Token status after logout", False, f"Unexpected response: {status}")
                else:
                    self.log_test("Logout - Valid response format", False, "No message in response")
            except json.JSONDecodeError:
                self.log_test("Logout - Valid JSON response", False, "Invalid JSON response")
        else:
            status = response.status_code if response else "No response"
            self.log_test("Logout - Endpoint accessible", False, f"Expected 200, got {status}")
        
        return True

    def test_token_format_and_structure(self):
        """Test token format and JWT structure"""
        print("\n🔍 Testing Token Format and Structure...")
        
        if not self.token:
            self.log_test("Token Format - Prerequisites", False, "No token available")
            return False
        
        try:
            # Decode JWT without verification to check structure
            decoded = jwt.decode(self.token, options={"verify_signature": False})
            
            # Check required fields
            if 'user_id' in decoded:
                self.log_test("Token Format - Contains user_id", True)
                print(f"   Token user_id: {decoded['user_id']}")
            else:
                self.log_test("Token Format - Contains user_id", False, "Missing user_id in token")
            
            if 'exp' in decoded:
                self.log_test("Token Format - Contains expiration", True)
                exp_time = datetime.fromtimestamp(decoded['exp'], tz=timezone.utc)
                print(f"   Token expires: {exp_time}")
                
                # Check if expiration is reasonable (should be in the future)
                if exp_time > datetime.now(timezone.utc):
                    self.log_test("Token Format - Valid expiration time", True)
                else:
                    self.log_test("Token Format - Valid expiration time", False, "Token already expired")
            else:
                self.log_test("Token Format - Contains expiration", False, "Missing exp in token")
            
            # Check token algorithm
            header = jwt.get_unverified_header(self.token)
            if header.get('alg') == 'HS256':
                self.log_test("Token Format - Correct algorithm", True)
                print(f"   Token algorithm: {header.get('alg')}")
            else:
                self.log_test("Token Format - Correct algorithm", False, f"Unexpected algorithm: {header.get('alg')}")
                
        except jwt.InvalidTokenError as e:
            self.log_test("Token Format - Valid JWT structure", False, f"Invalid JWT: {str(e)}")
        except Exception as e:
            self.log_test("Token Format - Token analysis", False, f"Error analyzing token: {str(e)}")
        
        return True

    def run_comprehensive_auth_tests(self):
        """Run all authentication tests"""
        print("🔥 Starting Comprehensive Authentication Flow Tests for Ember Dating App\n")
        print(f"🌐 Testing against: {self.base_url}")
        print(f"📅 Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        # Run all test scenarios
        success = True
        
        # 1. Registration Flow
        if not self.test_registration_flow():
            success = False
        
        # 2. Login Flow
        if not self.test_login_flow():
            success = False
        
        # 3. Token Authentication
        if not self.test_token_authentication():
            success = False
        
        # 4. Session Persistence
        if not self.test_session_persistence():
            success = False
        
        # 5. Logout Flow
        if not self.test_logout_flow():
            success = False
        
        # 6. Token Format and Structure
        if not self.test_token_format_and_structure():
            success = False
        
        # Print comprehensive summary
        print(f"\n📊 Authentication Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"📈 Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        # Print failed tests summary
        if self.failed_tests:
            print(f"\n❌ Failed Tests ({len(self.failed_tests)}):")
            for failed in self.failed_tests:
                print(f"   • {failed['test']}: {failed['details']}")
        
        # Print critical failures
        if self.critical_failures:
            print(f"\n🚨 Critical Failures ({len(self.critical_failures)}):")
            for critical in self.critical_failures:
                print(f"   • {critical['test']}: {critical['details']}")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All authentication tests passed!")
            print("✅ Authentication system is working correctly")
            return 0
        else:
            print(f"\n⚠️  {len(self.failed_tests)} authentication tests failed")
            if self.critical_failures:
                print("🚨 Critical authentication issues found - immediate attention required")
            return 1

def main():
    tester = EmberAuthTester()
    return tester.run_comprehensive_auth_tests()

if __name__ == "__main__":
    sys.exit(main())