use soroban_sdk::{testutils::{Address as _, MockAuth, MockAuthInvoke}, IntoVal, Address, String};
use crate::tests::config::contract::ContractTest;

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
pub fn test_unauthorized_user_cannot_add_car() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let fake_admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let brand = String::from_slice(&env, "TestBrand");
    let model = String::from_slice(&env, "TestModel");
    let color = String::from_slice(&env, "Black");
    let passengers = 4_u32;
    let ac = true;
    let price_per_day = 1500_i128;
    let commission_percentage = 500_i128; // 5%

    contract
        .mock_auths(&[MockAuth {
            address: &fake_admin,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "add_car",
                args: (owner.clone(), brand.clone(), model.clone(), color.clone(), passengers, ac, price_per_day, commission_percentage).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .add_car(&owner, &brand, &model, &color, &passengers, &ac, &price_per_day, &commission_percentage);
}
