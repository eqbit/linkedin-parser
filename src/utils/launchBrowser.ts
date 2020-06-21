import { launch, Browser } from 'puppeteer';

const CHROMIUM_WINDOW_WIDTH = 1366;
const CHROMIUM_WINDOW_HEIGHT = 768;

export interface BrowserOptions {
    proxyHost?: string;
    proxyPort?: string;
    headless?: boolean;
}

export const launchBrowser = async (options: BrowserOptions = {}): Promise<Browser> => {
    const { proxyHost, proxyPort, headless } = options;

    const args = [
        '--lang=en-US,en;q=0.9',
        `--window-size=${CHROMIUM_WINDOW_WIDTH},${CHROMIUM_WINDOW_HEIGHT}`
    ];

    if (proxyHost && proxyPort) {
        args.push(`--proxy-server=${proxyHost}:${proxyPort}`);
    }

    return await launch({
        headless,
        defaultViewport: {
            width: CHROMIUM_WINDOW_WIDTH,
            height: CHROMIUM_WINDOW_HEIGHT
        },
        args
    });
};
