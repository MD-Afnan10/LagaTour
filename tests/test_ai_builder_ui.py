import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/ai-builder"

class TestAIBuilderUI:
    """
    Selenium Automated Test Suite for AIBuilder.jsx component (AI Itinerary Generator).
    """

    def test_01_ai_builder_page_render(self, driver):
        """
        TC-01: Verify that the AI Builder page loads correctly.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "AI" in page_content or "Itinerary" in page_content or "Builder" in page_content, \
            "AI Builder page failed to render header"

    def test_02_fill_ai_prompt_inputs(self, driver):
        """
        TC-02: Test entering generated custom travel prompt into AI Builder form.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        inputs = driver.find_elements(By.XPATH, "//input[@type='text'] | //textarea")
        if inputs:
            prompt_box = inputs[0]
            prompt_box.clear()
            prompt_box.send_keys("3-day scenic nature trip to Bandarban hills under 15,000 BDT")
            time.sleep(1)
            assert "Bandarban" in prompt_box.get_attribute("value") or "Bandarban" in driver.page_source
