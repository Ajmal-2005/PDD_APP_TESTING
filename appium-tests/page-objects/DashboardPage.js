/**
 * Appium Page Object Model for AgroVision Mobile Dashboard
 */
export class DashboardPage {
    get welcomeHeading() { return $('h1, h2'); }
    get sidebarToggleBtn() { return $('button[aria-label="Toggle Sidebar"], button[aria-label="Open menu"]'); }
    get quickScanBtn() { return $('a[href="/scan"], button*=Scan'); }
    get bottomNavHome() { return $('nav a[href="/dashboard"]'); }
    get bottomNavScan() { return $('nav a[href="/scan"]'); }
    get bottomNavHistory() { return $('nav a[href="/history"]'); }
    get bottomNavLibrary() { return $('nav a[href="/library"]'); }
    get bottomNavProfile() { return $('nav a[href="/profile"]'); }
    get languageSelector() { return $('button[aria-label="Select Language"], [data-testid="lang-select"]'); }
    get weatherWidget() { return $('[data-testid="weather-widget"], .weather-card'); }
    get cropHealthOverview() { return $('[data-testid="health-overview"]'); }
    get userAvatar() { return $('[data-testid="user-avatar"], img[alt*="profile"]'); }

    async open() {
        await browser.url('/dashboard');
        await this.welcomeHeading.waitForDisplayed({ timeout: 10000 });
    }

    async clickQuickScan() {
        await this.quickScanBtn.click();
    }

    async toggleSidebar() {
        await this.sidebarToggleBtn.click();
    }

    async navigateTo(tabName) {
        switch (tabName.toLowerCase()) {
            case 'scan':
                await this.bottomNavScan.click();
                break;
            case 'history':
                await this.bottomNavHistory.click();
                break;
            case 'library':
                await this.bottomNavLibrary.click();
                break;
            case 'profile':
                await this.bottomNavProfile.click();
                break;
            default:
                await this.bottomNavHome.click();
        }
    }
}

export default new DashboardPage();
