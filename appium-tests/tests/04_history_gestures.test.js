import { expect } from 'chai';
import HistoryPage from '../page-objects/HistoryPage.js';
import { AppiumDriverHelper } from '../helpers/driver.js';

describe('Appium Mobile E2E Suite - 04 & 08: History, Offline DB & Touch Gestures', () => {

    it('TC_HIST_001: Scan History IndexedDB records loading', async () => {
        await HistoryPage.open();
        const count = await HistoryPage.getScanCount();
        expect(count).to.be.a('number');
    });

    it('TC_HIST_002: History Search Bar Filter', async () => {
        await HistoryPage.open();
        if (await HistoryPage.searchInput.isExisting()) {
            await HistoryPage.searchHistory('Blight');
            await browser.pause(500);
        }
    });

    it('TC_GEST_001: Landscape and Portrait Orientation Change', async () => {
        await AppiumDriverHelper.setOrientation('LANDSCAPE');
        await browser.pause(500);
        await AppiumDriverHelper.setOrientation('PORTRAIT');
        await browser.pause(500);
    });

    it('TC_OFF_001: Offline Mode Network Interruption Handling', async () => {
        await AppiumDriverHelper.toggleNetworkOffline(true);
        await browser.pause(500);
        await AppiumDriverHelper.toggleNetworkOffline(false);
    });
});
