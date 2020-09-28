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
    for (let i = 1; i < randomMinMax(2, 4); i++) {
      await this.scrollPage();
    }
    await this.page.waitFor(randomMinMax(MIN_SLEEP_BETWEEN_SCROLL, MAX_SLEEP_BETWEEN_SCROLL));
  }

  protected async isAnyFriendsLeftToAdd() {
    return Boolean(await this.page
      .$('.search-result--person .search-result__actions .search-result__action-button:not([disabled])'));
  }

  protected async isNextFriendsInViewport() {
    const button = await this.page
      .$('.search-result--person .search-result__actions .search-result__action-button:not([disabled])');
    return !!button && await button.isIntersectingViewport();
  }

  protected async isNextPageButtonInViewport() {
    const button = await this.page.$('.artdeco-pagination__button--next');
    return !!button && await button.isIntersectingViewport();
  }

  protected checkTotalInvitesPerDay() {
    if (!addFriendsChecker.isAllowed()) {
      console.log('Day limit reached. Gonna stop the service');
      this.letLive = false;
    }
  }

  protected async addFriend() {
    await this.page.waitFor(randomMinMax(MIN_SLEEP, MAX_SLEEP));

    if (!await this.isAnyFriendsLeftToAdd()) {
      while (!await this.isNextPageButtonInViewport()) {
        await this.scrollUnit();
      }

      const navigateToNextPage = () => {
        const button: HTMLElement = document
          .querySelector('.artdeco-pagination__button--next');
        button.click();
      }

      await this.page.evaluate(navigateToNextPage);

      return;
    }

    while (!await this.isNextFriendsInViewport()) {
      await this.scrollUnit();
    }

    const inviteNext = () => {
      const button: HTMLElement = document
        .querySelector('.search-result--person .search-result__actions .search-result__action-button:not([disabled])');
      button.click();
    }
    await this.page.evaluate(inviteNext);

    await this.page.waitForSelector('.artdeco-modal__actionbar');
    const submitPopup = () => {
      const button: HTMLElement = document
        .querySelector('.artdeco-modal__actionbar .artdeco-button--primary');
      button.click();
    }
    await this.page.waitFor(randomMinMax(MIN_SLEEP, MAX_SLEEP));
    await this.page.evaluate(submitPopup);

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
        if (this.invited < MAX_INVITES_PER_RUN) {
          await this.addFriend();
        } else {
          console.log(`sent ${MAX_INVITES_PER_RUN} invites, gonna stop the process for now`);

          await this.page.waitFor(randomMinMax(MIN_SLEEP, MAX_SLEEP));
          clearTimeout(timeout);
          stopService();
        }
      }
    })
  }
}
