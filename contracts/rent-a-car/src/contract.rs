use soroban_sdk::{contract, contractimpl, Address, Env};
use crate::interface::contract::RentACarContractTrait;
use crate::storage::{
    admin::{write_admin, read_admin, has_admin},
    token::{write_token, read_token},
    car::{write_car, read_car, remove_car as remove_car_storage, has_car as storage_has_car},
    rental::{write_rental, read_rental, remove_rental, has_rental as storage_has_rental},
    contract_balance::{read_contract_balance, write_contract_balance},
    commission::{read_commission, write_commission, read_admin_commission_balance, write_admin_commission_balance},
};
use crate::storage::types::car_status::CarStatus;
use crate::storage::structs::car::Car;
use crate::storage::structs::rental::Rental;
use crate::methods::token::token::token_transfer;
use crate::methods::validation::{
    validate_positive_amount, validate_price, validate_rental_days,
    validate_payment_amount, validate_withdrawal_amount, validate_not_self_rental,
};

#[contract]
pub struct RentACarContract;

#[contractimpl]
impl RentACarContractTrait for RentACarContract {
    fn __constructor(env: &Env, admin: Address, token: Address) {
        write_admin(env, &admin);
        write_token(env, &token);
    }

    fn initialize(env: &Env, admin: Address, token: Address) {
        if has_admin(env) {
            panic!("Contract already initialized");
        }
        write_admin(env, &admin);
        write_token(env, &token);
    }

    fn get_admin(env: &Env) -> Address {
        read_admin(env).unwrap_or_else(|_| panic!("Contract not initialized"))
    }

    fn add_car(env: &Env, owner: Address, price_per_day: i128) {
        let admin = read_admin(env).unwrap_or_else(|_| panic!("Contract not initialized"));
        admin.require_auth();
        
        validate_price(price_per_day).unwrap_or_else(|e| panic!("Invalid price: {:?}", e));
        
        let car = Car {
            price_per_day,
            car_status: CarStatus::Available,
            available_to_withdraw: 0,
        };

        write_car(env, &owner, &car);
    }

    fn get_car_status(env: &Env, owner: Address) -> CarStatus {
        let car = read_car(env, &owner).unwrap_or_else(|_| panic!("Car not found"));
        car.car_status
    }

    fn rental(env: &Env, renter: Address, owner: Address, total_days_to_rent: u32, amount: i128) {
        renter.require_auth();
        
        // Validate input
        validate_rental_days(total_days_to_rent).unwrap_or_else(|e| panic!("Invalid days: {:?}", e));
        validate_not_self_rental(&renter, &owner).unwrap_or_else(|e| panic!("{:?}", e));
        
        // Check if car exists
        let mut car = read_car(env, &owner).unwrap_or_else(|_| panic!("Car not found"));
        
        // Validate car is available
        if car.car_status != CarStatus::Available {
            panic!("Car is not available");
        }
        
        // Validate payment amount matches price (base amount without commission)
        validate_payment_amount(amount, car.price_per_day, total_days_to_rent)
            .unwrap_or_else(|e| panic!("{:?}", e));
        
        // Check if rental already exists (prevent double-rental)
        if storage_has_rental(env, &renter, &owner) {
            panic!("Rental already exists");
        }

        // Get commission and calculate total amount (deposit + commission)
        let commission = read_commission(env);
        let total_amount = amount
            .checked_add(commission)
            .unwrap_or_else(|| panic!("Amount overflow when adding commission"));

        // Calculate timestamps
        let start_time: u64 = env.ledger().timestamp();
        // Calculate end time (total_days_to_rent in seconds)
        let seconds_per_day: u64 = 86400;
        let end_time = start_time + (total_days_to_rent as u64 * seconds_per_day);

        car.car_status = CarStatus::Rented;
        // Only deposit amount goes to owner's available balance
        car.available_to_withdraw = car.available_to_withdraw
            .checked_add(amount)
            .unwrap_or_else(|| panic!("Balance overflow"));

        let rental = Rental {
            total_days_to_rent,
            amount,
            start_time,
            end_time,
        };

        // Update contract balance with total amount (deposit + commission)
        let mut contract_balance = read_contract_balance(&env);
        contract_balance = contract_balance
            .checked_add(total_amount)
            .unwrap_or_else(|| panic!("Contract balance overflow"));
        
        // Accumulate commission for admin
        let mut admin_commission_balance = read_admin_commission_balance(env);
        admin_commission_balance = admin_commission_balance
            .checked_add(commission)
            .unwrap_or_else(|| panic!("Admin commission balance overflow"));
        
        write_admin_commission_balance(env, &admin_commission_balance);
        write_contract_balance(&env, &contract_balance);
        write_car(env, &owner, &car);
        write_rental(env, &renter, &owner, &rental);

        // Transfer total amount (deposit + commission) from renter to contract
        token_transfer(&env, &renter, &env.current_contract_address(), &total_amount);
    }

    fn remove_car(env: &Env, owner: Address) {
        let admin = read_admin(env).unwrap_or_else(|_| panic!("Contract not initialized"));
        admin.require_auth();
        
        let car = read_car(env, &owner).unwrap_or_else(|_| panic!("Car not found"));
        
        // Prevent removing car that is currently rented
        if car.car_status == CarStatus::Rented {
            panic!("Cannot remove car that is currently rented");
        }
        
        remove_car_storage(env, &owner);
    }

    fn payout_owner(env: &Env, owner: Address, amount: i128) {
        owner.require_auth();
        env.current_contract_address().require_auth();
    
        let mut car = read_car(&env, &owner).unwrap_or_else(|_| panic!("Car not found"));
        
        // 🚗 Retiro de owners restringido: Solo permitir retiro cuando el auto esté devuelto
        if car.car_status != CarStatus::Available {
            panic!("Car must be returned before owner can withdraw funds");
        }
        
        // Validate withdrawal amount doesn't exceed available
        validate_withdrawal_amount(amount, car.available_to_withdraw)
            .unwrap_or_else(|e| panic!("{:?}", e));
        
        let mut contract_balance = read_contract_balance(&env);

        car.available_to_withdraw = car.available_to_withdraw
            .checked_sub(amount)
            .unwrap_or_else(|| panic!("Underflow in available_to_withdraw"));
        
        contract_balance = contract_balance
            .checked_sub(amount)
            .unwrap_or_else(|| panic!("Underflow in contract balance"));

        write_car(&env, &owner, &car);
        write_contract_balance(&env, &contract_balance);

        token_transfer(&env, &env.current_contract_address(), &owner, &amount);
    }

    fn get_car(env: &Env, owner: Address) -> Car {
        read_car(env, &owner).unwrap_or_else(|_| panic!("Car not found"))
    }

    fn has_car(env: &Env, owner: Address) -> bool {
        storage_has_car(env, &owner)
    }

    fn get_rental(env: &Env, renter: Address, owner: Address) -> Rental {
        read_rental(env, &renter, &owner).unwrap_or_else(|_| panic!("Rental not found"))
    }

    fn has_rental(env: &Env, renter: Address, owner: Address) -> bool {
        storage_has_rental(env, &renter, &owner)
    }

    fn get_available_to_withdraw(env: &Env, owner: Address) -> i128 {
        let car = read_car(env, &owner).unwrap_or_else(|_| panic!("Car not found"));
        car.available_to_withdraw
    }

    fn end_rental(env: &Env, renter: Address, owner: Address) {
        renter.require_auth();
        
        let _rental = read_rental(env, &renter, &owner).unwrap_or_else(|_| panic!("Rental not found"));
        
        // Verify rental exists (hasn't been ended)
        let mut car = read_car(env, &owner).unwrap_or_else(|_| panic!("Car not found"));
        
        if car.car_status != CarStatus::Rented {
            panic!("Car is not currently rented");
        }
        
        // Mark car as available
        car.car_status = CarStatus::Available;
        write_car(env, &owner, &car);
        
        // Remove rental record
        remove_rental(env, &renter, &owner);
    }

    // 🧾 Comisión del administrador
    fn set_commission(env: &Env, commission: i128) {
        let admin = read_admin(env).unwrap_or_else(|_| panic!("Contract not initialized"));
        admin.require_auth();
        
        // Validate commission is non-negative (0 means no commission)
        if commission < 0 {
            panic!("Commission cannot be negative");
        }
        
        write_commission(env, &commission);
    }

    fn get_commission(env: &Env) -> i128 {
        read_commission(env)
    }

    // 💸 Retiro de fondos del administrador
    fn withdraw_admin_commissions(env: &Env) {
        let admin = read_admin(env).unwrap_or_else(|_| panic!("Contract not initialized"));
        admin.require_auth();
        
        let mut admin_commission_balance = read_admin_commission_balance(env);
        
        if admin_commission_balance <= 0 {
            panic!("No commissions available to withdraw");
        }
        
        let amount_to_withdraw = admin_commission_balance;
        
        // Reset admin commission balance
        admin_commission_balance = 0;
        write_admin_commission_balance(env, &admin_commission_balance);
        
        // Update contract balance
        let mut contract_balance = read_contract_balance(&env);
        contract_balance = contract_balance
            .checked_sub(amount_to_withdraw)
            .unwrap_or_else(|| panic!("Underflow in contract balance"));
        write_contract_balance(&env, &contract_balance);
        
        // Transfer commissions to admin
        token_transfer(&env, &env.current_contract_address(), &admin, &amount_to_withdraw);
    }

    fn get_admin_commission_balance(env: &Env) -> i128 {
        read_admin_commission_balance(env)
    }
}
