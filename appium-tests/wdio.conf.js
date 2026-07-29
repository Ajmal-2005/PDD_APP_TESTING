export const config = {
    // ====================
    // Runner Configuration
    // ====================
    runner: 'local',
    port: 4723,
    path: '/',

    // ==================
    // Specify Test Files
    // ==================
    specs: [
        './tests/**/*.test.js'
    ],
    exclude: [],

    // ============
    // Capabilities
    // ============
    maxInstances: 1,
    capabilities: [{
        // Mobile Chrome on Android Device / Emulator
        platformName: 'Android',
        'appium:deviceName': 'Pixel_6_API_33',
        'appium:automationName': 'UiAutomator2',
        'appium:browserName': 'Chrome',
        'appium:ensureWebviewsHavePages': true,
        'appium:nativeWebScreenshot': true,
        'appium:newCommandTimeout': 3600,
        'appium:chromedriverExecutableDir': './drivers'
    }],

    // ===================
    // Test Configurations
    // ===================
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost:3000',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,

    services: ['appium'],

    framework: 'mocha',
    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },

    // ===================
    // Appium LifeCycle Hooks
    // ===================
    before: async function (capabilities, specs) {
        await browser.setWindowSize(390, 844); // Standard mobile viewport dimensions
    },

    afterTest: async function(test, context, { error, result, duration, passed, retry }) {
        if (!passed) {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            await browser.saveScreenshot(`./screenshots/ERROR_${test.title.replace(/\s+/g, '_')}_${timestamp}.png`);
        }
    }
};
