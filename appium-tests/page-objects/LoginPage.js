/**
 * Appium Page Object Model for AgroVision Login & Auth Screen
 */
export class LoginPage {
    get emailInput() { return $('input[type="email"]'); }
    get passwordInput() { return $('input[type="password"]'); }
    get loginSubmitBtn() { return $('button[type="submit"]'); }
    get googleSignInBtn() { return $('button*=Google'); }
    get registerLink() { return $('a[href="/register"]'); }
    get errorMessage() { return $('[data-testid="error-message"], .text-red-500, .bg-red-50'); }
    get emailValidationText() { return $('p*=email'); }
    get passwordValidationText() { return $('p*=password'); }
    get rememberMeCheckbox() { return $('input[type="checkbox"]'); }

    async open() {
        await browser.url('/login');
        await this.emailInput.waitForDisplayed({ timeout: 10000 });
    }

    async enterEmail(email) {
        await this.emailInput.setValue(email);
    }

    async enterPassword(password) {
        await this.passwordInput.setValue(password);
    }

    async clickLogin() {
        await this.loginSubmitBtn.click();
    }

    async login(email, password) {
        await this.open();
        await this.enterEmail(email);
        await this.enterPassword(password);
        await this.clickLogin();
    }

    async getErrorText() {
        await this.errorMessage.waitForDisplayed({ timeout: 5000 });
        return await this.errorMessage.getText();
    }

    async navigateToRegister() {
        await this.registerLink.click();
        await browser.waitUntil(async () => (await browser.getUrl()).includes('/register'));
    }
}

export default new LoginPage();
