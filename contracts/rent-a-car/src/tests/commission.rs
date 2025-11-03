use soroban_sdk::{testutils::Address as _, Address};
use crate::{
    storage::{
        contract_balance::read_contract_balance,
        car::read_car,
    },
    tests::config::contract::ContractTest,
};

#[test]
pub fn test_rental_with_percentage_commission() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let commission_percentage = 500_i128; // 5% commission
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
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &commission_percentage);

    // Calculate expected commission: 5% of 4500 = 225
    let expected_commission = (amount * commission_percentage) / 10000_i128;
    let total_expected = amount + expected_commission;

    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // Verificar que el balance del contrato incluye depósito + comisión
    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, total_expected);

    // Verificar que solo el depósito va al available_to_withdraw del owner
    let car = env.as_contract(&contract.address, || read_car(&env, &owner).unwrap());
    assert_eq!(car.available_to_withdraw, amount);

    // Verificar que la comisión se acumuló para el admin
    let admin_commission_balance = contract.get_admin_commission_balance();
    assert_eq!(admin_commission_balance, expected_commission);
}

#[test]
pub fn test_withdraw_admin_commissions() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let admin = contract.get_admin();
    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let commission_percentage = 500_i128; // 5% commission
    let total_days = 3;
    let amount = 4500_i128;
    
    let (token_client, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    env.mock_all_auths();
    token_admin.mint(&renter, &amount_mint);

    let brand = soroban_sdk::String::from_slice(&env, "TestBrand");
    let model = soroban_sdk::String::from_slice(&env, "TestModel");
    let color = soroban_sdk::String::from_slice(&env, "Black");
    let passengers = 4_u32;
    let ac = true;

    env.mock_all_auths();
    contract.add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &commission_percentage);

    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // Calculate expected commission: 5% of 4500 = 225
    let expected_commission = (amount * commission_percentage) / 10000_i128;
    
    // Verificar que hay comisiones acumuladas
    let admin_commission_balance_before = contract.get_admin_commission_balance();
    assert_eq!(admin_commission_balance_before, expected_commission);

    // Obtener balance inicial del admin
    let admin_balance_before = token_client.balance(&admin);

    // 💸 Retiro de fondos del administrador
    env.mock_all_auths();
    contract.withdraw_admin_commissions();

    // Verificar que las comisiones se retiraron
    let admin_commission_balance_after = contract.get_admin_commission_balance();
    assert_eq!(admin_commission_balance_after, 0);

    // Verificar que el admin recibió los fondos
    let admin_balance_after = token_client.balance(&admin);
    assert_eq!(admin_balance_after - admin_balance_before, expected_commission);

    // Verificar que el balance del contrato disminuyó
    let contract_balance = env.as_contract(&contract.address, || read_contract_balance(&env));
    assert_eq!(contract_balance, amount); // Solo queda el depósito del owner
}

#[test]
#[should_panic(expected = "No commissions available to withdraw")]
pub fn test_withdraw_admin_commissions_no_funds() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    env.mock_all_auths();
    contract.withdraw_admin_commissions();
}
