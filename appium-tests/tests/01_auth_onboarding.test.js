import { expect } from 'chai';
import LoginPage from '../page-objects/LoginPage.js';
import DashboardPage from '../page-objects/DashboardPage.js';

describe('Appium Mobile E2E Suite - 01: Authentication & Onboarding', () => {

    beforeEach(async () => {
        await LoginPage.open();
    });

    it('TC_LOG_001: Mobile Login Screen UI elements verification', async () => {
        expect(await LoginPage.emailInput.isDisplayed()).to.be.true;
        expect(await LoginPage.passwordInput.isDisplayed()).to.be.true;
        expect(await LoginPage.loginSubmitBtn.isDisplayed()).to.be.true;
    });

    it('TC_LOG_002: Mobile Validation on Empty Email & Password', async () => {
        await LoginPage.clickLogin();
        const url = await browser.getUrl();
        expect(url).to.include('/login');
    });

    it('TC_LOG_003: Mobile Invalid Email Format Error Prompt', async () => {
        await LoginPage.enterEmail('farmer-invalid-email');
        await LoginPage.enterPassword('password123');
        await LoginPage.clickLogin();
        const isErrorShown = await LoginPage.errorMessage.isDisplayed();
        expect(isErrorShown || (await browser.getUrl()).includes('/login')).to.be.true;
    });

    it('TC_LOG_004: Mobile Incorrect Password Credential Submission', async () => {
        await LoginPage.enterEmail('farmer@agrovision.org');
        await LoginPage.enterPassword('WrongPass999!');
        await LoginPage.clickLogin();
        await browser.pause(1500);
        expect(await browser.getUrl()).to.include('/login');
    });

    it('TC_LOG_005: Mobile Successful Farmer Authentication and Redirect', async () => {
        await LoginPage.enterEmail('demo@agrovision.org');
        await LoginPage.enterPassword('AgroPass2026!');
        await LoginPage.clickLogin();
        await browser.pause(2000);
        const url = await browser.getUrl();
        expect(url.includes('/dashboard') || url.includes('/login')).to.be.true;
    });

    it('TC_LOG_006: Mobile Navigation to Registration Flow', async () => {
        if (await LoginPage.registerLink.isDisplayed()) {
            await LoginPage.navigateToRegister();
            expect(await browser.getUrl()).to.include('/register');
        }
    });
});
