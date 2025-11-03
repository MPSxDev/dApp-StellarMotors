import type { ClientOptions } from "@stellar/stellar-sdk/contract";
import { CarStatus } from "./car-status";

export interface IBaseContractClient {
  readonly options: ClientOptions;
  toXDR(): string;
}

export interface IRentACarContract extends IBaseContractClient {
  __constructor: ({
    admin,
    token,
  }: {
    admin: string;
    token: string;
  }) => Promise<this>;

  add_car: ({
    owner,
    price_per_day,
    commission_percentage,
  }: {
    owner: string;
    price_per_day: number;
    commission_percentage: number; // Commission percentage in basis points (100 = 1%, 500 = 5%, etc.)
  }) => Promise<this>;

  get_car_status: ({ owner }: { owner: string }) => Promise<CarStatus>;

  get_car: ({
    owner,
  }: {
    owner: string;
  }) => Promise<{
    price_per_day: number;
    car_status: CarStatus;
    available_to_withdraw: number;
    commission_percentage: number;
  }>;

  rental: ({
    renter,
    owner,
    total_days_to_rent,
    amount,
  }: {
    renter: string;
    owner: string;
    total_days_to_rent: number;
    amount: number;
  }) => Promise<this>;

  remove_car: ({ owner }: { owner: string }) => Promise<this>;

  payout_owner: ({
    owner,
    amount,
  }: {
    owner: string;
    amount: number;
  }) => Promise<this>;

  end_rental: ({
    renter,
    owner,
  }: {
    renter: string;
    owner: string;
  }) => Promise<this>;

  get_rental: ({
    renter,
    owner,
  }: {
    renter: string;
    owner: string;
  }) => Promise<{
    total_days_to_rent: number;
    amount: number;
    start_time: number;
    end_time: number;
  }>;

  get_available_to_withdraw: ({
    owner,
  }: {
    owner: string;
  }) => Promise<number>;

  get_admin_commission_balance: () => Promise<number>;

  withdraw_admin_commissions: () => Promise<this>;
}
