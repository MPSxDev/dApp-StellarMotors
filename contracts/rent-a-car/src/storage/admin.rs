use soroban_sdk::{Address, Env};

use super::types::storage::DataKey;
use super::types::errors::RentACarError;

pub(crate) fn has_admin(env: &Env) -> bool {
    let key = DataKey::Admin;
    env.storage().instance().has(&key)
}

pub(crate) fn read_admin(env: &Env) -> Result<Address, RentACarError> {
    let key = DataKey::Admin;
    env.storage()
        .instance()
        .get(&key)
        .ok_or(RentACarError::NotInitialized)
}

pub(crate) fn write_admin(env: &Env, admin: &Address) {
    let key = DataKey::Admin;
    env.storage().instance().set(&key, admin);
}
