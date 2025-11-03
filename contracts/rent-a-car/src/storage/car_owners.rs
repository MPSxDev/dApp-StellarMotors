use soroban_sdk::{Address, Env, Vec};

use crate::storage::types::storage::DataKey;

/// Get the list of all car owner addresses
pub(crate) fn get_car_owners(env: &Env) -> Vec<Address> {
    env.storage()
        .instance()
        .get(&DataKey::CarOwners)
        .unwrap_or_else(|| Vec::new(&env))
}

/// Add a car owner to the registry
pub(crate) fn add_car_owner(env: &Env, owner: &Address) {
    let mut owners = get_car_owners(env);
    
    // Check if owner already exists
    let mut exists = false;
    let len = owners.len();
    for i in 0..len {
        if let Some(addr) = owners.get(i) {
            if addr == *owner {
                exists = true;
                break;
            }
        }
    }
    
    if !exists {
        owners.push_back(owner.clone());
        env.storage().instance().set(&DataKey::CarOwners, &owners);
    }
}

/// Remove a car owner from the registry
pub(crate) fn remove_car_owner(env: &Env, owner: &Address) {
    let owners = get_car_owners(env);
    let mut new_owners = Vec::new(&env);
    let len = owners.len();
    
    for i in 0..len {
        if let Some(addr) = owners.get(i) {
            if addr != *owner {
                new_owners.push_back(addr);
            }
        }
    }
    
    env.storage().instance().set(&DataKey::CarOwners, &new_owners);
}

/// Get the count of car owners
pub(crate) fn get_car_owners_count(env: &Env) -> u32 {
    get_car_owners(env).len()
}
