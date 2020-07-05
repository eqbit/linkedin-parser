import { Service } from '../types';
import { Page } from 'puppeteer';
import { randomMinMax } from '../utils/random';
import { NETWORK_URL } from '../config/constants';
import { addFriendsChecker } from '../modules/availability-checkers/add-friends';

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

const MAX_INVITES_PER_RUN = 12;

interface Options {
  page: Page;
}

export class AddFriends implements Service {
  public name = 'add friends service';
  protected page: Page;
  protected timeToLive: number;
  protected letLive = true;
  protected isScrolledToList = false;
  protected invited = 0;
  
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
  
  protected async scrollUnit() {
    for (let i = 1; i < randomMinMax(6, 10); i++) {
      await this.scrollPage();
    }
    await this.page.waitFor(randomMinMax(MIN_SLEEP_BETWEEN_SCROLL, MAX_SLEEP_BETWEEN_SCROLL));
  }
  
  protected async isRecommendsInViewport() {
    const list = await this.page.$('.mn-cohorts-list + div .discover-entity-list');
    return list && await list.isIntersectingViewport();
  }
  
  protected async scrollToList() {
    await this.scrollUnit();
  
    if (await this.isRecommendsInViewport()) {
      this.isScrolledToList = true;
      console.log('scrolled to the list');
    }
  }
  
  protected async isNextFriendsInViewport() {
    const button = await this.page.$('.mn-cohorts-list + div .discover-entity-list [data-control-name=invite]');
    return button && await button.isIntersectingViewport();
  }
  
  protected checkTotalInvitesPerDay() {
    if (!addFriendsChecker.isAllowed()) {
      console.log('Day limit reached. Gonna stop the service');
      this.letLive = false;
    }
  }
  
  protected async addFriend() {
    await this.page.waitFor(randomMinMax(MIN_SLEEP, MAX_SLEEP));
    
    while (!await this.isNextFriendsInViewport()) {
      await this.scrollUnit();
    }
    
    const inviteNext = () => {
      const button: HTMLElement = document
        .querySelector('.mn-cohorts-list + div .discover-entity-list [data-control-name=invite]');
      button.click();
    }
    
    await this.page.evaluate(inviteNext);
    console.log('Sent an invite');
    this.invited++;
    addFriendsChecker.addOne();
    
    this.checkTotalInvitesPerDay();
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(NETWORK_URL, { waitUntil: 'load' });
  
      const stopService = () => {
        this.letLive = false;
        resolve();
      }
      
      const timeout = setTimeout(() => {
        clearTimeout(timeout);
        stopService();
      }, this.timeToLive);
      
      while (this.letLive) {
        if (!this.isScrolledToList) {
          await this.scrollToList();
        } else {
          if (this.invited < MAX_INVITES_PER_RUN) {
            await this.addFriend();
          } else {
            console.log(`sent ${MAX_INVITES_PER_RUN} invites, gonna stop the process for now`);
            
            await this.page.waitFor(randomMinMax(MIN_SLEEP, MAX_SLEEP));
            clearTimeout(timeout);
            stopService();
          }
        }
      }
    })
  }
}
