import { Browser, Page } from 'puppeteer';
import { launchBrowser } from '../utils/launchBrowser';

const HOME_PAGE_URL = 'https://www.linkedin.com/';

export class Main {
  protected browser: Browser;
  protected page: Page;
  
  public init = async () => {
    this.browser = await launchBrowser({ headless: false });
  }
  
  public openPage = async () => {
    this.page = await this.browser.newPage();
    await this.page.goto(HOME_PAGE_URL, { waitUntil: 'load' });
  }
}
