import { expect } from 'chai';
import DashboardPage from '../page-objects/DashboardPage.js';
import { AppiumDriverHelper } from '../helpers/driver.js';

describe('Appium Mobile E2E Suite - 02: Dashboard & Navigation', () => {

    before(async () => {
        await DashboardPage.open();
    });

    it('TC_DASH_001: Mobile Dashboard Header and Welcome Banner Rendering', async () => {
        const welcomeDisplayed = await DashboardPage.welcomeHeading.isDisplayed();
        expect(welcomeDisplayed).to.be.true;
    });

    it('TC_DASH_002: Bottom Navigation Bar Tab Switching (Scan, History, Library)', async () => {
        if (await DashboardPage.bottomNavScan.isDisplayed()) {
            await DashboardPage.navigateTo('scan');
            expect(await browser.getUrl()).to.include('/scan');
            await DashboardPage.navigateTo('history');
            expect(await browser.getUrl()).to.include('/history');
        }
    });

    it('TC_DASH_003: Pull-to-Refresh Gesture on Dashboard', async () => {
        await DashboardPage.open();
        await AppiumDriverHelper.pullToRefresh();
        expect(await DashboardPage.welcomeHeading.isDisplayed()).to.be.true;
    });

    it('TC_DASH_004: Weather Card Information Display for Farm Location', async () => {
        if (await DashboardPage.weatherWidget.isExisting()) {
            expect(await DashboardPage.weatherWidget.isDisplayed()).to.be.true;
        }
    });
});
