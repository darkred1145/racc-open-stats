from playwright.sync_api import sync_playwright, expect
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)

def get_page(browser):
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto(f'file://{ROOT}/index.html')
    page.wait_for_load_state('networkidle')
    return page

def test_page_loads():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        assert 'Racc Open Analysis' in page.title()
        browser.close()

def test_tabs_are_buttons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        tabs = page.locator('button.tab')
        assert tabs.count() == 6
        expected = ['Tier Lists', 'Uma Stats', 'Trainer Stats', 'Championship', 'Live Data', 'Trainer Card']
        texts = tabs.all_inner_texts()
        assert texts == expected
        browser.close()

def test_tab_switch():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        uma_tab = page.locator('button.tab[data-tab="uma-stats"]')
        uma_tab.click()
        expect(uma_tab).to_have_attribute('aria-selected', 'true')
        expect(page.locator('#uma-stats')).to_be_visible()
        expect(page.locator('#tier-lists')).not_to_be_visible()
        browser.close()

def test_theme_selector():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        theme = page.locator('#themeSelector')
        expect(theme).to_be_visible()
        theme.select_option('ram')
        expect(page.locator('body')).to_have_attribute('data-theme', 'ram')
        browser.close()

def test_filter_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        mappings = {'Season': 'seasonSelector', 'Theme': 'themeSelector', 'Surface': 'surfaceFilter', 'Distance': 'lengthFilter'}
        for label_text, expected_for in mappings.items():
            label = page.locator(f'label[for="{expected_for}"]')
            assert label.count() > 0, f'Label "{label_text}" not found with @for="{expected_for}"'
        browser.close()

def test_labels_have_for():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        labels = page.locator('label')
        for i in range(labels.count()):
            for_attr = labels.nth(i).get_attribute('for')
            assert for_attr and for_attr.strip(), f'Label {i} "{labels.nth(i).inner_text().strip()}" missing @for'
            target = page.locator(f'#{for_attr}')
            assert target.count() > 0, f'Label @for="{for_attr}" has no matching element'
        browser.close()

def test_tab_keyboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        first_tab = page.locator('button.tab').first
        first_tab.focus()
        page.keyboard.press('Enter')
        expect(first_tab).to_have_attribute('aria-selected', 'true')
        browser.close()

def test_live_data_placeholder():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        live_tab = page.locator('button.tab[data-tab="live-data"]')
        live_tab.click()
        content = page.locator('#liveDataOutput').inner_text()
        assert 'Connecting to Firebase\u2026' in content
        browser.close()

def test_search_input():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        search = page.locator('#searchInput')
        expect(search).to_be_visible()
        placeholder = search.get_attribute('placeholder')
        assert '\u2026' in placeholder
        browser.close()

def test_table_sorts():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        champ_tab = page.locator('button.tab[data-tab="championship"]')
        champ_tab.click()
        th = page.locator('#champTable th').first
        expect(th).to_have_attribute('tabindex', '0')
        expect(th).to_have_attribute('role', 'columnheader')
        browser.close()

def test_trainer_card_controls():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        page.locator('button.tab[data-tab="trainer-card"]').click()
        label = page.locator('label[for="cardTrainerSelector"]')
        expect(label).to_be_visible()
        select = page.locator('#cardTrainerSelector')
        expect(select).to_be_visible()
        browser.close()

def test_export_csv_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        btn = page.locator('button.copy-btn:has-text("Export CSV")')
        expect(btn).to_be_visible()
        svg = btn.locator('svg')
        expect(svg).to_have_attribute('aria-hidden', 'true')
        browser.close()

def test_footer_github_link():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = get_page(browser)
        link = page.locator('a.github-link')
        expect(link).to_be_visible()
        svg = link.locator('svg')
        expect(svg).to_have_attribute('aria-hidden', 'true')
        browser.close()

def test_teambuilder_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{ROOT}/teambuilder.html')
        page.wait_for_load_state('networkidle')
        assert 'Secret Team Theorycrafter' in page.title()
        for label_for in ['themeSelector', 'tcrafTrainerSelector', 'simTypeSelector']:
            label = page.locator(f'label[for="{label_for}"]')
            assert label.count() > 0, f'Missing label[for="{label_for}"] on teambuilder'
        browser.close()

def test_404_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{ROOT}/404.html')
        page.wait_for_load_state('networkidle')
        assert 'UMA ERROR' in page.title()
        expect(page.locator('h1')).to_contain_text('UMA ERROR')
        img = page.locator('.meme-img')
        expect(img).to_have_attribute('alt', 'Haru Urara')
        browser.close()

def test_404_ttt():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{ROOT}/404.html')
        page.wait_for_load_state('networkidle')
        page.locator('.meme-img').click(force=True)
        expect(page.locator('.ttt-overlay')).to_be_visible()
        first_cell = page.locator('.ttt-cell').first
        expect(first_cell).to_have_attribute('tabindex', '0')
        expect(first_cell).to_have_attribute('role', 'button')
        first_cell.click()
        page.wait_for_timeout(1000)
        assert page.locator('.ttt-cell').first.inner_text() in ('X', 'O')
        browser.close()

def test_copyright_year_dynamic():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f'file://{ROOT}/404.html')
        page.wait_for_load_state('networkidle')
        year_el = page.locator('#copyrightYear')
        current_year = str(__import__('datetime').datetime.now().year)
        expect(year_el).to_have_text(f'\u00a9 {current_year}')
        browser.close()
