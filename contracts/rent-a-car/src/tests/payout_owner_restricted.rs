use soroban_sdk::{testutils::Address as _, Address};
use crate::{
    storage::{car::read_car, types::car_status::CarStatus},
    tests::config::contract::ContractTest,
};

#[test]
#[should_panic(expected = "Car must be returned before owner can withdraw funds")]
pub fn test_payout_owner_fails_when_car_is_rented() {
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
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &500_i128); // 5% commission
    
    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // Verificar que el auto está alquilado
    let car = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car.car_status, CarStatus::Rented);

    // 🚗 Retiro de owners restringido: Debe fallar si el auto está alquilado
    env.mock_all_auths();
    contract.payout_owner(&owner, &amount);
}

#[test]
pub fn test_payout_owner_succeeds_after_end_rental() {
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
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &500_i128); // 5% commission
    
    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // Verificar que el auto está alquilado
    let car_before = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car_before.car_status, CarStatus::Rented);

    // Terminar el rental
    env.mock_all_auths();
    contract.end_rental(&renter, &owner);

    // Verificar que el auto está disponible
    let car_after = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car_after.car_status, CarStatus::Available);

    // Ahora el owner puede retirar
    env.mock_all_auths();
    contract.payout_owner(&owner, &amount);

    let car_final = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car_final.available_to_withdraw, 0);
}
