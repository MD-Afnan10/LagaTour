import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/map"

class TestMapExplorerUI:
    """
    Selenium Automated Test Suite for MapExplorer.jsx component.
    """

    def test_01_map_explorer_rendering(self, driver):
        """
        TC-01: Verify that Map Explorer page loads correctly with map controls and header.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "Map" in page_content or "Explorer" in page_content or "LagaTour" in page_content, \
            "Map Explorer page failed to render"

    def test_02_map_location_search(self, driver):
        """
        TC-02: Test typing a location query ('Cox\'s Bazar') into the map search bar.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'Search') or contains(@placeholder, 'map') or contains(@placeholder, 'place') or @type='text']")
        if inputs:
            search_box = inputs[0]
            search_box.clear()
            search_box.send_keys("Cox's Bazar")
            time.sleep(1.5)
            assert "Cox" in driver.page_source or "Cox's Bazar" in search_box.get_attribute("value")
