import { Browser, Page } from 'puppeteer';
import * as crypto from "crypto";
import { launchBrowser } from '../utils/launchBrowser';
import { config } from '../config/credentials.env';
import { getCookie, saveCookie } from '../utils/fs';
import { CONTACTS_URL, FEED_URL, LOGIN_URL } from '../config/constants';
import { LifeImitation } from './life-imitation';
import { sleep } from '../utils/sleep';
import { AcceptFriends } from './accept-friends';

const SCROLLING_DISTANCE = 1000;
const SCROLLING_INTERVAL = 100;
const SCROLLING_TIMEOUT = 30000;
export const NAVIGATION_TIMEOUT = 120000;

interface Options {
  login: string;
  password: string;
}

export class Main {
  protected browser: Browser;
  protected page: Page;
  protected isAuthenticated = false;
  
  protected scrollingDistance: number;
  protected scrollingInterval: number;
  protected scrollingTimeout: number;
  
  protected login: string;
  protected password: string;
  
  constructor({ login, password }: Options) {
    this.login = login;
    this.password = password;
  
    this.scrollingDistance = SCROLLING_DISTANCE;
    this.scrollingInterval = SCROLLING_INTERVAL;
    this.scrollingTimeout = SCROLLING_TIMEOUT;
  }
  
  public init = async () => {
    this.browser = await launchBrowser(
      {
        headless: false,
        proxyHost: config.proxy.host,
        proxyPort: config.proxy.port
      }
    );
    await this.setupBrowser();
  }
  
  protected setupBrowser = async () => {
    await this.initPage();
    await this.page.authenticate({ username: config.proxy.login, password: config.proxy.password });
    await this.authenticate();
  }
  
  protected initPage = async () => {
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
  
    await page.goto(FEED_URL, { waitUntil: 'load' });
    if (page.url().startsWith(FEED_URL)) {
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
  
  protected async scrollPage() {
    const scroll = (
      {
        distance,
        interval,
        timeout
      }
    ) => new Promise((resolve) => {
      const intervalId = setInterval(() => {
        window.scrollBy(0, distance);
      }, interval);
      
      setTimeout(() => {
        clearInterval(intervalId);
        resolve();
      }, timeout);
    });
    
    await this.page.evaluate(
      scroll,
      {
        distance: this.scrollingDistance,
        interval: this.scrollingInterval,
        timeout: this.scrollingTimeout
      }
    );
  }
  
  protected getProfileLinks = async () => {
    const links = await this.page.evaluate(() => {
      const profiles = document.querySelectorAll('.mn-connection-card__picture');
      const links = [];
      profiles.forEach((profile) => {
        links.push(profile.getAttribute('href'));
      });
    });
  
    console.log('links', links)
  }
  
  protected runLifeImitation = async () => {
    console.log('start imitation');
    let lifeImitator = new LifeImitation({ page: this.page });
    await lifeImitator.work();
    lifeImitator = null;
    console.log('finish imitation');
  
    await this.page.goto(CONTACTS_URL, { waitUntil: 'load' });
  }
  
  protected runFriendInvitesChecker = async () => {
    console.log('start invite checker');
    let checker = new AcceptFriends({ page: this.page });
    await checker.work();
    checker = null;
    console.log('finish invite checker');
  
    await this.page.goto(CONTACTS_URL, { waitUntil: 'load' });
  }
  
  public work = async () => {
    await this.runFriendInvitesChecker();
  }
}
