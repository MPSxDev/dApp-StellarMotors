use soroban_sdk::{testutils::Address as _, Address};
use crate::{
    storage::{car::read_car, contract_balance::read_contract_balance},
    tests::config::contract::ContractTest,
};

#[test]
pub fn test_payout_owner_successfully() {
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

    let brand = soroban_sdk::String::from_slice(&env, "TestBrand");
    let model = soroban_sdk::String::from_slice(&env, "TestModel");
    let color = soroban_sdk::String::from_slice(&env, "Black");
    let passengers = 4_u32;
    let ac = true;

    env.mock_all_auths();
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &0_i128); // 0% commission
    
    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // Note: With commission feature, the contract balance includes commission.
    // Since commission defaults to 0, the balance should equal the amount.
    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, amount);

    // 🚗 Retiro de owners restringido: El auto debe estar devuelto primero
    env.mock_all_auths();
    contract.end_rental(&renter, &owner);

    env.mock_all_auths();
    contract.payout_owner(&owner, &amount);

    let car = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car.available_to_withdraw, 0);

    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, 0);
}
