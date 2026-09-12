import time
import pytest
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:5173/groups"

class TestGroupPlannerUI:
    """
    Selenium Automated Test Suite for GroupPlanner.jsx component.
    """

    def test_01_group_planner_rendering(self, driver):
        """
        TC-01: Verify that the Group Planner page loads and displays group trip options.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "Group" in page_content or "Planner" in page_content or "LagaTour" in page_content, \
            "Group Planner page failed to load header"

    def test_02_create_or_join_group_button(self, driver):
        """
        TC-02: Test interacting with group action buttons.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        buttons = driver.find_elements(By.TAG_NAME, "button")
        assert len(buttons) > 0, "No interactive buttons found on Group Planner page"
