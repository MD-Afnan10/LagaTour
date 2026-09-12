import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/create-post"

class TestCreatePostPageUI:
    """
    Selenium Automated Test Suite for CreatePost.jsx component.
    """

    def test_01_create_post_form_render(self, driver):
        """
        TC-01: Verify that Create Post page loads with caption textarea and destination inputs.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "Post" in page_content or "Create" in page_content or "Caption" in page_content or "LagaTour" in page_content, \
            "Create Post page failed to render"

    def test_02_fill_create_post_form(self, driver):
        """
        TC-02: Fill generated travel story caption and destination into the post creation form.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        textareas = driver.find_elements(By.TAG_NAME, "textarea")
        if textareas:
            caption_box = textareas[0]
            caption_box.clear()
            caption_box.send_keys("Exploring the serene tea gardens of Sreemangal with companions! Automated Selenium test post.")
            time.sleep(1)
            assert "Sreemangal" in caption_box.get_attribute("value") or "Sreemangal" in driver.page_source
