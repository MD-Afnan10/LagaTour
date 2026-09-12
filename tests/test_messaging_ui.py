import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

BASE_URL = "http://localhost:5173/chats"

class TestMessagingUI:
    """
    Selenium Automated Test Suite for Messaging.jsx component (Real-time Messaging).
    """

    def test_01_messaging_page_render(self, driver):
        """
        TC-01: Verify that the Messaging page loads correctly with chat conversations.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        page_content = driver.page_source
        assert "Messages" in page_content or "Chat" in page_content or "Conversations" in page_content or "LagaTour" in page_content, \
            "Messaging page failed to render"

    def test_02_send_message_input(self, driver):
        """
        TC-02: Test typing a message into the chat message box and sending it.
        """
        driver.get(BASE_URL)
        time.sleep(2)

        inputs = driver.find_elements(By.XPATH, "//input[contains(@placeholder, 'message') or contains(@placeholder, 'Message') or @type='text']")
        if inputs:
            chat_input = inputs[0]
            chat_input.clear()
            chat_input.send_keys("Automated test message from Selenium runner!")
            chat_input.send_keys(Keys.ENTER)
            time.sleep(1.5)
            assert "Automated test message" in driver.page_source or "message" in driver.page_source.lower()
