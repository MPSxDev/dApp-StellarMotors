import { ICar } from "./car";

export type CreateCar = Omit<ICar, "status"> & {
  commissionPercentage: number; // Required commission percentage (e.g., 5 for 5%)
};
