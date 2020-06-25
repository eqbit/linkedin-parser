export const sleep = (milliseconds: number) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

export const randomSleep = async (min: number, max: number) => {
  const gotoTimeout = Math.floor(Math.random() * (max - min + 1) + min);
  await sleep(gotoTimeout);
};
