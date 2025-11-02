use soroban_sdk::{testutils::Address as _, Address};
use crate::{storage::types::car_status::CarStatus, tests::config::contract::ContractTest};

#[test]
pub fn test_get_car_status_returns_available() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    env.mock_all_auths();
    contract.add_car(&owner, &price_per_day);

    let status = contract.get_car_status(&owner);
    assert_eq!(status, CarStatus::Available);
}


