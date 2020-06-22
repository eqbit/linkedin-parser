import { Browser, Page } from 'puppeteer';
import { launchBrowser } from '../utils/launchBrowser';
import { config } from '../config/credentials.env';

const HOME_PAGE_URL = 'https://www.linkedin.com/';

export class Main {
  protected browser: Browser;
  protected page: Page;
  
  public init = async () => {
    this.browser = await launchBrowser(
      {
        headless: false,
        proxyHost: config.proxy.host,
        proxyPort: config.proxy.port
      }
    );
  }
  
  public openPage = async () => {
    this.page = await this.browser.newPage();
    await this.page.authenticate({ username: config.proxy.login, password: config.proxy.password });
    await this.page.goto(HOME_PAGE_URL, { waitUntil: 'load' });
  }
}
