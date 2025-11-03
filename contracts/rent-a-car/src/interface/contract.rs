use soroban_sdk::{Address, Env};
use crate::storage::types::car_status::CarStatus;
use crate::storage::structs::car::Car;
use crate::storage::structs::rental::Rental;

pub trait RentACarContractTrait {
    fn __constructor(env: &Env, admin: Address, token: Address);
    fn initialize(env: &Env, admin: Address, token: Address);
    fn get_admin(env: &Env) -> Address;
    fn add_car(env: &Env, owner: Address, price_per_day: i128, commission_percentage: i128);
    fn get_car_status(env: &Env, owner: Address) -> CarStatus;
    fn rental(env: &Env, renter: Address, owner: Address, total_days_to_rent: u32, amount: i128);
    fn remove_car(env: &Env, owner: Address);
    fn payout_owner(env: &Env, owner: Address, amount: i128);
    
    // Admin commission management
    fn set_commission(env: &Env, commission: i128);
    fn get_commission(env: &Env) -> i128;
    fn withdraw_admin_commissions(env: &Env);
    fn get_admin_commission_balance(env: &Env) -> i128;
    
    // New query functions
    fn get_car(env: &Env, owner: Address) -> Car;
    fn has_car(env: &Env, owner: Address) -> bool;
    fn get_rental(env: &Env, renter: Address, owner: Address) -> Rental;
    fn has_rental(env: &Env, renter: Address, owner: Address) -> bool;
    fn get_available_to_withdraw(env: &Env, owner: Address) -> i128;
    
    // Rental lifecycle management
    fn end_rental(env: &Env, renter: Address, owner: Address);
}