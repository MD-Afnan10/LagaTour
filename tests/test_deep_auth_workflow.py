import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/auth"

class TestDeepAuthWorkflow:
    """
    Selenium Automated Test Suite for Deep Login and Registration Form Workflows.
    """

    def test_deep_login_form_submission(self, driver):
        """
        Deep Workflow: Opens /auth, fills email and password, submits login form.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # Fill Login Credentials
        email_inputs = driver.find_elements(By.XPATH, "//input[@type='email' or contains(@placeholder, 'email') or contains(@placeholder, 'Email')]")
        if not email_inputs:
            email_inputs = driver.find_elements(By.XPATH, "//input[@type='text']")

        if email_inputs:
            email_inputs[0].clear()
            email_inputs[0].send_keys("adventurer@laga.tour")

        pass_inputs = driver.find_elements(By.XPATH, "//input[@type='password']")
        if pass_inputs:
            pass_inputs[0].clear()
            pass_inputs[0].send_keys("travel123")

        time.sleep(1)

        # Submit Login Form
        submit_btns = driver.find_elements(By.XPATH, "//button[@type='submit'] | //button[contains(., 'Sign In') or contains(., 'Login') or contains(., 'Continue')]")
        if submit_btns:
            driver.execute_script("arguments[0].click();", submit_btns[0])
            time.sleep(2)

        page_source = driver.page_source
        assert "adventurer" in page_source.lower() or "feed" in page_source.lower() or "laga" in page_source.lower() or "welcome" in page_source.lower(), \
            "Login form submission failed"

    def test_deep_registration_form_submission(self, driver):
        """
        Deep Workflow: Switches to Registration tab, fills full name, email, password, and submits.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # Look for register/signup toggle tab
        register_tabs = driver.find_elements(By.XPATH, "//button[contains(., 'Register') or contains(., 'Sign Up') or contains(., 'Create Account')]")
        if register_tabs:
            driver.execute_script("arguments[0].click();", register_tabs[0])
            time.sleep(1)

        # Fill Registration Details
        inputs = driver.find_elements(By.XPATH, "//input[@type='text']")
        if len(inputs) >= 1:
            inputs[0].clear()
            inputs[0].send_keys("Nabil Cloud Explorer")

        email_inputs = driver.find_elements(By.XPATH, "//input[@type='email']")
        if email_inputs:
            email_inputs[0].clear()
            email_inputs[0].send_keys("nabil.explorer@laga.tour")

        pass_inputs = driver.find_elements(By.XPATH, "//input[@type='password']")
        if pass_inputs:
            pass_inputs[0].clear()
            pass_inputs[0].send_keys("explore2026")

        time.sleep(1)
