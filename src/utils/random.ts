export const randomMinMax = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min);

export const chance = (percentage: number) => {
  return Math.random() * 100 < percentage;
}
