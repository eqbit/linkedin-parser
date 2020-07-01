import { Page } from 'puppeteer';
import { NETWORK_URL } from '../config/constants';
import { randomMinMax } from '../utils/random';
import { Service } from '../types';

const MIN_TIME_TO_LIVE = 2.5e4;
const MAX_TIME_TO_LIVE = 4e4;
const MIN_SLEEP = 1500;
const MAX_SLEEP = 2500;

interface Options {
  page: Page;
}

interface AcceptFriendInviteReturn {
  addedOne: boolean;
  gotMore: boolean;
}

export class AcceptFriends implements Service {
  public name = 'friend invite inspector service';
  protected page: Page;
  protected timeToLive: number;
  protected letLive = true;
  
  constructor({ page }: Options) {
    this.page = page;
    this.timeToLive = randomMinMax(MIN_TIME_TO_LIVE, MAX_TIME_TO_LIVE);
  }
  
  protected async acceptFriendInvite(): Promise<AcceptFriendInviteReturn> {
    await this.page.waitFor(randomMinMax(MIN_SLEEP, MAX_SLEEP));
    
    const acceptAnInvite = (): AcceptFriendInviteReturn => {
      const invites: NodeListOf<HTMLElement> = document.querySelectorAll('li.invitation-card');
      
      if (invites.length) {
        const acceptButton: HTMLElement = invites[0]
          .querySelector('button.invitation-card__action-btn.artdeco-button--secondary');
        
        acceptButton.click();
        
        return {
          addedOne: true,
          gotMore: Boolean(invites.length - 1)
        };
      }
  
      return {
        addedOne: false,
        gotMore: false
      };
    }
    
    return this.page.evaluate(acceptAnInvite);
  }
  
  public async work() {
    return new Promise(async (resolve) => {
      await this.page.goto(NETWORK_URL, { waitUntil: 'load' });
  
      const timeout = setTimeout(() => {
        this.letLive = false;
        resolve();
      }, this.timeToLive);
  
      while (this.letLive) {
        const { gotMore, addedOne } = await this.acceptFriendInvite();
        
        if (addedOne) {
          console.log('Accepted a friend request');
        }
        
        if (!gotMore) {
          clearTimeout(timeout);
          this.letLive = false;
          resolve();
        }
      }
    })
  }
}
