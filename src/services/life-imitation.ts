import { Page } from 'puppeteer';
import { CONTACTS_URL, HOME_URL } from '../config/constants';
import { randomSleep } from '../utils/sleep';
import { randomMinMax } from '../utils/random';

const MIN_TIME_TO_LIVE = 10000;
const MAX_TIME_TO_LIVE = 30000;
const MIN_SLEEP = 1500;
const MAX_SLEEP = 5000;
const MIN_SCROLL = 700;
const MAX_SCROLL = 1200;

interface Options {
  page: Page;
}

export class LifeImitation {
  protected page: Page;
  protected timeToLive: number;
  
  constructor({ page }: Options) {
    this.page = page;
    this.timeToLive = randomMinMax(MIN_TIME_TO_LIVE, MAX_TIME_TO_LIVE);
  }
  
  protected async scrollPage (distance: number) {
    const scroll = ({ distance }) => new Promise(resolve => {
      window.scrollBy(0, distance);
      resolve();
    });
    
    await this.page.evaluate(scroll, { distance });
  }
  
  protected async initScroll() {
    const scrollDistance = randomMinMax(MIN_SCROLL, MAX_SCROLL);
    await this.scrollPage(scrollDistance);
    await randomSleep(MIN_SLEEP, MAX_SLEEP);
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(HOME_URL, { waitUntil: 'load'});
  
      let letScroll = true;
      setTimeout(() => {
        resolve();
        letScroll = false;
      }, this.timeToLive);
  
      while (letScroll) {
        await this.initScroll();
      }
    });
  }
}
