use soroban_sdk::{Address, Env};

use crate::storage::{structs::car::Car, types::storage::DataKey, types::errors::RentACarError};

pub(crate) fn has_car(env: &Env, owner: &Address) -> bool {
    env.storage().instance().has(&DataKey::Car(owner.clone()))
}

pub(crate) fn read_car(env: &Env, owner: &Address) -> Result<Car, RentACarError> {
    env.storage()
        .instance()
        .get(&DataKey::Car(owner.clone()))
        .ok_or(RentACarError::NotFound)
}

pub(crate) fn write_car(env: &Env, owner: &Address, car: &Car) {
    env.storage().instance().set(&DataKey::Car(owner.clone()), car);
}

pub(crate) fn remove_car(env: &Env, owner: &Address) {
    env.storage().instance().remove(&DataKey::Car(owner.clone()));
}
