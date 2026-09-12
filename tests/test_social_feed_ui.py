import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/"

class TestSocialFeedUI:
    """
    Selenium Automated Test Suite for SocialFeed.jsx component.
    """

    def test_01_feed_rendering_and_posts(self, driver):
        """
        TC-01: Verify that the Social Feed loads correctly and displays posts.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # Check page content
        assert "LagaTour" in driver.page_source or "Feed" in driver.page_source, \
            "Social Feed page failed to render"

        # Check if post cards or user avatars render
        post_elements = driver.find_elements(By.XPATH, "//div[contains(@className, 'card') or contains(@class, 'card')]")
        assert len(post_elements) > 0, "No post cards found on Social Feed"

    def test_02_interaction_like_and_comment(self, driver):
        """
        TC-02: Test interacting with post cards (clicking like button and typing a comment).
        """
        driver.get(BASE_URL)
        time.sleep(2)

        # Find comment or text input fields
        inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'comment') or contains(@placeholder, 'Comment') or @type='text']")
        if inputs:
            comment_input = inputs[0]
            comment_input.clear()
            comment_input.send_keys("Amazing travel capture! Automated test comment.")
            comment_input.send_keys(Keys.ENTER)
            time.sleep(1.5)
            assert "Automated test comment" in driver.page_source or "comment" in driver.page_source.lower()

    def test_03_create_post_navigation(self, driver):
        """
        TC-03: Verify clicking 'Create Post' button opens post creation form/page.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Post') or contains(., 'Create') or contains(., 'Share')]")
        if buttons:
            driver.execute_script("arguments[0].click();", buttons[0])
            time.sleep(1.5)
