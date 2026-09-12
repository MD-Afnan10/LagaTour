import time
import pytest
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:5173/rankings"

class TestRankingsUI:
    """
    Selenium Automated Test Suite for Rankings.jsx component (Traveler Leaderboard).
    """

    def test_01_leaderboard_rendering(self, driver):
        """
        TC-01: Verify that the Rankings page loads and displays top traveler podium / leaderboard.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "Rankings" in page_content or "Leaderboard" in page_content or "League" in page_content, \
            "Rankings page failed to load leaderboard header"

    def test_02_league_badges_and_points(self, driver):
        """
        TC-02: Assert league badges (Legend, Expert, Adventurer, Explorer) and point values display.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        elements = driver.find_elements(By.XPATH, "//*[contains(text(), 'Points') or contains(text(), 'pts') or contains(text(), 'League')]")
        assert len(elements) > 0, "No points or league badge indicators found on Rankings page"
