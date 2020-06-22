import { Browser, Page } from 'puppeteer';
import * as crypto from "crypto";
import { launchBrowser } from '../utils/launchBrowser';
import { config } from '../config/credentials.env';
import { getCookie, saveCookie } from '../utils/fs';

const CONTACTS_URL = 'https://www.linkedin.com/mynetwork/invite-connect/connections/';
const LOGIN_URL = 'https://www.linkedin.com/login';
const NAVIGATION_TIMEOUT = 120000;

interface Options {
  login: string;
  password: string;
}

export class Main {
  protected browser: Browser;
  protected page: Page;
  protected isAuthenticated = false;
  
  protected login: string;
  protected password: string;
  
  constructor({ login, password }: Options) {
    this.login = login;
    this.password = password;
  }
  
  public init = async () => {
    this.browser = await launchBrowser(
      {
        headless: false,
        proxyHost: config.proxy.host,
        proxyPort: config.proxy.port
      }
    );
  }
  
  protected setPage = async () => {
    if (this.page) {
      return;
    }
  
    this.page = await this.browser.newPage();
    this.page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
  }
  
  protected authenticate = async () => {
    if (this.isAuthenticated) {
      return;
    }
    
    const { page } = this;
  
    const hashUsername = crypto.createHash('md5').update(this.login).digest('hex');
    const cookieFilePath = `linkedin-${hashUsername}.json`;
    
    let cookies = await getCookie(cookieFilePath);
    if (cookies) {
      await page.setCookie(...cookies);
    }
  
    await page.goto(CONTACTS_URL, { waitUntil: 'load' });
    if (page.url().startsWith(CONTACTS_URL)) {
      this.isAuthenticated = true;
      return;
    }
    
    await page.goto(LOGIN_URL, { waitUntil: 'load'});
  
    await page.type('#username', this.login);
    await page.type('#password', this.password);
    await page.keyboard.press('Enter');
    await page.waitForNavigation();
  
    await page.goto(CONTACTS_URL, { waitUntil: 'load' });
  
    cookies = await page.cookies();
    await saveCookie(cookieFilePath, cookies);
  
    this.isAuthenticated = true;
  }
  
  public openPage = async () => {
    await this.setPage();
    await this.page.authenticate({ username: config.proxy.login, password: config.proxy.password });
    
    await this.authenticate();
  }
}
