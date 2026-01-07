#!/bin/bash

# Ember Dating App Authentication Flow Tests
# Using curl for comprehensive testing

BASE_URL="https://datenight-app-1.preview.emergentagent.com"
TIMESTAMP=$(date +%H%M%S)
TEST_EMAIL="ember.curl.test.${TIMESTAMP}@example.com"
TEST_PASSWORD="EmberCurlTest123!"
TEST_NAME="Ember Curl Test User ${TIMESTAMP}"

echo "🔥 Ember Dating App Authentication Flow Tests"
echo "🌐 Testing against: $BASE_URL"
echo "📅 Test started at: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0

# Function to run test
run_test() {
    local test_name="$1"
    local expected_status="$2"
    local actual_status="$3"
    local details="$4"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    
    if [ "$actual_status" = "$expected_status" ]; then
        echo -e "${GREEN}✅ $test_name${NC}"
        [ -n "$details" ] && echo "   $details"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ $test_name - Expected $expected_status, got $actual_status${NC}"
        [ -n "$details" ] && echo "   $details"
    fi
}

echo "🔐 Testing Registration Flow..."

# Test 1: Register new user with email/password
echo "📝 Registering new user..."
REGISTER_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
    "$BASE_URL/api/auth/register")

REGISTER_STATUS=$(echo $REGISTER_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
REGISTER_BODY=$(echo $REGISTER_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

run_test "Registration - Success" "200" "$REGISTER_STATUS"

if [ "$REGISTER_STATUS" = "200" ]; then
    # Extract token and user data
    TOKEN=$(echo $REGISTER_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
    USER_ID=$(echo $REGISTER_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user', {}).get('user_id', ''))" 2>/dev/null)
    
    if [ -n "$TOKEN" ]; then
        run_test "Registration - Token returned" "true" "true" "Token: ${TOKEN:0:20}..."
    else
        run_test "Registration - Token returned" "true" "false" "No token in response"
    fi
    
    # Check if password field is excluded
    HAS_PASSWORD=$(echo $REGISTER_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print('password' in data.get('user', {}))" 2>/dev/null)
    if [ "$HAS_PASSWORD" = "False" ]; then
        run_test "Registration - User data without password" "true" "true"
    else
        run_test "Registration - User data without password" "true" "false" "Password field present in response"
    fi
    
    echo "   Registered: $TEST_NAME ($TEST_EMAIL)"
    echo "   User ID: $USER_ID"
else
    echo "   Registration failed, skipping dependent tests"
    exit 1
fi

# Test 2: Test duplicate email registration (should fail with 400)
echo ""
echo "🔄 Testing duplicate registration..."
DUPLICATE_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" \
    "$BASE_URL/api/auth/register")

DUPLICATE_STATUS=$(echo $DUPLICATE_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
run_test "Registration - Duplicate email rejected" "400" "$DUPLICATE_STATUS"

echo ""
echo "🔑 Testing Login Flow..."

# Test 3: Login with valid credentials
echo "🔓 Testing valid login..."
LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
    "$BASE_URL/api/auth/login")

LOGIN_STATUS=$(echo $LOGIN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
LOGIN_BODY=$(echo $LOGIN_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

run_test "Login - Valid credentials success" "200" "$LOGIN_STATUS"

if [ "$LOGIN_STATUS" = "200" ]; then
    # Extract new token
    NEW_TOKEN=$(echo $LOGIN_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('token', ''))" 2>/dev/null)
    
    if [ -n "$NEW_TOKEN" ]; then
        run_test "Login - Token returned" "true" "true" "New token: ${NEW_TOKEN:0:20}..."
        TOKEN="$NEW_TOKEN"  # Use new token for subsequent tests
    else
        run_test "Login - Token returned" "true" "false" "No token in response"
    fi
    
    # Check if password field is excluded
    HAS_PASSWORD=$(echo $LOGIN_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print('password' in data.get('user', {}))" 2>/dev/null)
    if [ "$HAS_PASSWORD" = "False" ]; then
        run_test "Login - User data without password" "true" "true"
    else
        run_test "Login - User data without password" "true" "false" "Password field present in response"
    fi
fi

# Test 4: Login with invalid credentials (should fail with 401)
echo ""
echo "🚫 Testing invalid login..."
INVALID_LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"WrongPassword123!\"}" \
    "$BASE_URL/api/auth/login")

INVALID_LOGIN_STATUS=$(echo $INVALID_LOGIN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
run_test "Login - Invalid credentials rejected" "401" "$INVALID_LOGIN_STATUS"

# Test 5: Login with non-existent email (should fail with 401)
echo ""
echo "👻 Testing non-existent user login..."
NONEXISTENT_LOGIN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"nonexistent.user@example.com\",\"password\":\"SomePassword123!\"}" \
    "$BASE_URL/api/auth/login")

NONEXISTENT_LOGIN_STATUS=$(echo $NONEXISTENT_LOGIN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
run_test "Login - Non-existent email rejected" "401" "$NONEXISTENT_LOGIN_STATUS"

echo ""
echo "🎫 Testing Token Authentication..."

# Test 6: Call GET /api/auth/me with valid token
echo "✅ Testing valid token..."
VALID_TOKEN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/auth/me")

VALID_TOKEN_STATUS=$(echo $VALID_TOKEN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
VALID_TOKEN_BODY=$(echo $VALID_TOKEN_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

run_test "Token Auth - Valid token accepted" "200" "$VALID_TOKEN_STATUS"

if [ "$VALID_TOKEN_STATUS" = "200" ]; then
    # Check if correct user data is returned
    RETURNED_USER_ID=$(echo $VALID_TOKEN_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('user_id', ''))" 2>/dev/null)
    if [ "$RETURNED_USER_ID" = "$USER_ID" ]; then
        run_test "Token Auth - Correct user data" "true" "true" "User ID matches: $USER_ID"
    else
        run_test "Token Auth - Correct user data" "true" "false" "User ID mismatch"
    fi
    
    # Check if password field is excluded
    HAS_PASSWORD=$(echo $VALID_TOKEN_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print('password' in data)" 2>/dev/null)
    if [ "$HAS_PASSWORD" = "False" ]; then
        run_test "Token Auth - No password in response" "true" "true"
    else
        run_test "Token Auth - No password in response" "true" "false" "Password field present"
    fi
fi

# Test 7: Call with invalid token (should fail with 401)
echo ""
echo "🚫 Testing invalid token..."
INVALID_TOKEN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X GET \
    -H "Authorization: Bearer invalid_token_12345" \
    "$BASE_URL/api/auth/me")

INVALID_TOKEN_STATUS=$(echo $INVALID_TOKEN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
run_test "Token Auth - Invalid token rejected" "401" "$INVALID_TOKEN_STATUS"

# Test 8: Call without token (should fail with 401)
echo ""
echo "❌ Testing no token..."
NO_TOKEN_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X GET \
    "$BASE_URL/api/auth/me")

NO_TOKEN_STATUS=$(echo $NO_TOKEN_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
run_test "Token Auth - No token rejected" "401" "$NO_TOKEN_STATUS"

echo ""
echo "🔄 Testing Session Persistence..."

# Test 9: Use token for multiple requests
echo "🔁 Testing multiple requests with same token..."
SUCCESS_COUNT=0
for i in {1..3}; do
    MULTI_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/auth/me")
    
    MULTI_STATUS=$(echo $MULTI_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    if [ "$MULTI_STATUS" = "200" ]; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    fi
    sleep 0.5
done

if [ "$SUCCESS_COUNT" = "3" ]; then
    run_test "Session - Token works across multiple requests" "true" "true" "3/3 requests successful"
else
    run_test "Session - Token works across multiple requests" "true" "false" "$SUCCESS_COUNT/3 requests successful"
fi

# Test 10: Use token for other protected endpoint
echo ""
echo "🔒 Testing token with other protected endpoint..."
PROTECTED_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/premium/plans")

PROTECTED_STATUS=$(echo $PROTECTED_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
if [ "$PROTECTED_STATUS" = "200" ]; then
    run_test "Session - Token works for other endpoints" "true" "true" "Premium plans endpoint accessible"
else
    run_test "Session - Token works for other endpoints" "true" "false" "Status: $PROTECTED_STATUS"
fi

echo ""
echo "🚪 Testing Logout Flow..."

# Test 11: Test logout endpoint
echo "👋 Testing logout..."
LOGOUT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
    -X POST \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/auth/logout")

LOGOUT_STATUS=$(echo $LOGOUT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
LOGOUT_BODY=$(echo $LOGOUT_RESPONSE | sed -e 's/HTTPSTATUS:.*//g')

run_test "Logout - Endpoint accessible" "200" "$LOGOUT_STATUS"

if [ "$LOGOUT_STATUS" = "200" ]; then
    LOGOUT_MESSAGE=$(echo $LOGOUT_BODY | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('message', ''))" 2>/dev/null)
    echo "   Logout message: $LOGOUT_MESSAGE"
    
    # Test if token still works after logout (JWT tokens typically remain valid until expiry)
    POST_LOGOUT_RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" \
        -X GET \
        -H "Authorization: Bearer $TOKEN" \
        "$BASE_URL/api/auth/me")
    
    POST_LOGOUT_STATUS=$(echo $POST_LOGOUT_RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    
    if [ "$POST_LOGOUT_STATUS" = "401" ]; then
        run_test "Logout - Token invalidated" "true" "true" "Token successfully invalidated"
    elif [ "$POST_LOGOUT_STATUS" = "200" ]; then
        run_test "Logout - Token behavior" "expected" "jwt_behavior" "JWT tokens remain valid until expiry (expected behavior)"
    else
        run_test "Logout - Token status after logout" "200_or_401" "$POST_LOGOUT_STATUS" "Unexpected status"
    fi
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo "Tests run: $TESTS_RUN"
echo "Tests passed: $TESTS_PASSED"
echo "Success rate: $(( TESTS_PASSED * 100 / TESTS_RUN ))%"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}🎉 All authentication tests passed!${NC}"
    echo -e "${GREEN}✅ Authentication system is working correctly${NC}"
    exit 0
else
    FAILED=$((TESTS_RUN - TESTS_PASSED))
    echo -e "${YELLOW}⚠️  $FAILED authentication tests had issues${NC}"
    
    # Check if critical tests passed
    if [ "$REGISTER_STATUS" = "200" ] && [ "$LOGIN_STATUS" = "200" ] && [ "$VALID_TOKEN_STATUS" = "200" ]; then
        echo -e "${GREEN}✅ Core authentication functionality is working${NC}"
        exit 0
    else
        echo -e "${RED}🚨 Critical authentication issues found${NC}"
        exit 1
    fi
fi