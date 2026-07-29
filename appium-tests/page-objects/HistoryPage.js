/**
 * Appium Page Object Model for History Page
 */
export class HistoryPage {
    get searchInput() { return $('input[placeholder*="Search"]'); }
    get cropFilterDropdown() { return $('select[name="crop-filter"]'); }
    get scanCards() { return $$('[data-testid="scan-history-card"], .history-item'); }
    get emptyStateMessage() { return $('[data-testid="empty-history"], p*=No scans'); }
    get clearHistoryBtn() { return $('button*=Clear History, button*=Delete All'); }

    async open() {
        await browser.url('/history');
        await browser.pause(1000);
    }

    async searchHistory(term) {
        await this.searchInput.setValue(term);
    }

    async getScanCount() {
        const cards = await this.scanCards;
        return cards.length;
    }
}

export default new HistoryPage();
