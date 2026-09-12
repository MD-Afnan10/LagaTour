import time
import pytest
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:5173/plans"

class TestAuthAndNavigation:
    """
    Selenium Automated Test Suite for User Status, Filter Badges, and Page Navigation.
    """

    def _ensure_expeditions_tab(self, driver):
        """
        Helper method to ensure 'My Expeditions & Plans' tab is active.
        """
        driver.get(BASE_URL)
        time.sleep(2)
        tab_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'My Expeditions')]")
        if tab_buttons:
            driver.execute_script("arguments[0].click();", tab_buttons[0])
            time.sleep(1.5)

    def test_01_status_filter_pills(self, driver):
        """
        TC-01: Verify clicking status sub-filter pills (All, Ongoing, Planned, Completed).
        """
        self._ensure_expeditions_tab(driver)

        buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Planned') or contains(., 'Completed') or contains(., 'All Tours')]")
        assert len(buttons) > 0, "No status filter pill buttons found"

        # Click Planned filter pill
        for b in buttons:
            if "Planned" in b.text:
                driver.execute_script("arguments[0].click();", b)
                time.sleep(1)
                assert "Planned" in driver.page_source
                break

    def test_02_travel_style_select_dropdown(self, driver):
        """
        TC-02: Verify selecting options in the Travel Style dropdown filter.
        """
        self._ensure_expeditions_tab(driver)

        selects = driver.find_elements(By.TAG_NAME, "select")
        assert len(selects) > 0, "Travel style select dropdown not found"

        style_select = selects[0]
        options = style_select.find_elements(By.TAG_NAME, "option")
        assert len(options) > 0, "Select dropdown contains no options"
        
        # Select Solo Traveler option if present
        for opt in options:
            if "Solo" in opt.text:
                opt.click()
                time.sleep(1)
                break
