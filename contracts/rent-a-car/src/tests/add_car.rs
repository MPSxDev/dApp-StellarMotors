use soroban_sdk::{testutils::Address as _, Address, String};
use crate::{storage::{car::read_car, types::car_status::CarStatus}, tests::config::contract::ContractTest};

#[test]
pub fn test_add_car_successfully() {
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

    let stored_car = env.as_contract(&contract.address, || {
        read_car(&env, &owner).unwrap()
    });

    assert_eq!(stored_car.brand, brand);
    assert_eq!(stored_car.model, model);
    assert_eq!(stored_car.color, color);
    assert_eq!(stored_car.passengers, passengers);
    assert_eq!(stored_car.ac, ac);
    assert_eq!(stored_car.price_per_day, price_per_day);
    assert_eq!(stored_car.car_status, CarStatus::Available);
    assert_eq!(stored_car.commission_percentage, commission_percentage);
}
