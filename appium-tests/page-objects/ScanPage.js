/**
 * Appium Page Object Model for Plant Disease Scan Page
 */
export class ScanPage {
    get fileInput() { return $('input[type="file"]'); }
    get cameraTriggerBtn() { return $('button*=Camera, button[aria-label="Take Photo"]'); }
    get uploadArea() { return $('[data-testid="upload-dropzone"], label[for="file-upload"]'); }
    get cropSelectDropdown() { return $('select[name="crop"], button[role="combobox"]'); }
    get analyzeButton() { return $('button*=Analyze, button*=Scan Now'); }
    get loadingSpinner() { return $('[data-testid="loading-spinner"], .animate-spin'); }
    get diagnosisResultTitle() { return $('[data-testid="disease-name"], h2.text-emerald-700, h3'); }
    get confidenceScoreBadge() { return $('[data-testid="confidence-badge"], .bg-emerald-100'); }
    get downloadPdfBtn() { return $('button*=Download PDF, button*=PDF Report'); }
    get treatmentGuideSection() { return $('[data-testid="treatment-guide"], section*=Treatment'); }

    async open() {
        await browser.url('/scan');
        await browser.pause(1000);
    }

    async uploadImageFile(filePath) {
        const remoteFilePath = await browser.uploadFile(filePath);
        await this.fileInput.setValue(remoteFilePath);
    }

    async selectCrop(cropName) {
        if (await this.cropSelectDropdown.isExisting()) {
            await this.cropSelectDropdown.selectByVisibleText(cropName);
        }
    }

    async triggerAnalysis() {
        if (await this.analyzeButton.isDisplayed()) {
            await this.analyzeButton.click();
        }
    }

    async waitForDiagnosis(timeoutMs = 15000) {
        await this.diagnosisResultTitle.waitForDisplayed({ timeout: timeoutMs });
    }

    async downloadPDF() {
        await this.downloadPdfBtn.waitForDisplayed({ timeout: 5000 });
        await this.downloadPdfBtn.click();
    }
}

export default new ScanPage();
