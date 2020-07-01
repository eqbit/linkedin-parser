import { Service } from '../types';
import { Page } from 'puppeteer';
import { randomMinMax } from '../utils/random';
import { NETWORK_URL } from '../config/constants';

const MIN_TIME_TO_LIVE = 9e4;
const MAX_TIME_TO_LIVE = 1.2e5;
const MIN_SLEEP = 1500;
const MAX_SLEEP = 2500;
const MIN_SCROLL = 50;
const MAX_SCROLL = 60;
const MIN_SCROLL_SLEEP = 50;
const MAX_SCROLL_SLEEP = 120;
const MIN_SLEEP_BETWEEN_SCROLL = 120;
const MAX_SLEEP_BETWEEN_SCROLL = 1000;

interface Options {
  page: Page;
}

export class AddFriends implements Service {
  public name = 'add friends service';
  protected page: Page;
  protected timeToLive: number;
  protected letLive = true;
  
  constructor({ page }: Options) {
    this.page = page;
    this.timeToLive = randomMinMax(MIN_TIME_TO_LIVE, MAX_TIME_TO_LIVE);
  }
  
  protected async scrollPage() {
    await this.page.waitFor(randomMinMax(MIN_SCROLL_SLEEP, MAX_SCROLL_SLEEP));
    await this.page.evaluate(({ distance }) => {
      window.scrollBy(0, distance);
    }, { distance: randomMinMax(MIN_SCROLL, MAX_SCROLL)});
  }
  
  protected async isRecommendsInViewport() {
    const list = await this.page.$('.mn-cohorts-list + div .discover-entity-list');
    return list && await list.isIntersectingViewport();
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(NETWORK_URL, { waitUntil: 'load' });
    
      setTimeout(() => {
        this.letLive = false;
        resolve();
      }, this.timeToLive);
      
      while (this.letLive) {
        for (let i = 1; i < randomMinMax(3, 6); i++) {
          await this.scrollPage();
        }
        
        await this.page.waitFor(randomMinMax(MIN_SLEEP_BETWEEN_SCROLL, MAX_SLEEP_BETWEEN_SCROLL));
        
        if (await this.isRecommendsInViewport()) {
          console.log('yeah!');
        }
      }
    })
  }
}
