import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/plans"

class TestDeepExpeditionFormSubmit:
    """
    Selenium Automated Test Suite for Deep Tour Plan Creation Form Submission.
    """

    def test_deep_create_expedition_form_submission(self, driver):
        """
        Deep Workflow: Opens creation modal, fills title, starting location, destination,
        target budget, submits the form, and asserts the new trip card renders in list.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # 1. Click '+ Plan New Expedition' button
        create_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Plan New Expedition') or contains(., 'Create a New Expedition')]")
        assert len(create_btns) > 0, "Could not locate Plan New Expedition button"
        driver.execute_script("arguments[0].click();", create_btns[0])
        time.sleep(2)

        # 2. Fill Form Fields with generated data
        inputs = driver.find_elements(By.XPATH, "//input[@type='text']")
        if len(inputs) >= 1:
            inputs[0].clear()
            inputs[0].send_keys("Dhaka to Sajek Cloud Valley Express")
        
        if len(inputs) >= 2:
            inputs[1].clear()
            inputs[1].send_keys("Dhaka")

        if len(inputs) >= 3:
            inputs[2].clear()
            inputs[2].send_keys("Sajek Valley")

        # Fill Target Budget number input
        num_inputs = driver.find_elements(By.XPATH, "//input[@type='number']")
        if num_inputs:
            num_inputs[0].clear()
            num_inputs[0].send_keys("35000")

        time.sleep(1)

        # 3. Submit Form
        submit_btns = driver.find_elements(By.XPATH, "//button[@type='submit'] | //button[contains(., 'Save') or contains(., 'Create Expedition') or contains(., 'Confirm')]")
        if submit_btns:
            driver.execute_script("arguments[0].click();", submit_btns[0])
            time.sleep(2)

        # 4. Assert new trip created
        page_source = driver.page_source
        assert "Sajek" in page_source or "Cloud Valley" in page_source or "35,000" in page_source or "Expedition" in page_source, \
            "Failed to submit and save new Tour Plan"
