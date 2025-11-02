use soroban_sdk::{testutils::Address as _, Address};
use crate::{
    storage::{
        commission::read_commission,
        contract_balance::read_contract_balance,
        car::read_car,
    },
    tests::config::contract::ContractTest,
};

#[test]
pub fn test_set_commission() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let commission = 500_i128;
    
    env.mock_all_auths();
    contract.set_commission(&commission);

    let stored_commission = env.as_contract(&contract.address, || read_commission(&env));
    assert_eq!(stored_commission, commission);
}

#[test]
pub fn test_get_commission() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    // Default commission should be 0
    let commission = contract.get_commission();
    assert_eq!(commission, 0);

    let new_commission = 300_i128;
    env.mock_all_auths();
    contract.set_commission(&new_commission);

    let stored_commission = contract.get_commission();
    assert_eq!(stored_commission, new_commission);
}

#[test]
pub fn test_rental_with_commission() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    let commission = 200_i128;
    
    let (_, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    env.mock_all_auths();
    token_admin.mint(&renter, &amount_mint);

    env.mock_all_auths();
    contract.set_commission(&commission);

    env.mock_all_auths();
    contract.add_car(&owner, &price_per_day);

    // 💰 Depósito + Comisión: El total debe ser amount + commission
    let total_expected = amount + commission;

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
    assert_eq!(admin_commission_balance, commission);
}

#[test]
pub fn test_withdraw_admin_commissions() {
    let ContractTest { env, contract, token, .. } = ContractTest::setup();

    let admin = contract.get_admin();
    let owner = Address::generate(&env);
    let renter = Address::generate(&env);
    let price_per_day = 1500_i128;
    let total_days = 3;
    let amount = 4500_i128;
    let commission = 300_i128;
    
    let (token_client, token_admin, _) = token;

    let amount_mint = 10_000_i128;
    env.mock_all_auths();
    token_admin.mint(&renter, &amount_mint);

    env.mock_all_auths();
    contract.set_commission(&commission);

    env.mock_all_auths();
    contract.add_car(&owner, &price_per_day);

    env.mock_all_auths();
    contract.rental(&renter, &owner, &total_days, &amount);

    // Verificar que hay comisiones acumuladas
    let admin_commission_balance_before = contract.get_admin_commission_balance();
    assert_eq!(admin_commission_balance_before, commission);

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
    assert_eq!(admin_balance_after - admin_balance_before, commission);

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
