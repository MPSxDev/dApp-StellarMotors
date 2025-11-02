use soroban_sdk::{testutils::Address as _, Address};
use crate::{storage::{car::read_car, contract_balance::read_contract_balance, rental::read_rental, types::car_status::CarStatus}, tests::config::contract::ContractTest};

#[test]
pub fn test_rental_car_successfully() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    
    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    env.mock_all_auths();
    token_admin.mint(&renter, &amount_mint);

    env.mock_all_auths();
    contract.add_car(&owner, &price_per_day);

    let initial_contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(initial_contract_balance, 0);

    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // 💰 Depósito + Comisión: El balance del contrato incluye el depósito y la comisión
    // Como la comisión por defecto es 0, el balance será igual al amount
    let updated_contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(updated_contract_balance, amount);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car.car_status, CarStatus::Rented);
    assert_eq!(car.available_to_withdraw, amount);

    let rental = env.as_contract(&contract.address, || read_rental(&env, &renter, &owner).unwrap());
    assert_eq!(rental.total_days_to_rent, total_days);
    assert_eq!(rental.amount, amount);
    assert!(rental.start_time >= 0);
    assert!(rental.end_time > rental.start_time);
    // Verify end_time is approximately start_time + (days * 86400 seconds)
    let expected_end_time = rental.start_time + (total_days as u64 * 86400);
    assert_eq!(rental.end_time, expected_end_time);
}
