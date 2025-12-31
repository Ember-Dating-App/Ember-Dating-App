#!/usr/bin/env python3

import requests
import sys
import json
import time
import base64
from datetime import datetime

class EmberAPITester:
    def __init__(self, base_url="https://datingspark.preview.emergentagent.com"):
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
        self.test_user_email = f"ember.test.{timestamp}@example.com"
        self.test_user_password = "EmberTest123!"
        test_user = {
            "email": self.test_user_email,
            "password": self.test_user_password,
            "name": f"Ember Test User {timestamp}"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user,
            is_critical=True
        )
        
        if success and 'token' in response and 'user' in response:
            self.token = response['token']
            self.user_id = response['user']['user_id']
            print(f"   Registered user: {response['user']['name']}")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        if not self.test_user_email or not self.test_user_password:
            return False
            
        login_data = {
            "email": self.test_user_email,
            "password": self.test_user_password
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data,
            is_critical=True
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

    def test_ambassador_info(self):
        """Test ambassador program info endpoint"""
        success, response = self.run_test(
            "Get Ambassador Program Info",
            "GET",
            "ambassador/info",
            200
        )
        
        if success and 'total_limit' in response:
            print(f"   Ambassador limit: {response['total_limit']}")
            print(f"   Current count: {response['current_count']}")
            print(f"   Available slots: {response['available_slots']}")
            print(f"   Program full: {response['is_full']}")
            return True
        return False

    def test_ambassador_status(self):
        """Test ambassador status endpoint"""
        success, response = self.run_test(
            "Get Ambassador Status",
            "GET",
            "ambassador/status",
            200
        )
        
        if success and 'is_ambassador' in response:
            print(f"   Is ambassador: {response['is_ambassador']}")
            print(f"   Status: {response['status']}")
            return True
        return False

    def test_ambassador_apply(self):
        """Test ambassador application endpoint"""
        success, response = self.run_test(
            "Apply for Ambassador",
            "POST",
            "ambassador/apply",
            200
        )
        
        if success:
            print(f"   Application result: {response.get('message', 'Unknown')}")
            if response.get('success'):
                print(f"   Ambassador status: {response.get('is_ambassador', False)}")
                if response.get('premium_until'):
                    print(f"   Premium until: {response['premium_until']}")
            return True
        return False

    def test_likes_with_push_notifications(self):
        """Test likes endpoint with different like types for push notifications"""
        # Test regular like
        like_data = {
            "liked_user_id": "test_user_123",
            "like_type": "regular"
        }
        
        success, response = self.run_test(
            "Send Regular Like (Push Notification)",
            "POST",
            "likes",
            200,
            data=like_data
        )
        
        if success:
            print(f"   Regular like sent successfully")
        
        # Test super like
        super_like_data = {
            "liked_user_id": "test_user_123",
            "like_type": "super_like"
        }
        
        success, response = self.run_test(
            "Send Super Like (Push Notification)",
            "POST",
            "likes",
            200,
            data=super_like_data
        )
        
        if success:
            print(f"   Super like sent successfully")
        
        # Test rose
        rose_data = {
            "liked_user_id": "test_user_123",
            "like_type": "rose"
        }
        
        success, response = self.run_test(
            "Send Rose (Push Notification)",
            "POST",
            "likes",
            200,
            data=rose_data
        )
        
        if success:
            print(f"   Rose sent successfully")
            return True
        return False

    def test_virtual_gifts(self):
        """Test virtual gifts endpoint"""
        # First get available gifts
        success, response = self.run_test(
            "Get Virtual Gifts",
            "GET",
            "virtual-gifts",
            200
        )
        
        if success and 'gifts' in response:
            gifts = response['gifts']
            print(f"   Found {len(gifts)} virtual gifts")
            
            # Test sending a virtual gift (will fail without valid match, but tests endpoint)
            if gifts:
                gift_data = {
                    "match_id": "test_match_123",
                    "gift_id": gifts[0]['id'],  # Use first gift's ID
                    "message": "Test gift message"
                }
                
                # This will likely return 404 for match not found, but tests the endpoint structure
                success, response = self.run_test(
                    "Send Virtual Gift (Push Notification)",
                    "POST",
                    "virtual-gifts/send",
                    404,  # Expecting 404 since match doesn't exist
                    data=gift_data
                )
                
                if success:
                    print(f"   Virtual gift endpoint working (expected 404 for non-existent match)")
                    return True
        return False

    def test_verification_photo(self):
        """Test photo verification to enable other features"""
        # Simple base64 encoded 1x1 pixel image for verification
        verification_data = {
            "selfie_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
        }
        
        success, response = self.run_test(
            "Photo Verification",
            "POST",
            "verification/photo",
            200,
            data=verification_data
        )
        
        if success and response.get('status') == 'verified':
            print(f"   Photo verification successful")
            return True
        return False

    def test_date_suggestions(self):
        """Test date suggestions endpoint"""
        date_data = {
            "match_id": "test_match_123",
            "place_data": {
                "id": "test_place_123",
                "name": "Test Restaurant",
                "address": "123 Test St, Test City",
                "rating": 4.5,
                "priceLevel": 2
            },
            "message": "How about dinner here?"
        }
        
        # This will likely return 404 for match not found, but tests the endpoint structure
        success, response = self.run_test(
            "Send Date Suggestion (Push Notification)",
            "POST",
            "messages/date-suggestion",
            404,  # Expecting 404 since match doesn't exist
            data=date_data
        )
        
        if success:
            print(f"   Date suggestion endpoint working (expected 404 for non-existent match)")
            return True
        return False

    def test_discover_ambassador_priority(self):
        """Test discover endpoint to verify ambassador priority"""
        success, response = self.run_test(
            "Discover Profiles (Ambassador Priority)",
            "GET",
            "discover",
            200
        )
        
        if success and isinstance(response, list):
            profiles_count = len(response)
            print(f"   Found {profiles_count} profiles")
            
            # Check if any profiles have ambassador status
            ambassador_profiles = [p for p in response if p.get('is_ambassador', False)]
            non_ambassador_profiles = [p for p in response if not p.get('is_ambassador', False)]
            
            print(f"   Ambassador profiles: {len(ambassador_profiles)}")
            print(f"   Non-ambassador profiles: {len(non_ambassador_profiles)}")
            
            # Verify ambassadors appear first (if any exist)
            if ambassador_profiles and non_ambassador_profiles:
                # Find first ambassador and first non-ambassador indices
                first_ambassador_idx = next((i for i, p in enumerate(response) if p.get('is_ambassador', False)), -1)
                first_non_ambassador_idx = next((i for i, p in enumerate(response) if not p.get('is_ambassador', False)), -1)
                
                if first_ambassador_idx != -1 and first_non_ambassador_idx != -1:
                    if first_ambassador_idx < first_non_ambassador_idx:
                        print(f"   ✅ Ambassadors appear first in discover results")
                    else:
                        print(f"   ⚠️ Ambassadors not prioritized in discover results")
            
            return True
        return False

    # ==================== COMPREHENSIVE API TESTS ====================
    
    def test_google_oauth(self):
        """Test Google OAuth session (mock test)"""
        # This would require actual Google session ID, so we test the endpoint structure
        mock_data = {"session_id": "mock_session_123"}
        
        success, response = self.run_test(
            "Google OAuth Session",
            "POST",
            "auth/google/session",
            401,  # Expected to fail with mock data
            data=mock_data
        )
        
        if success:  # 401 is expected response for invalid session
            print(f"   Google OAuth endpoint accessible")
            return True
        return False

    def test_apple_signin(self):
        """Test Apple Sign-In session (mock test)"""
        mock_data = {
            "apple_data": {
                "email": "test@example.com",
                "name": "Test User",
                "session_token": "mock_apple_token"
            }
        }
        
        success, response = self.run_test(
            "Apple Sign-In Session",
            "POST",
            "auth/apple/session",
            200,
            data=mock_data
        )
        
        if success and 'user' in response:
            print(f"   Apple Sign-In working")
            return True
        return False

    def test_verification_status(self):
        """Test verification status endpoint"""
        success, response = self.run_test(
            "Get Verification Status",
            "GET",
            "verification/status",
            200
        )
        
        if success and 'verification_status' in response:
            print(f"   Verification status: {response['verification_status']}")
            return True
        return False

    def test_phone_verification_flow(self):
        """Test phone verification flow"""
        # Send verification code
        phone_data = {"phone": "+1234567890"}
        
        success, response = self.run_test(
            "Send Phone Verification Code",
            "POST",
            "verification/phone/send",
            200,
            data=phone_data
        )
        
        if success and 'message' in response:
            print(f"   Phone verification code sent")
            
            # Get the debug code if available
            debug_code = response.get('debug_code')
            if debug_code:
                # Verify the code
                verify_data = {
                    "phone": "+1234567890",
                    "code": debug_code
                }
                
                success, response = self.run_test(
                    "Verify Phone Code",
                    "POST",
                    "verification/phone/verify",
                    200,
                    data=verify_data
                )
                
                if success and response.get('status') == 'verified':
                    print(f"   Phone verification successful")
                    return True
        return False

    def test_id_verification(self):
        """Test ID verification endpoint"""
        # Simple base64 encoded image for ID verification
        id_data = {
            "id_photo_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
        }
        
        success, response = self.run_test(
            "ID Verification",
            "POST",
            "verification/id",
            200,
            data=id_data
        )
        
        if success and response.get('status') == 'verified':
            print(f"   ID verification successful")
            return True
        return False

    def test_swipe_limits(self):
        """Test swipe limits endpoint"""
        success, response = self.run_test(
            "Get Swipe Limits",
            "GET",
            "limits/swipes",
            200
        )
        
        if success and 'swipes' in response:
            swipes = response['swipes']
            super_likes = response['super_likes']
            roses = response['roses']
            print(f"   Swipes: {swipes['remaining']}/{swipes['max']}")
            print(f"   Super likes: {super_likes['remaining']}/{super_likes['max']}")
            print(f"   Roses: {roses['remaining']}/{roses['max']}")
            return True
        return False

    def test_discover_daily_picks(self):
        """Test daily picks endpoint"""
        success, response = self.run_test(
            "Get Daily Picks",
            "GET",
            "discover/daily-picks",
            200
        )
        
        if success:
            picks_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {picks_count} daily picks")
            return True
        return False

    def test_pass_profile(self):
        """Test pass profile endpoint"""
        success, response = self.run_test(
            "Pass Profile",
            "POST",
            "discover/pass?liked_user_id=test_user_pass_123",
            200
        )
        
        if success and 'message' in response:
            print(f"   Profile passed successfully")
            return True
        return False

    def test_undo_pass(self):
        """Test undo pass endpoint"""
        success, response = self.run_test(
            "Undo Pass",
            "POST",
            "discover/undo",
            200
        )
        
        if success:
            print(f"   Undo pass endpoint working")
            return True
        return False

    def test_roses_received(self):
        """Test roses received endpoint"""
        success, response = self.run_test(
            "Get Roses Received",
            "GET",
            "likes/roses-received",
            200
        )
        
        if success:
            roses_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {roses_count} roses received")
            return True
        return False

    def test_match_operations(self):
        """Test match operations"""
        # Test getting matches
        success, response = self.run_test(
            "Get All Matches",
            "GET",
            "matches",
            200,
            is_critical=True
        )
        
        if success:
            matches_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {matches_count} matches")
            
            # Test unmatch (will fail without real match, but tests endpoint)
            success, response = self.run_test(
                "Unmatch User",
                "DELETE",
                "matches/test_match_123",
                404  # Expected since match doesn't exist
            )
            
            if success:
                print(f"   Unmatch endpoint working (expected 404)")
                return True
        return False

    def test_messaging_system(self):
        """Test messaging system endpoints"""
        # Test get messages
        success, response = self.run_test(
            "Get Messages",
            "GET",
            "messages/test_match_123",
            404  # Expected since match doesn't exist
        )
        
        if success:
            print(f"   Get messages endpoint working (expected 404)")
        
        # Test send message
        message_data = {
            "match_id": "test_match_123",
            "content": "Hello, this is a test message!"
        }
        
        success, response = self.run_test(
            "Send Message",
            "POST",
            "messages",
            404,  # Expected since match doesn't exist
            data=message_data
        )
        
        if success:
            print(f"   Send message endpoint working (expected 404)")
        
        # Test edit message
        success, response = self.run_test(
            "Edit Message",
            "PUT",
            "messages/test_message_123",
            404,  # Expected since message doesn't exist
            data={"content": "Edited message"}
        )
        
        if success:
            print(f"   Edit message endpoint working (expected 404)")
        
        # Test delete message
        success, response = self.run_test(
            "Delete Message",
            "DELETE",
            "messages/test_message_123",
            404  # Expected since message doesn't exist
        )
        
        if success:
            print(f"   Delete message endpoint working (expected 404)")
            return True
        return False

    def test_icebreaker_games(self):
        """Test icebreaker games system"""
        # Get available games
        success, response = self.run_test(
            "Get Icebreaker Games",
            "GET",
            "icebreakers/games",
            200
        )
        
        if success and 'games' in response:
            games = response['games']
            print(f"   Found {len(games)} icebreaker games")
            
            if games:
                # Test starting a game with correct parameters
                game_data = {
                    "match_id": "test_match_123",
                    "game_type": games[0]['type']  # Use game type instead of game_id
                }
                
                success, response = self.run_test(
                    "Start Icebreaker Game",
                    "POST",
                    "icebreakers/start",
                    404,  # Expected since match doesn't exist
                    data=game_data
                )
                
                if success:
                    print(f"   Start game endpoint working (expected 404)")
                
                # Test submitting answer
                answer_data = {
                    "answer": "Test answer"
                }
                
                success, response = self.run_test(
                    "Submit Game Answer",
                    "POST",
                    "icebreakers/test_game_123/answer",
                    404,  # Expected since game doesn't exist
                    data=answer_data
                )
                
                if success:
                    print(f"   Submit answer endpoint working (expected 404)")
                    return True
        return False

    def test_virtual_gifts_comprehensive(self):
        """Test comprehensive virtual gifts system"""
        # Get available gifts
        success, response = self.run_test(
            "Get Virtual Gifts List",
            "GET",
            "virtual-gifts",
            200,
            is_critical=True
        )
        
        if success and 'gifts' in response:
            gifts = response['gifts']
            print(f"   Found {len(gifts)} virtual gifts available")
            
            # Test sending a gift
            if gifts:
                gift_data = {
                    "match_id": "test_match_123",
                    "gift_id": gifts[0]['id'],
                    "message": "Here's a virtual gift for you!"
                }
                
                success, response = self.run_test(
                    "Send Virtual Gift",
                    "POST",
                    "virtual-gifts/send",
                    404,  # Expected since match doesn't exist
                    data=gift_data
                )
                
                if success:
                    print(f"   Send gift endpoint working (expected 404)")
            
            # Test received gifts
            success, response = self.run_test(
                "Get Received Gifts",
                "GET",
                "virtual-gifts/received",
                200
            )
            
            if success:
                received_count = len(response) if isinstance(response, list) else 0
                print(f"   Found {received_count} received gifts")
                return True
        return False

    def test_places_search(self):
        """Test places search system"""
        # Search places
        success, response = self.run_test(
            "Search Places",
            "GET",
            "places/search?query=restaurant&location=New York",
            200
        )
        
        if success and 'places' in response:
            places = response['places']
            print(f"   Found {len(places)} places")
            
            if places:
                # Test place details
                place_id = places[0].get('id', 'test_place_123')
                success, response = self.run_test(
                    "Get Place Details",
                    "GET",
                    f"places/{place_id}",
                    200
                )
                
                if success:
                    print(f"   Place details retrieved")
        
        # Test place categories
        success, response = self.run_test(
            "Get Place Categories",
            "GET",
            "places/categories",
            200
        )
        
        if success and 'categories' in response:
            categories = response['categories']
            print(f"   Found {len(categories)} place categories")
            return True
        return False

    def test_video_calls(self):
        """Test video call system"""
        # Test initiating a call
        call_data = {
            "match_id": "test_match_123",
            "call_type": "video"
        }
        
        success, response = self.run_test(
            "Initiate Video Call",
            "POST",
            "calls/initiate",
            404,  # Expected since match doesn't exist
            data=call_data
        )
        
        if success:
            print(f"   Initiate call endpoint working (expected 404)")
        
        # Test ICE servers (already tested but part of video calls)
        success, response = self.run_test(
            "Get ICE Servers for Calls",
            "GET",
            "calls/ice-servers",
            200,
            is_critical=True
        )
        
        if success and 'iceServers' in response:
            ice_servers = response['iceServers']
            print(f"   Found {len(ice_servers)} ICE servers")
            
            # Test call reaction
            reaction_data = {
                "reaction": "heart",
                "timestamp": datetime.now().isoformat()
            }
            
            success, response = self.run_test(
                "Send Call Reaction",
                "POST",
                "calls/test_call_123/reaction",
                404,  # Expected since call doesn't exist
                data=reaction_data
            )
            
            if success:
                print(f"   Call reaction endpoint working (expected 404)")
                return True
        return False

    def test_payment_system(self):
        """Test comprehensive payment system"""
        # Test premium plans
        success, response = self.run_test(
            "Get Premium Plans",
            "GET",
            "premium/plans",
            200,
            is_critical=True
        )
        
        if success and 'plans' in response:
            plans = response['plans']
            print(f"   Found {len(plans)} premium plans")
            
            # Test checkout session creation
            checkout_data = {
                "package_id": "monthly",
                "origin_url": self.base_url
            }
            
            success, response = self.run_test(
                "Create Stripe Checkout",
                "POST",
                "payments/checkout",
                200,
                data=checkout_data
            )
            
            if success and 'url' in response and 'session_id' in response:
                session_id = response['session_id']
                print(f"   Checkout session created: {session_id}")
                
                # Test payment status
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

    def test_push_notifications_system(self):
        """Test push notifications system"""
        # Test register FCM token
        token_data = {
            "fcm_token": "test_fcm_token_123456789",
            "device_type": "android"
        }
        
        success, response = self.run_test(
            "Register FCM Token",
            "POST",
            "notifications/register-token",
            200,
            data=token_data
        )
        
        if success:
            print(f"   FCM token registered")
        
        # Test notification preferences
        success, response = self.run_test(
            "Get Notification Preferences",
            "GET",
            "notifications/preferences",
            200
        )
        
        if success:
            print(f"   Notification preferences retrieved")
        
        # Test update preferences
        prefs_data = {
            "new_matches": True,
            "new_messages": True,
            "new_likes": False,
            "standouts": True
        }
        
        success, response = self.run_test(
            "Update Notification Preferences",
            "POST",
            "notifications/preferences",
            200,
            data=prefs_data
        )
        
        if success:
            print(f"   Notification preferences updated")
        
        # Test notification history
        success, response = self.run_test(
            "Get Notification History",
            "GET",
            "notifications/history",
            200
        )
        
        if success:
            history_count = len(response) if isinstance(response, list) else 0
            print(f"   Found {history_count} notifications in history")
            return True
        return False

    def test_user_blocking_reporting(self):
        """Test user blocking and reporting system"""
        # Test block user
        block_data = {"blocked_user_id": "test_user_block_123"}
        
        success, response = self.run_test(
            "Block User",
            "POST",
            "users/block",
            200,
            data=block_data
        )
        
        if success:
            print(f"   User blocked successfully")
            
            # Test get blocked users
            success, response = self.run_test(
                "Get Blocked Users",
                "GET",
                "users/blocked",
                200
            )
            
            if success:
                blocked_count = len(response) if isinstance(response, list) else 0
                print(f"   Found {blocked_count} blocked users")
                
                # Test unblock user
                success, response = self.run_test(
                    "Unblock User",
                    "POST",
                    "users/unblock",
                    200,
                    data=block_data
                )
                
                if success:
                    print(f"   User unblocked successfully")
        
        # Test report user
        report_data = {
            "reported_user_id": "test_user_report_123",
            "reason": "inappropriate_content",
            "details": "Test report for inappropriate behavior"
        }
        
        success, response = self.run_test(
            "Report User",
            "POST",
            "users/report",
            200,
            data=report_data
        )
        
        if success:
            print(f"   User reported successfully")
            return True
        return False

    def test_advanced_filters(self):
        """Test advanced filter system"""
        # Test filter preferences update
        filter_data = {
            "age_min": 25,
            "age_max": 35,
            "max_distance": 25,
            "height_min": 160,
            "height_max": 180,
            "education_levels": ["Bachelor's", "Master's"],
            "specific_interests": ["Travel", "Fitness"],
            "genders": ["woman"],
            "dating_purposes": ["long_term"],
            "religions": ["Christian", "Agnostic"],
            "languages": ["English", "Spanish"],
            "children_preference": ["no_children"],
            "political_views": ["moderate"],
            "pets": ["dog_lover"],
            "ethnicities": ["caucasian"],
            "sub_ethnicities": ["italian"]
        }
        
        success, response = self.run_test(
            "Update Filter Preferences",
            "PUT",
            "preferences/filters",
            200,
            data=filter_data
        )
        
        if success:
            print(f"   Filter preferences updated")
            
            # Test get filter preferences
            success, response = self.run_test(
                "Get Filter Preferences",
                "GET",
                "preferences/filters",
                200
            )
            
            if success:
                print(f"   Filter preferences retrieved")
                return True
        return False

    def test_file_uploads(self):
        """Test comprehensive file upload system"""
        # Test photo upload (base64)
        photo_data = {
            "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77zgAAAABJRU5ErkJggg=="
        }
        
        success, response = self.run_test(
            "Upload Photo Base64",
            "POST",
            "upload/photo/base64",
            200,
            data=photo_data
        )
        
        if success and 'url' in response:
            photo_url = response['url']
            print(f"   Photo uploaded: {photo_url[:50]}...")
            
            # Test photo deletion
            public_id = response.get('public_id')
            if public_id:
                success, response = self.run_test(
                    "Delete Photo",
                    "DELETE",
                    f"upload/photo/{public_id}",
                    200
                )
                
                if success:
                    print(f"   Photo deleted successfully")
        
        # Test video upload (base64)
        video_data = {
            "data": "data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr1tZGF0"
        }
        
        success, response = self.run_test(
            "Upload Video Base64",
            "POST",
            "upload/video/base64",
            200,
            data=video_data
        )
        
        if success and 'url' in response:
            print(f"   Video uploaded: {response['url'][:50]}...")
            return True
        return False

    def test_cloudinary_config(self):
        """Test Cloudinary configuration endpoint"""
        success, response = self.run_test(
            "Get Cloudinary Config",
            "GET",
            "cloudinary/config",
            200
        )
        
        if success and 'cloud_name' in response:
            print(f"   Cloudinary cloud name: {response['cloud_name']}")
            return True
        return False

    def test_profile_management(self):
        """Test comprehensive profile management"""
        # Test profile update (already tested but more comprehensive)
        profile_data = {
            "age": 28,
            "gender": "woman",
            "interested_in": "men",
            "location": "San Francisco",
            "bio": "Love hiking, coffee, and good conversations. Looking for someone genuine!",
            "photos": ["https://images.unsplash.com/photo-1759873821395-c29de82a5b99?w=400"],
            "prompts": [
                {"question": "A perfect Sunday looks like...", "answer": "Brunch with friends followed by a nature hike"},
                {"question": "I'm looking for...", "answer": "Someone who shares my love for adventure and deep conversations"}
            ],
            "interests": ["Hiking", "Coffee", "Photography", "Travel", "Yoga"],
            "height": 165,
            "education": "Master's",
            "dating_purpose": "long_term",
            "religion": "Agnostic",
            "languages": ["English", "Spanish"],
            "children": "want_someday",
            "political_view": "moderate",
            "has_pets": "dog_lover",
            "ethnicity": "mixed",
            "sub_ethnicity": "latin_american"
        }
        
        success, response = self.run_test(
            "Comprehensive Profile Update",
            "PUT",
            "profile",
            200,
            data=profile_data,
            is_critical=True
        )
        
        if success and response.get('is_profile_complete'):
            print(f"   Profile completed with all fields")
            
            # Test photo reordering
            reorder_data = {
                "photos": ["https://images.unsplash.com/photo-1759873821395-c29de82a5b99?w=400"]
            }
            
            success, response = self.run_test(
                "Reorder Profile Photos",
                "PUT",
                "profile/photos/reorder",
                200,
                data=reorder_data
            )
            
            if success:
                print(f"   Photos reordered successfully")
                return True
        return False

    def test_account_deletion(self):
        """Test account deletion (WARNING: This will delete the test account)"""
        # Note: This test is commented out to prevent accidental deletion
        # Uncomment only if you want to test the deletion endpoint
        
        # delete_data = {"password": self.test_user_password}
        # 
        # success, response = self.run_test(
        #     "Delete Account",
        #     "DELETE",
        #     "account",
        #     200,
        #     data=delete_data
        # )
        # 
        # if success and 'deleted_at' in response:
        #     print(f"   Account deleted at: {response['deleted_at']}")
        #     return True
        
        print("   Account deletion test skipped (would delete test account)")
        return True

    def run_all_tests(self):
        """Run all comprehensive API tests"""
        print("🔥 Starting Comprehensive Ember Dating App API Tests\n")
        
        # Test public endpoints first
        print("📋 Testing Public Endpoints...")
        self.test_prompts_library()
        self.test_premium_plans()
        self.test_popular_locations()
        self.test_ambassador_info()
        self.test_cloudinary_config()
        
        # Test authentication flow
        print("\n🔐 Testing Authentication...")
        if self.test_registration():
            self.test_auth_me()
            self.test_login()
            
            # Test OAuth endpoints (mock tests)
            self.test_google_oauth()
            self.test_apple_signin()
            
            # Test comprehensive profile management
            print("\n👤 Testing Profile Management...")
            self.test_profile_management()
            self.test_location_update()
            
            # Test verification system
            print("\n✅ Testing Verification System...")
            self.test_verification_status()
            self.test_verification_photo()
            self.test_phone_verification_flow()
            self.test_id_verification()
            
            # Test swipe limits and discovery
            print("\n🔍 Testing Discovery & Limits...")
            self.test_swipe_limits()
            self.test_discover_ambassador_priority()
            self.test_discover_daily_picks()
            self.test_most_compatible()
            self.test_standouts()
            self.test_pass_profile()
            self.test_undo_pass()
            
            # Test likes system
            print("\n💖 Testing Likes System...")
            self.test_likes_with_push_notifications()
            self.test_received_likes()
            self.test_roses_received()
            
            # Test matching and messaging
            print("\n💬 Testing Matching & Messaging...")
            self.test_match_operations()
            self.test_messaging_system()
            
            # Test virtual features
            print("\n🎮 Testing Virtual Features...")
            self.test_icebreaker_games()
            self.test_virtual_gifts_comprehensive()
            
            # Test date suggestions and places
            print("\n📍 Testing Places & Date Suggestions...")
            self.test_places_search()
            self.test_date_suggestions()
            
            # Test video calls
            print("\n📹 Testing Video Calls...")
            self.test_video_calls()
            self.test_ice_servers()
            
            # Test payment system
            print("\n💳 Testing Payment System...")
            self.test_payment_system()
            
            # Test ambassador features
            print("\n🏆 Testing Ambassador Program...")
            self.test_ambassador_status()
            self.test_ambassador_apply()
            
            # Test push notifications
            print("\n🔔 Testing Push Notifications...")
            self.test_push_notifications_system()
            
            # Test user safety features
            print("\n🛡️ Testing User Safety...")
            self.test_user_blocking_reporting()
            
            # Test advanced filters
            print("\n🔧 Testing Advanced Filters...")
            self.test_advanced_filters()
            
            # Test file uploads
            print("\n📁 Testing File Uploads...")
            self.test_file_uploads()
            
            # Test notifications
            print("\n📬 Testing Notifications...")
            self.test_notifications()
            
            # Test account management (deletion test is skipped)
            print("\n⚙️ Testing Account Management...")
            self.test_account_deletion()
        
        # Print comprehensive summary
        print(f"\n📊 Comprehensive Test Results: {self.tests_passed}/{self.tests_run} passed")
        
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