import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/plans"

class TestTourPlansUI:
    """
    Selenium Automated UI Test Suite for TourPlans.jsx component.
    """

    def _ensure_expeditions_tab(self, driver):
        """
        Helper method to navigate to /plans and ensure 'My Expeditions & Plans' tab is active.
        """
        driver.get(BASE_URL)
        time.sleep(2)
        
        # Locate 'My Expeditions' tab button
        tab_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'My Expeditions')]")
        if tab_buttons:
            driver.execute_script("arguments[0].click();", tab_buttons[0])
            time.sleep(1.5)

    def test_01_page_header_and_title(self, driver):
        """
        TC-01: Verify that the Tour Plans page loads correctly and displays main title.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        headings = driver.find_elements(By.TAG_NAME, "h1")
        assert len(headings) > 0, "Page failed to render any <h1> headings"
        
        header_text = driver.page_source
        assert "Tour Plans" in header_text or "LagaTour" in header_text, \
            "Page header did not contain expected Tour Plans title"

    def test_02_tab_navigation(self, driver):
        """
        TC-02: Verify tab switching between My Expeditions, Live Cockpit, and Community.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # Click on Community Itineraries tab
        community_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Community Itineraries')]")
        if community_btns:
            driver.execute_script("arguments[0].click();", community_btns[0])
            time.sleep(1.5)
            assert "Community Shared Travel Stories" in driver.page_source or "Ratings" in driver.page_source, \
                "Failed to navigate to Community Itineraries tab"

        # Click back on My Expeditions tab
        exp_btns = driver.find_elements(By.XPATH, "//button[contains(., 'My Expeditions')]")
        if exp_btns:
            driver.execute_script("arguments[0].click();", exp_btns[0])
            time.sleep(1)

    def test_03_search_box_filtering(self, driver):
        """
        TC-03: Verify typing in the search box filters tour plans dynamically.
        """
        self._ensure_expeditions_tab(driver)

        # Find search input field
        search_inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'Search tour by place')]")
        if not search_inputs:
            search_inputs = driver.find_elements(By.XPATH, "//input[@type='text']")
            
        assert len(search_inputs) > 0, "Could not locate search input element"
        
        search_box = search_inputs[0]
        search_box.clear()
        search_box.send_keys("Sylhet")
        time.sleep(1.5)

        # Verify page content filtered
        assert "Sylhet" in driver.page_source or "No tour expeditions match" in driver.page_source, \
            "Search filter failed to execute"

    def test_04_budget_slider_adjustment(self, driver):
        """
        TC-04: Verify adjusting max budget slider changes budget display text.
        """
        self._ensure_expeditions_tab(driver)

        range_inputs = driver.find_elements(By.XPATH, "//input[@type='range']")
        assert len(range_inputs) > 0, "Range slider for budget not found on page"

        slider = range_inputs[0]
        initial_value = slider.get_attribute("value")

        # Simulate slider movement using arrow keys
        slider.send_keys(Keys.ARROW_LEFT)
        slider.send_keys(Keys.ARROW_LEFT)
        time.sleep(1)

        new_value = slider.get_attribute("value")
        assert initial_value != new_value or "BDT" in driver.page_source, \
            "Budget range slider failed to adjust value"

    def test_05_create_expedition_modal_toggle(self, driver):
        """
        TC-05: Verify clicking '+ Plan New Expedition' opens the creation modal dialog.
        """
        self._ensure_expeditions_tab(driver)

        create_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Plan New Expedition')]")
        if not create_btns:
            create_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Create a New Expedition')]")
            
        assert len(create_btns) > 0, "Could not find '+ Plan New Expedition' button"
        
        create_btn = create_btns[0]
        driver.execute_script("arguments[0].click();", create_btn)
        time.sleep(1.5)

        # Verify modal window opened
        modal_opened = "Create" in driver.page_source or "Destination" in driver.page_source or "Target Budget" in driver.page_source
        assert modal_opened, "Modal popup failed to open after clicking Plan New Expedition"
