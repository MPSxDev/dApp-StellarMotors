use soroban_sdk::{Address, Env};

use crate::storage::{structs::rental::Rental, types::storage::DataKey, types::errors::RentACarError};

pub(crate) fn has_rental(env: &Env, renter: &Address, car_owner: &Address) -> bool {
    env.storage().instance().has(&DataKey::Rental(renter.clone(), car_owner.clone()))
}

pub(crate) fn write_rental(env: &Env, renter: &Address, car_owner: &Address, rental: &Rental) {
    env.storage().instance().set(&DataKey::Rental(renter.clone(), car_owner.clone()), rental);
}

pub(crate) fn read_rental(env: &Env, renter: &Address, car_owner: &Address) -> Result<Rental, RentACarError> {
    env.storage()
        .instance()
        .get(&DataKey::Rental(renter.clone(), car_owner.clone()))
        .ok_or(RentACarError::NotFound)
}

pub(crate) fn remove_rental(env: &Env, renter: &Address, car_owner: &Address) {
    env.storage().instance().remove(&DataKey::Rental(renter.clone(), car_owner.clone()));
}
