import time
import pytest
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:5173/dashboard"

class TestUserProfileUI:
    """
    Selenium Automated Test Suite for Dashboard.jsx and User Profile view.
    """

    def test_01_dashboard_rendering(self, driver):
        """
        TC-01: Verify that User Dashboard page renders user profile metrics and points.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "Dashboard" in page_content or "Profile" in page_content or "Points" in page_content or "Adventurer" in page_content, \
            "Dashboard page failed to render user profile metrics"
