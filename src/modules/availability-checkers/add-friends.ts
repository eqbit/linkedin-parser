const MAX_INVITES_PER_DAY = 75;
const DAY = 8.64e7;

export class AddFriendsChecker {
  protected currentAdds = 0;
  
  constructor() {
    setInterval(() => {
      this.reset();
      console.log(`Day limit reset to ${MAX_INVITES_PER_DAY}`);
    }, DAY);
  }
  
  protected reset() {
    this.currentAdds = 0;
  }
  
  public addOne() {
    this.currentAdds++;
  }
  
  public isAllowed() {
    return this.currentAdds < MAX_INVITES_PER_DAY;
  }
}

export const addFriendsChecker = new AddFriendsChecker();
