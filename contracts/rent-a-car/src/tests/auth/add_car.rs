use soroban_sdk::{testutils::{Address as _, MockAuth, MockAuthInvoke}, IntoVal, Address};
use crate::tests::config::contract::ContractTest;

#[test]
#[should_panic(expected = "Error(Auth, InvalidAction)")]
pub fn test_unauthorized_user_cannot_add_car() {
    let ContractTest { env, contract, .. } = ContractTest::setup();

    let fake_admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let price_per_day = 1500_i128;

    contract
        .mock_auths(&[MockAuth {
            address: &fake_admin,
            invoke: &MockAuthInvoke {
                contract: &contract.address.clone(),
                fn_name: "add_car",
                args: (owner.clone(), price_per_day).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .add_car(&owner, &price_per_day);
}

