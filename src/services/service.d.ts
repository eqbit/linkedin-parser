export interface Service {
  name: string;
  work: () => Promise<unknown>;
}
