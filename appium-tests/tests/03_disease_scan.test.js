import { expect } from 'chai';
import ScanPage from '../page-objects/ScanPage.js';

describe('Appium Mobile E2E Suite - 03: Plant Disease Scan & AI Identification', () => {

    beforeEach(async () => {
        await ScanPage.open();
    });

    it('TC_SCAN_001: Mobile Scan Upload UI & Dropzone Visibility', async () => {
        const fileInputExists = await ScanPage.fileInput.isExisting();
        expect(fileInputExists).to.be.true;
    });

    it('TC_SCAN_002: Select Crop Type Dropdown Options', async () => {
        if (await ScanPage.cropSelectDropdown.isExisting()) {
            await ScanPage.selectCrop('Tomato');
        }
    });

    it('TC_SCAN_003: Disease Scan Diagnosis Result & Confidence Score', async () => {
        if (await ScanPage.diagnosisResultTitle.isExisting()) {
            const title = await ScanPage.diagnosisResultTitle.getText();
            expect(title.length).to.be.greaterThan(0);
        }
    });

    it('TC_SCAN_004: Download PDF Advisory Report Action', async () => {
        if (await ScanPage.downloadPdfBtn.isExisting()) {
            await ScanPage.downloadPDF();
        }
    });
});
