import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.chrome.options import Options as ChromeOptions
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = "http://localhost:5173/plans"

@pytest.fixture(scope="function")
def driver():
    """
    PyTest fixture to initialize and yield a Selenium Chrome WebDriver instance,
    injecting authentication session into localStorage so ProtectedLayout allows access to /plans.
    """
    options = ChromeOptions()
    options.add_argument("--start-maximized")
    options.add_argument("--disable-notifications")
    options.add_argument("--no-sandbox")
    # Comment out headless line below to make browser VISIBLE on screen:
    # options.add_argument("--headless=new")

    web_driver = None
    try:
        service = ChromeService(ChromeDriverManager().install())
        web_driver = webdriver.Chrome(service=service, options=options)
    except Exception:
        web_driver = webdriver.Chrome(options=options)

    web_driver.implicitly_wait(8)
    
    # 1. Load domain page to establish localStorage context
    web_driver.get(BASE_URL)
    
    # 2. Inject logged-in user session into localStorage
    try:
        web_driver.execute_script("""
            localStorage.setItem('ts_current_user', JSON.stringify({
                id: 'test_user_01',
                name: 'Test Adventurer',
                username: 'testuser',
                email: 'testuser@lagatour.com',
                points: 1500,
                league: 'Traveler',
                isAdmin: false
            }));
        """)
        # 3. Reload page with authenticated session active
        web_driver.get(BASE_URL)
        time.sleep(1.5)
    except Exception as e:
        print("Session injection warning:", e)

    yield web_driver

    try:
        web_driver.quit()
    except Exception:
        pass
