/**
 * Appium Mobile Touch & Driver Utilities for AgroVision Frontend E2E Automation
 */

export class AppiumDriverHelper {
    /**
     * Perform touch swipe gesture on mobile viewport
     */
    static async swipe(fromX, fromY, toX, toY, durationMs = 800) {
        await browser.performActions([
            {
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x: fromX, y: fromY },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: 100 },
                    { type: 'pointerMove', duration: durationMs, x: toX, y: toY },
                    { type: 'pointerUp', button: 0 }
                ]
            }
        ]);
        await browser.releaseActions();
    }

    /**
     * Swipe down to refresh page
     */
    static async pullToRefresh() {
        const windowSize = await browser.getWindowSize();
        const startX = Math.floor(windowSize.width / 2);
        const startY = Math.floor(windowSize.height * 0.2);
        const endY = Math.floor(windowSize.height * 0.7);
        await this.swipe(startX, startY, startX, endY, 600);
    }

    /**
     * Scroll until element is visible
     */
    static async scrollIntoView(element) {
        if (await element.isDisplayed()) return;
        await element.scrollIntoView({ block: 'center', inline: 'center' });
    }

    /**
     * Mobile double tap
     */
    static async doubleTap(element) {
        const location = await element.getLocation();
        const size = await element.getSize();
        const x = Math.floor(location.x + size.width / 2);
        const y = Math.floor(location.y + size.height / 2);

        await browser.performActions([
            {
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x, y },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerUp', button: 0 },
                    { type: 'pause', duration: 100 },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pointerUp', button: 0 }
                ]
            }
        ]);
        await browser.releaseActions();
    }

    /**
     * Long press on mobile element
     */
    static async longPress(element, durationMs = 1500) {
        const location = await element.getLocation();
        const size = await element.getSize();
        const x = Math.floor(location.x + size.width / 2);
        const y = Math.floor(location.y + size.height / 2);

        await browser.performActions([
            {
                type: 'pointer',
                id: 'finger1',
                parameters: { pointerType: 'touch' },
                actions: [
                    { type: 'pointerMove', duration: 0, x, y },
                    { type: 'pointerDown', button: 0 },
                    { type: 'pause', duration: durationMs },
                    { type: 'pointerUp', button: 0 }
                ]
            }
        ]);
        await browser.releaseActions();
    }

    /**
     * Set mobile device orientation (PORTRAIT / LANDSCAPE)
     */
    static async setOrientation(orientation = 'PORTRAIT') {
        if (browser.isMobile) {
            await browser.setOrientation(orientation);
        } else {
            if (orientation === 'LANDSCAPE') {
                await browser.setWindowSize(844, 390);
            } else {
                await browser.setWindowSize(390, 844);
            }
        }
    }

    /**
     * Simulate Offline network mode
     */
    static async toggleNetworkOffline(offline = true) {
        if (browser.isMobile) {
            await browser.setNetworkConnection(offline ? 1 : 6); // 1 = Airplane mode, 6 = All data on
        } else {
            await browser.throttle({ offline });
        }
    }

    /**
     * Take timestamped screenshot artifact
     */
    static async takeScreenshot(tag = 'checkpoint') {
        const timestamp = Date.now();
        const filePath = `./screenshots/${tag}_${timestamp}.png`;
        await browser.saveScreenshot(filePath);
        return filePath;
    }
}
