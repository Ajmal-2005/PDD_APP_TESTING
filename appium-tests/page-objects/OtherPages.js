/**
 * Appium Page Object Model for Library, Analytics, and Settings Pages
 */
export class LibraryPage {
    get searchInput() { return $('input[placeholder*="Search crop"]'); }
    get categoryTabs() { return $$('[role="tab"]'); }
    get cropCards() { return $$('[data-testid="crop-card"]'); }

    async open() {
        await browser.url('/library');
    }
}

export class AnalyticsPage {
    get yieldChart() { return $('canvas, svg.recharts-surface'); }
    get dateRangePicker() { return $('button*=Select Date, select[name="date-range"]'); }

    async open() {
        await browser.url('/analytics');
    }
}

export class SettingsPage {
    get themeToggle() { return $('button[aria-label="Toggle Theme"], input[name="theme-switch"]'); }
    get languageDropdown() { return $('select[name="language"]'); }
    get offlineSyncToggle() { return $('input[name="offline-sync"]'); }
    get saveProfileBtn() { return $('button*=Save Profile'); }

    async open() {
        await browser.url('/settings');
    }
}
