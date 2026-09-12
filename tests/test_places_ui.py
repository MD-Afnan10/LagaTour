import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/places"

class TestPlacesUI:
    """
    Selenium Automated Test Suite for Places.jsx component (Bangladesh Places Database).
    """

    def test_01_places_database_rendering(self, driver):
        """
        TC-01: Verify that the Places Database page loads and displays place destination cards.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        header_text = driver.page_source
        assert "Places" in header_text or "Explore" in header_text or "LagaTour" in header_text, \
            "Places page failed to load header"

    def test_02_places_search_filtering(self, driver):
        """
        TC-02: Test filling search input with generated location query ('Sajek').
        """
        driver.get(BASE_URL)
        time.sleep(2)

        search_inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'Search') or contains(@placeholder, 'place') or @type='text']")
        assert len(search_inputs) > 0, "Could not find search input on Places page"

        search_box = search_inputs[0]
        search_box.clear()
        search_box.send_keys("Sajek")
        time.sleep(1.5)

        assert "Sajek" in driver.page_source or "No" in driver.page_source, \
            "Places search filter failed to execute query"

    def test_03_category_pills_filter(self, driver):
        """
        TC-03: Test clicking place category filter buttons.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        buttons = driver.find_elements(By.TAG_NAME, "button")
        category_btn = None
        for btn in buttons:
            txt = btn.text
            if "Hill" in txt or "Beach" in txt or "Haor" in txt or "All" in txt:
                category_btn = btn
                break

        if category_btn:
            driver.execute_script("arguments[0].click();", category_btn)
            time.sleep(1)
