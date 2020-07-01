import { Browser, Page } from 'puppeteer';
import * as crypto from "crypto";
import { launchBrowser } from '../utils/launchBrowser';
import { config } from '../config/credentials.env';
import { getCookie, saveCookie } from '../utils/fs';
import { CONTACTS_URL, FEED_URL, LOGIN_URL } from '../config/constants';
import { LifeImitation } from './life-imitation';
import { AcceptFriends } from './accept-friends';
import { Service } from './service';
import { Services } from '../types';
import { AddFriends } from './add-friends';
import { availableServices } from './available-services';

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
  
  protected async runService(service: Service) {
    console.log(`Begin ${service.name}`);
    await service.work();
    console.log(`Finish ${service.name}`);
    service = null;
  
    await this.page.goto(CONTACTS_URL, { waitUntil: 'load' });
  }
  
  protected getService(serviceName: Services): Service {
    const options = { page: this.page };
    const serviceClass = availableServices[serviceName];
    
    return new serviceClass(options);
  }
  
  public work = async () => {
    await this.runService(this.getService('lifeImitation'));
  }
}
