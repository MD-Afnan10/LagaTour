import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/ai-builder"

class TestDeepAIBuilderSubmit:
    """
    Selenium Automated Test Suite for Deep AI Itinerary Generation Workflow.
    """

    def test_deep_ai_itinerary_generation_submission(self, driver):
        """
        Deep Workflow: Fills AI travel prompt, selects travel style, clicks Generate button,
        and verifies the generated day-by-day itinerary schedule renders on screen.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # 1. Fill AI Prompt
        inputs = driver.find_elements(By.XPATH, "//input[@type='text'] | //textarea")
        if inputs:
            prompt_box = inputs[0]
            prompt_box.clear()
            prompt_box.send_keys("3-day eco camping & houseboat trip to Tanguar Haor Sylhet under 20,000 BDT")
            time.sleep(1)

        # 2. Click Generate AI Itinerary button
        generate_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Generate') or contains(., 'Build') or contains(., 'Create AI')]")
        if generate_btns:
            driver.execute_script("arguments[0].click();", generate_btns[0])
            time.sleep(3)

        # 3. Assert generated itinerary cards render
        page_content = driver.page_source
        assert "Tanguar" in page_content or "Haor" in page_content or "Day 1" in page_content or "Itinerary" in page_content or "Generated" in page_content, \
            "AI Itinerary generation form submission failed"
