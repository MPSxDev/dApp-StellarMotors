use soroban_sdk::{testutils::Address as _, Address, String};
use crate::{storage::car::has_car, tests::config::contract::ContractTest};

#[test]
pub fn test_remove_car_deletes_from_storage() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let brand = String::from_slice(&env, "TestBrand");
    let model = String::from_slice(&env, "TestModel");
    let color = String::from_slice(&env, "Black");
    let passengers = 4_u32;
    let ac = true;
    let price_per_day = 1500_i128;
    let commission_percentage = 500_i128; // 5%

    env.mock_all_auths();
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &commission_percentage);
    assert!(env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    }));

    env.mock_all_auths();
    contract.remove_car(&owner);
    assert!(!env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    }));
}
