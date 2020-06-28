import { Page } from 'puppeteer';
import { FEED_URL } from '../config/constants';
import { randomSleep } from '../utils/sleep';
import { chance, randomMinMax } from '../utils/random';
import { Service } from './service';

const MIN_TIME_TO_LIVE = 1.2e5;
const MAX_TIME_TO_LIVE = 3e5;
const MIN_SLEEP = 1500;
const MAX_SLEEP = 5000;
const MIN_SCROLL = 700;
const MAX_SCROLL = 1200;

interface Options {
  page: Page;
}

export class LifeImitation implements Service {
  protected page: Page;
  protected timeToLive: number;
  protected letLive = true;
  
  constructor({ page }: Options) {
    this.page = page;
    this.timeToLive = randomMinMax(MIN_TIME_TO_LIVE, MAX_TIME_TO_LIVE);
  }
  
  protected async scrollPage(distance: number) {
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
  
  protected async leaveReaction() {
    if (chance(1)) {
      const reactWithALike = () => {
        const likeButtons: NodeListOf<HTMLElement> = document.querySelectorAll('[type="like-icon"]');
        likeButtons[likeButtons.length - 3].click();
      };
      
      await this.page.evaluate(reactWithALike);
      await randomSleep(MIN_SLEEP, MAX_SLEEP);
  
      console.log('added a like');
    }
  }
  
  protected async loadNewPosts() {
    await randomSleep(MIN_SLEEP, MAX_SLEEP);
    await this.page.evaluate(() => {
      const button: HTMLElement = document.querySelector('[data-control-name="new_updates"]');
      if (button) {
        button.click();
      }
    });
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(FEED_URL, { waitUntil: 'load' });
      
      await this.loadNewPosts();
      
      setTimeout(() => {
        resolve();
        this.letLive = false;
      }, this.timeToLive);
      
      while (this.letLive) {
        await this.initScroll();
        await this.leaveReaction();
      }
    });
  }
}
