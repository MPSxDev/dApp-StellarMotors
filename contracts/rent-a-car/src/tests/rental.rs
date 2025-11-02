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

    let updated_contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(updated_contract_balance, amount);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner));
    assert_eq!(car.car_status, CarStatus::Rented);
    assert_eq!(car.available_to_withdraw, amount);

    let rental = env.as_contract(&contract.address, || read_rental(&env, &renter, &owner));
    assert_eq!(rental.total_days_to_rent, total_days);
    assert_eq!(rental.amount, amount);
}
