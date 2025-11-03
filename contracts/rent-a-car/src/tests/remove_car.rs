use soroban_sdk::{testutils::Address as _, Address};
use crate::{storage::car::has_car, tests::config::contract::ContractTest};

#[test]
pub fn test_remove_car_deletes_from_storage() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;
    let commission_percentage = 500_i128; // 5%

    env.mock_all_auths();
    contract.add_car(&owner, &price_per_day, &commission_percentage);
    assert!(env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    }));

    env.mock_all_auths();
    contract.remove_car(&owner);
    assert!(!env.as_contract(&contract.address, || {
        has_car(&env, &owner)
    }));
}
