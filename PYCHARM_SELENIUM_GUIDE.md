# LagaTour - Selenium Automation & PyCharm Setup Guide

This guide provides step-by-step instructions for setting up and executing the **Selenium WebDriver Automated Testing Suite** for the LagaTour application inside **PyCharm**.

---

## 📋 Prerequisites & Project Structure

The project includes an automated UI testing suite located in the `tests/` directory:

```
LagaTour/
├── tests/
│   ├── __init__.py
│   ├── conftest.py                   # Selenium WebDriver setup fixture & auth injection
│   ├── test_tour_plans_ui.py          # E2E Tests: Tour Plans, Search Filters, Budget Slider, Modals
│   ├── test_auth_and_navigation.py     # E2E Tests: Navigation Tabs, Status Filter Pills, Select Dropdowns
│   ├── test_social_feed_ui.py         # E2E Tests: Social Feed Posts, Comments, Post Navigation
│   ├── test_places_ui.py              # E2E Tests: Places Database Search, Category Pills
│   ├── test_rankings_ui.py            # E2E Tests: Leaderboard Podium, League Badges, User Points
│   ├── test_group_planner_ui.py       # E2E Tests: Group Trips, Action Buttons
│   ├── test_ai_builder_ui.py          # E2E Tests: AI Custom Itinerary Prompt Form Inputs
│   ├── test_user_profile_ui.py        # E2E Tests: User Dashboard Metrics & User Profile
│   ├── test_map_explorer_ui.py        # E2E Tests: Interactive Map Explorer & Location Search
│   ├── test_messaging_ui.py           # E2E Tests: Real-time Messaging & Chat Input
│   ├── test_create_post_page_ui.py    # E2E Tests: Standalone Post Creation Form & Story Inputs
│   └── test_admin_panel_ui.py         # E2E Tests: Super Admin Control Panel & Moderation Tools
├── pytest.ini                         # PyTest configuration for PyCharm discovery
├── requirements-test.txt              # Python dependencies (selenium, webdriver-manager, pytest)
└── PYCHARM_SELENIUM_GUIDE.md         # Setup instructions & test documentation (This document)
```

---

## ⚙️ Step 1: Open Project in PyCharm

1. Launch **PyCharm** (Community or Professional edition).
2. Click **File ➔ Open...**.
3. Select your project folder: `e:\LagaTour\LagaTour` (or your local clone path).
4. Click **OK** to open the project workspace.

---

## 🐍 Step 2: Configure Python Interpreter & Virtual Environment

1. In PyCharm, go to **File ➔ Settings** (on macOS: `PyCharm ➔ Preferences`).
2. Navigate to **Project: LagaTour ➔ Python Interpreter**.
3. Click **Add Interpreter ➔ Add Local Interpreter...**.
4. Select **Virtualenv Environment**:
   * **Location**: `<project_path>/venv`
   * **Base Python**: Select Python 3.9+ or Python 3.10 / 3.11 / 3.14 installed on your system.
5. Click **OK** to create and activate the virtual environment.

---

## 📦 Step 3: Install Selenium Dependencies

1. Open the built-in PyCharm Terminal (**Alt + F12** or click **Terminal** at the bottom toolbar).
2. Ensure your virtual environment is active (you will see `(venv)` at the beginning of the command prompt).
3. Run the following command to install `selenium`, `webdriver-manager`, and `pytest`:

```bash
pip install -r requirements-test.txt
```

> **Note**: `webdriver-manager` automatically downloads and configures the matching ChromeDriver for your installed Google Chrome browser version. No manual driver download is required!

---

## 🚀 Step 4: Ensure LagaTour Application is Running

Selenium tests require the LagaTour frontend server to be active on `http://localhost:5173`.

1. Open a terminal tab in PyCharm.
2. Run:
```bash
npm run dev
```
3. Verify in browser that `http://localhost:5173` is accessible.

---

## 🧪 Step 5: Configure pytest as the Default Test Runner in PyCharm

1. Open **File ➔ Settings ➔ Tools ➔ Python Integrated Tools**.
2. Scroll down to the **Testing** section.
3. Set **Default test runner** to **pytest**.
4. Click **Apply** and **OK**.

---

## ▶️ Step 6: Running Selenium Tests in PyCharm

You can run your Selenium tests in **three easy ways**:

### Option A: Run Entire Test Suite via Project Tree (Recommended)
1. In the PyCharm **Project Tool Window** (left sidebar), expand the `tests/` folder.
2. Right-click on the `tests/` folder.
3. Click **Run 'pytest in tests'**.
4. PyCharm will launch Chrome, perform automated UI actions (clicking tabs, filtering, filling forms), and display green checkmarks in the lower **Run Window**.

### Option B: Run a Specific Test File
1. Right-click on `tests/test_tour_plans_ui.py`.
2. Click **Run 'pytest in test_tour_plans_ui.py'**.

### Option C: Run via PyCharm Terminal
In the terminal tab, run:
```bash
pytest tests/ -v
```

---

## 👁️ Headed vs. Headless Mode (Visual vs Background Execution)

By default, tests run in **Headed Mode** (Google Chrome opens visibly on screen so you can observe automated typing, clicking, and slider movements).

If you wish to run tests in the background (Headless Mode):
1. Open [tests/conftest.py](file:///e:/LagaTour/LagaTour/tests/conftest.py).
2. Uncomment line 22:
```python
options.add_argument("--headless=new")
```

---

## 📊 Complete Summary of All Automated Test Cases

| Test File | Test Function | Description |
| :--- | :--- | :--- |
| **`test_tour_plans_ui.py`** | `test_01_page_header_and_title` | Asserts page header and main title rendering. |
| **`test_tour_plans_ui.py`** | `test_02_tab_navigation` | Verifies switching between *My Expeditions*, *Live Cockpit*, and *Community* tabs. |
| **`test_tour_plans_ui.py`** | `test_03_search_box_filtering` | Types keywords into search input and verifies dynamic filtering. |
| **`test_tour_plans_ui.py`** | `test_04_budget_slider_adjustment` | Moves budget range slider and checks dynamic text update. |
| **`test_tour_plans_ui.py`** | `test_05_create_expedition_modal_toggle` | Clicks "+ Plan New Expedition" button and verifies popup window opens. |
| **`test_auth_and_navigation.py`** | `test_01_status_filter_pills` | Tests clicking status sub-filter buttons (`Planned`, `Completed History`). |
| **`test_auth_and_navigation.py`** | `test_02_travel_style_select_dropdown` | Selects dropdown options (e.g. *Solo Traveler*) and verifies response. |
| **`test_social_feed_ui.py`** | `test_01_feed_rendering_and_posts` | Verifies Social Feed load, post cards, author avatars, and captions. |
| **`test_social_feed_ui.py`** | `test_02_interaction_like_and_comment` | Enters test comment into input box and sends comment. |
| **`test_social_feed_ui.py`** | `test_03_create_post_navigation` | Tests navigating to post creation form. |
| **`test_places_ui.py`** | `test_01_places_database_rendering` | Verifies Bangladesh destination cards database rendering. |
| **`test_places_ui.py`** | `test_02_places_search_filtering` | Types location query ("Sajek") into search box and asserts matching results. |
| **`test_places_ui.py`** | `test_03_category_pills_filter` | Tests category filter pills (*Hill Tracks*, *Beaches*, *Haor*). |
| **`test_rankings_ui.py`** | `test_01_leaderboard_rendering` | Verifies top traveler podium, points, and leaderboard ranks. |
| **`test_rankings_ui.py`** | `test_02_league_badges_and_points` | Asserts league rank badges (*Legend*, *Expert*, *Adventurer*) and points display. |
| **`test_group_planner_ui.py`** | `test_01_group_planner_rendering` | Verifies active group trips, companion avatars, and expense split meters. |
| **`test_group_planner_ui.py`** | `test_02_create_or_join_group_button` | Tests interacting with group action buttons. |
| **`test_ai_builder_ui.py`** | `test_01_ai_builder_page_render` | Verifies AI Builder page load with prompt/destination fields. |
| **`test_ai_builder_ui.py`** | `test_02_fill_ai_prompt_inputs` | Types custom travel prompt ("3-day trip to Bandarban under 15,000 BDT") into AI form. |
| **`test_user_profile_ui.py`** | `test_01_dashboard_rendering` | Verifies User Dashboard metrics, profile avatar, points, and league rank. |
| **`test_map_explorer_ui.py`** | `test_01_map_explorer_rendering` | Verifies interactive map explorer canvas, search bar, and map controls. |
| **`test_map_explorer_ui.py`** | `test_02_map_location_search` | Types location query ("Cox's Bazar") into map search bar. |
| **`test_messaging_ui.py`** | `test_01_messaging_page_render` | Verifies messaging page, conversation list, and chat window load. |
| **`test_messaging_ui.py`** | `test_02_send_message_input` | Types test chat message into input box and sends message. |
| **`test_create_post_page_ui.py`** | `test_01_create_post_form_render` | Verifies standalone Create Post form, location selector, and caption textareas. |
| **`test_create_post_page_ui.py`** | `test_02_fill_create_post_form` | Fills travel story caption ("Exploring the serene tea gardens of Sreemangal!") into post creation form. |
| **`test_admin_panel_ui.py`** | `test_01_admin_panel_rendering` | Verifies Super Admin Control Panel rendering (with `isAdmin: true` session injection). |
| **`test_admin_panel_ui.py`** | `test_02_admin_action_buttons` | Tests admin control buttons and moderation tabs. |
| **`test_deep_expedition_form_submit.py`** | `test_deep_create_expedition_form_submission` | **Deep Workflow**: Opens modal, fills title, starting location, destination, budget, submits form, and asserts new trip card saves. |
| **`test_deep_auth_workflow.py`** | `test_deep_login_form_submission` | **Deep Workflow**: Opens `/auth`, fills email & password credentials, submits login form. |
| **`test_deep_auth_workflow.py`** | `test_deep_registration_form_submission` | **Deep Workflow**: Switches to Registration tab, fills full name, email, password, and submits registration. |
| **`test_deep_ai_builder_submit.py`** | `test_deep_ai_itinerary_generation_submission` | **Deep Workflow**: Fills AI travel prompt, clicks Generate button, and asserts generated day-by-day itinerary schedule. |
