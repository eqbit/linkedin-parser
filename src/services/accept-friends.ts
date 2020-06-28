import { Page } from 'puppeteer';
import { NETWORK_URL } from '../config/constants';
import { randomMinMax } from '../utils/random';
import { Service } from './service';
import { randomSleep } from '../utils/sleep';

const MIN_TIME_TO_LIVE = 2.5e4;
const MAX_TIME_TO_LIVE = 4e4;
const MIN_SLEEP = 1500;
const MAX_SLEEP = 2500;

interface Options {
  page: Page;
}

export class AcceptFriends implements Service {
  protected page: Page;
  protected timeToLive: number;
  protected letLive = true;
  
  constructor({ page }: Options) {
    this.page = page;
    this.timeToLive = randomMinMax(MIN_TIME_TO_LIVE, MAX_TIME_TO_LIVE);
  }
  
  protected async acceptFriendInvite() {
    await randomSleep(MIN_SLEEP, MAX_SLEEP);
    
    const acceptAnInvite = () => {
      const invites: NodeListOf<HTMLElement> = document.querySelectorAll('li.invitation-card');
      
      if (invites.length) {
        const acceptButton: HTMLElement = invites[0]
          .querySelector('button.invitation-card__action-btn.artdeco-button--secondary');
        
        acceptButton.click();
        
        return invites.length - 1;
      }
  
      return 0;
    }
    
    const invitesLength = await this.page.evaluate(acceptAnInvite);
    
    return !!invitesLength;
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(NETWORK_URL, { waitUntil: 'load' });
  
      const timeout = setTimeout(() => {
        this.letLive = false;
        resolve();
      }, this.timeToLive);
  
      while (this.letLive) {
        const isThereAnyInvites = await this.acceptFriendInvite();
        if (!isThereAnyInvites) {
          clearTimeout(timeout);
          this.letLive = false;
          resolve();
        }
      }
    })
  }
}
