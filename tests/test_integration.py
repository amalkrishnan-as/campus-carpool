import pytest


USER_A = {
    "name": "Alice Student",
    "email": "alice@college.edu",
    "password": "Password123!",
}

USER_B = {
    "name": "Bob Student",
    "email": "bob@college.edu",
    "password": "Password456!",
}


def register_and_activate(client, db, user_data):
    """Register a user and activate them directly in the DB."""
    r = client.post("/api/v1/auth/register", json=user_data)
    assert r.status_code == 201, r.text
    from app.models import User, UserStatus
    user = db.query(User).filter(User.email == user_data["email"]).first()
    user.status = UserStatus.ACTIVE
    db.commit()
    return user


def login(client, email, password):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


class TestAuth:
    def test_register_invalid_email(self, client):
        r = client.post("/api/v1/auth/register", json={
            "name": "Test User", "email": "user@gmail.com", "password": "Password123!"
        })
        assert r.status_code == 400
        assert "INVALID_COLLEGE_EMAIL" in r.text

    def test_register_success(self, client):
        r = client.post("/api/v1/auth/register", json={
            "name": "Charlie", "email": "charlie@college.edu", "password": "Password123!"
        })
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "charlie@college.edu"
        assert data["status"] == "PENDING_VERIFICATION"

    def test_register_duplicate_email(self, client):
        payload = {"name": "Dup User", "email": "dup@college.edu", "password": "Password123!"}
        client.post("/api/v1/auth/register", json=payload)
        r = client.post("/api/v1/auth/register", json=payload)
        assert r.status_code == 409

    def test_login_invalid(self, client):
        r = client.post("/api/v1/auth/login", json={"email": "no@college.edu", "password": "wrong"})
        assert r.status_code == 401

    def test_login_success(self, client, db):
        register_and_activate(client, db, USER_A)
        token = login(client, USER_A["email"], USER_A["password"])
        assert token

    def test_get_me(self, client, db):
        register_and_activate(client, db, {"name": "Me User", "email": "me@college.edu", "password": "Password123!"})
        token = login(client, "me@college.edu", "Password123!")
        r = client.get("/api/v1/users/me", headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 200
        assert r.json()["email"] == "me@college.edu"

    def test_protected_without_token(self, client):
        r = client.get("/api/v1/users/me")
        assert r.status_code in (401, 403)  # HTTPBearer returns 401 or 403 when no credentials


class TestVehicles:
    def test_create_vehicle(self, client, db):
        register_and_activate(client, db, {"name": "Vehicle Owner", "email": "vown@college.edu", "password": "Password123!"})
        token = login(client, "vown@college.edu", "Password123!")
        r = client.post("/api/v1/vehicles", json={
            "type": "Car", "model": "Honda City",
            "registration_number": "KL01AB1234", "seat_capacity": 4
        }, headers={"Authorization": f"Bearer {token}"})
        assert r.status_code == 201
        assert r.json()["model"] == "Honda City"


class TestRides:
    def test_create_and_search_ride(self, client, db):
        # Create driver
        register_and_activate(client, db, {"name": "Driver Dan", "email": "driver@college.edu", "password": "Password123!"})
        driver_token = login(client, "driver@college.edu", "Password123!")
        headers = {"Authorization": f"Bearer {driver_token}"}

        # Create vehicle
        vr = client.post("/api/v1/vehicles", json={
            "type": "Car", "model": "Swift",
            "registration_number": "KL02XY5678", "seat_capacity": 4
        }, headers=headers)
        vehicle_id = vr.json()["id"]

        # Create ride
        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=2)).strftime("%Y-%m-%d")
        rr = client.post("/api/v1/rides", json={
            "vehicle_id": vehicle_id,
            "source": "College Main Gate",
            "destination": "City Bus Stand",
            "pickup_point": "Library",
            "departure_date": future_date,
            "departure_time": "08:00",
            "available_seats": 3,
            "contribution": "50.00"
        }, headers=headers)
        assert rr.status_code == 201
        ride = rr.json()
        assert ride["source"] == "College Main Gate"
        assert ride["status"] == "OPEN"

        # Search for the ride
        sr = client.get(f"/api/v1/rides/search?source=College&destination=City")
        assert sr.status_code == 200
        assert sr.json()["total"] >= 1

    def test_cannot_request_own_ride(self, client, db):
        register_and_activate(client, db, {"name": "Self Req", "email": "selfr@college.edu", "password": "Password123!"})
        token = login(client, "selfr@college.edu", "Password123!")
        headers = {"Authorization": f"Bearer {token}"}

        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")
        rr = client.post("/api/v1/rides", json={
            "source": "A", "destination": "B", "pickup_point": "C",
            "departure_date": future_date, "departure_time": "09:00",
            "available_seats": 2, "contribution": "0"
        }, headers=headers)
        ride_id = rr.json()["id"]

        r = client.post(f"/api/v1/rides/{ride_id}/requests", headers=headers)
        assert r.status_code == 400

    def test_seat_transaction(self, client, db):
        """Test that accepting a request decrements seats correctly."""
        # Driver
        register_and_activate(client, db, {"name": "Seat Driver", "email": "seatdrv@college.edu", "password": "Password123!"})
        drv_token = login(client, "seatdrv@college.edu", "Password123!")
        drv_headers = {"Authorization": f"Bearer {drv_token}"}

        # Passenger
        register_and_activate(client, db, {"name": "Seat Pass", "email": "seatpass@college.edu", "password": "Password123!"})
        pass_token = login(client, "seatpass@college.edu", "Password123!")
        pass_headers = {"Authorization": f"Bearer {pass_token}"}

        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=4)).strftime("%Y-%m-%d")
        rr = client.post("/api/v1/rides", json={
            "source": "Start", "destination": "End", "pickup_point": "Middle",
            "departure_date": future_date, "departure_time": "10:00",
            "available_seats": 1, "contribution": "0"
        }, headers=drv_headers)
        ride_id = rr.json()["id"]

        # Passenger requests
        req_r = client.post(f"/api/v1/rides/{ride_id}/requests", headers=pass_headers)
        assert req_r.status_code == 201
        request_id = req_r.json()["id"]

        # Driver accepts
        acc_r = client.post(f"/api/v1/requests/{request_id}/accept", headers=drv_headers)
        assert acc_r.status_code == 200
        assert acc_r.json()["status"] == "ACCEPTED"

        # Ride should be FULL now
        ride_r = client.get(f"/api/v1/rides/{ride_id}")
        assert ride_r.json()["status"] == "FULL"
        assert ride_r.json()["available_seats"] == 0

    def test_duplicate_request_rejected(self, client, db):
        register_and_activate(client, db, {"name": "Dup Drv", "email": "dupdrv@college.edu", "password": "Password123!"})
        register_and_activate(client, db, {"name": "Dup Pass", "email": "duppass@college.edu", "password": "Password123!"})
        drv_token = login(client, "dupdrv@college.edu", "Password123!")
        pass_token = login(client, "duppass@college.edu", "Password123!")

        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=5)).strftime("%Y-%m-%d")
        rr = client.post("/api/v1/rides", json={
            "source": "X", "destination": "Y", "pickup_point": "Z",
            "departure_date": future_date, "departure_time": "11:00",
            "available_seats": 3, "contribution": "0"
        }, headers={"Authorization": f"Bearer {drv_token}"})
        ride_id = rr.json()["id"]

        pass_headers = {"Authorization": f"Bearer {pass_token}"}
        r1 = client.post(f"/api/v1/rides/{ride_id}/requests", headers=pass_headers)
        assert r1.status_code == 201
        r2 = client.post(f"/api/v1/rides/{ride_id}/requests", headers=pass_headers)
        assert r2.status_code == 409

    def test_reject_and_cancel_request(self, client, db):
        register_and_activate(client, db, {"name": "Reject Drv", "email": "rejdrv@college.edu", "password": "Password123!"})
        register_and_activate(client, db, {"name": "Reject Pass", "email": "rejpass@college.edu", "password": "Password123!"})
        drv_token = login(client, "rejdrv@college.edu", "Password123!")
        pass_token = login(client, "rejpass@college.edu", "Password123!")

        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=6)).strftime("%Y-%m-%d")
        rr = client.post("/api/v1/rides", json={
            "source": "Campus", "destination": "Town", "pickup_point": "Gate",
            "departure_date": future_date, "departure_time": "12:00",
            "available_seats": 2, "contribution": "10"
        }, headers={"Authorization": f"Bearer {drv_token}"})
        ride_id = rr.json()["id"]

        pass_headers = {"Authorization": f"Bearer {pass_token}"}
        req_res = client.post(f"/api/v1/rides/{ride_id}/requests", headers=pass_headers)
        req_id = req_res.json()["id"]

        # Driver rejects
        rej_res = client.post(f"/api/v1/requests/{req_id}/reject", headers={"Authorization": f"Bearer {drv_token}"})
        assert rej_res.status_code == 200
        assert rej_res.json()["status"] == "REJECTED"

    def test_complete_ride_and_rate(self, client, db):
        drv = register_and_activate(client, db, {"name": "Rate Drv", "email": "ratedrv@college.edu", "password": "Password123!"})
        pas = register_and_activate(client, db, {"name": "Rate Pass", "email": "ratepass@college.edu", "password": "Password123!"})
        drv_token = login(client, "ratedrv@college.edu", "Password123!")
        pass_token = login(client, "ratepass@college.edu", "Password123!")

        from datetime import date, timedelta
        future_date = (date.today() + timedelta(days=7)).strftime("%Y-%m-%d")
        rr = client.post("/api/v1/rides", json={
            "source": "A", "destination": "B", "pickup_point": "C",
            "departure_date": future_date, "departure_time": "14:00",
            "available_seats": 2, "contribution": "25"
        }, headers={"Authorization": f"Bearer {drv_token}"})
        ride_id = rr.json()["id"]

        # Passenger requests and driver accepts
        req_res = client.post(f"/api/v1/rides/{ride_id}/requests", headers={"Authorization": f"Bearer {pass_token}"})
        req_id = req_res.json()["id"]
        client.post(f"/api/v1/requests/{req_id}/accept", headers={"Authorization": f"Bearer {drv_token}"})

        # Start and Complete ride
        start_res = client.post(f"/api/v1/rides/{ride_id}/start", headers={"Authorization": f"Bearer {drv_token}"})
        assert start_res.status_code == 200
        comp_res = client.post(f"/api/v1/rides/{ride_id}/complete", headers={"Authorization": f"Bearer {drv_token}"})
        assert comp_res.status_code == 200
        assert comp_res.json()["status"] == "COMPLETED"

        # Rate driver
        rate_res = client.post(f"/api/v1/rides/{ride_id}/ratings", json={
            "reviewed_user_id": str(drv.id),
            "rating": 5,
            "comment": "Punctual and friendly ride!"
        }, headers={"Authorization": f"Bearer {pass_token}"})
        assert rate_res.status_code == 201
        assert rate_res.json()["rating"] == 5


class TestReportsAndAdmin:
    def test_report_user(self, client, db):
        u1 = register_and_activate(client, db, {"name": "Rep One", "email": "rep1@college.edu", "password": "Password123!"})
        u2 = register_and_activate(client, db, {"name": "Rep Two", "email": "rep2@college.edu", "password": "Password123!"})
        t1 = login(client, "rep1@college.edu", "Password123!")

        rep_res = client.post("/api/v1/reports", json={
            "reported_user_id": str(u2.id),
            "reason": "MISCONDUCT",
            "description": "Late arrival without notification"
        }, headers={"Authorization": f"Bearer {t1}"})
        assert rep_res.status_code == 201
        assert rep_res.json()["reason"] == "MISCONDUCT"

    def test_admin_analytics_and_users(self, client, db):
        from app.models import UserRole
        admin = register_and_activate(client, db, {"name": "Admin Boss", "email": "admin@college.edu", "password": "Password123!"})
        admin.role = UserRole.ADMIN
        db.commit()
        admin_token = login(client, "admin@college.edu", "Password123!")

        res = client.get("/api/v1/admin/analytics", headers={"Authorization": f"Bearer {admin_token}"})
        assert res.status_code == 200
        assert res.json()["total_users"] >= 1
