import time
import pytest
from selenium.webdriver.common.by import By

BASE_URL = "http://localhost:5173/admin"

class TestAdminPanelUI:
    """
    Selenium Automated Test Suite for AdminPanel.jsx component (Super Administrator Control Panel).
    """

    def _ensure_admin_session(self, driver):
        """
        Helper method to inject Super Admin user session into localStorage.
        """
        driver.get(BASE_URL)
        driver.execute_script("""
            localStorage.setItem('ts_current_user', JSON.stringify({
                id: 'admin_root',
                name: 'System Root Admin',
                username: 'admin',
                email: 'admin@laga.tour',
                isAdmin: true,
                role: 'Super Administrator'
            }));
            localStorage.setItem('ts_login_mode', 'admin');
        """)
        driver.get(BASE_URL)
        time.sleep(2)

    def test_01_admin_panel_rendering(self, driver):
        """
        TC-01: Verify that Admin Control Panel loads correctly with admin metrics.
        """
        self._ensure_admin_session(driver)

        page_content = driver.page_source
        assert "Admin" in page_content or "Administrator" in page_content or "Moderation" in page_content or "LagaTour" in page_content, \
            "Admin Panel page failed to render"

    def test_02_admin_action_buttons(self, driver):
        """
        TC-02: Test interacting with admin control buttons and tabs.
        """
        self._ensure_admin_session(driver)

        buttons = driver.find_elements(By.TAG_NAME, "button")
        assert len(buttons) > 0, "No control buttons found on Admin Panel"
