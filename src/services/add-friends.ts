import { Service } from './service';
import { Page } from 'puppeteer';
import { randomMinMax } from '../utils/random';
import { NETWORK_URL } from '../config/constants';

const MIN_TIME_TO_LIVE = 3e4;
const MAX_TIME_TO_LIVE = 6e4;
const MIN_SLEEP = 1500;
const MAX_SLEEP = 2500;

interface Options {
  page: Page;
}

export class AddFriends implements Service {
  public name: 'add friends service';
  protected page: Page;
  protected timeToLive: number;
  protected letLive = true;
  
  constructor({ page }: Options) {
    this.page = page;
    this.timeToLive = randomMinMax(MIN_TIME_TO_LIVE, MAX_TIME_TO_LIVE);
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(NETWORK_URL, { waitUntil: 'load' });
    
      setTimeout(() => {
        this.letLive = false;
        resolve();
      }, this.timeToLive);
    })
  }
}
