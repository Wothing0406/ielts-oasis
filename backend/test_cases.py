import httpx
import random

BASE_URL = "http://100.127.204.9:8000"

def run_tests():
    print("=== STARTING AUTOMATED TEST CASES FOR USERNAME & PASSWORD AUTH ===")
    
    # Generate unique test username to avoid conflicts
    rand_id = random.randint(1000, 9999)
    test_user = f"user.{rand_id}"
    test_pass = "secure123"

    # CASE 1: Register with too short username (< 3 chars)
    print("\nCase 1: Register with too short username ('ab')")
    res = httpx.post(f"{BASE_URL}/auth/register", json={"username": "ab", "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 400
    assert "từ 3 đến 20" in res.text
    print("Case 1: PASSED")

    # CASE 2: Register with invalid characters in username (uppercase, spaces)
    print("\nCase 2: Register with invalid characters ('User Name')")
    res = httpx.post(f"{BASE_URL}/auth/register", json={"username": "User Name", "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 400
    assert "chỉ được chứa chữ cái thường" in res.text
    print("Case 2: PASSED")

    # CASE 3: Register with too short password (< 6 chars)
    print("\nCase 3: Register with short password ('123')")
    res = httpx.post(f"{BASE_URL}/auth/register", json={"username": test_user, "password": "123", "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 400
    assert "Mật khẩu phải có ít nhất 6 ký tự" in res.text
    print("Case 3: PASSED")

    # CASE 4: Register a valid user
    print(f"\nCase 4: Registering a valid user ('{test_user}')")
    res = httpx.post(f"{BASE_URL}/auth/register", json={"username": test_user, "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 200
    assert "Đăng ký tài khoản thành công" in res.json()["message"]
    print("Case 4: PASSED")

    # CASE 5: Register duplicate username
    print(f"\nCase 5: Registering duplicate username ('{test_user}')")
    res = httpx.post(f"{BASE_URL}/auth/register", json={"username": test_user, "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 400
    assert "đã tồn tại" in res.text
    print("Case 5: PASSED")

    # CASE 6: Login with correct credentials
    print(f"\nCase 6: Login with correct credentials for ('{test_user}')")
    res = httpx.post(f"{BASE_URL}/auth/login", json={"username": test_user, "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200
    data = res.json()
    assert "token" in data
    assert "guest_id" in data
    assert data["user"]["username"] == test_user
    print("Case 6: PASSED")

    # CASE 7: Login with wrong password
    print(f"\nCase 7: Login with wrong password for ('{test_user}')")
    res = httpx.post(f"{BASE_URL}/auth/login", json={"username": test_user, "password": "wrongpassword", "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 401
    assert "không chính xác" in res.json()["detail"]
    print("Case 7: PASSED")

    # CASE 8: Login with non-existent username
    print("\nCase 8: Login with non-existent username ('doesnotexist')")
    res = httpx.post(f"{BASE_URL}/auth/login", json={"username": "doesnotexist", "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 401
    assert "không chính xác" in res.json()["detail"]
    print("Case 8: PASSED")

    # CASE 9: Register with empty inputs
    print("\nCase 9: Register with empty username/password")
    res = httpx.post(f"{BASE_URL}/auth/register", json={"username": "  ", "password": "  ", "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.text}")
    assert res.status_code == 400
    print("Case 9: PASSED")

    # CASE 10: Validate username case insensitivity
    print(f"\nCase 10: Login with uppercase username ('{test_user.upper()}')")
    res = httpx.post(f"{BASE_URL}/auth/login", json={"username": test_user.upper(), "password": test_pass, "captcha_token": "dummy_token"})
    print(f"Status: {res.status_code}, Response: {res.json()}")
    assert res.status_code == 200
    assert res.json()["user"]["username"] == test_user
    print("Case 10: PASSED")

    print("\n=== ALL 10 AUTHENTICATION TEST CASES PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_tests()
