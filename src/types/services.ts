import { availableServices } from '../services/available-services';

export interface Service {
  name: string;
  work: () => Promise<unknown>;
}

export type Services = keyof typeof availableServices;
