use soroban_sdk::{testutils::Address as _, Address, String};
use crate::{storage::types::car_status::CarStatus, tests::config::contract::ContractTest};

#[test]
pub fn test_get_car_status_returns_available() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let brand = String::from_slice(&env, "TestBrand");
    let model = String::from_slice(&env, "TestModel");
    let color = String::from_slice(&env, "Black");
    let passengers = 4_u32;
    let ac = true;
    let price_per_day = 1500_i128;

    env.mock_all_auths();
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &500_i128); // 5% commission

    let status = contract.get_car_status(&owner);
    assert_eq!(status, CarStatus::Available);
}
