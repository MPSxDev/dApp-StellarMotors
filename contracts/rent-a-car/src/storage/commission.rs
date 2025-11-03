use soroban_sdk::Env;
use crate::storage::types::storage::DataKey;

/// Lee el balance acumulado de comisiones del administrador
pub fn read_admin_commission_balance(env: &Env) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::AdminCommissionBalance)
        .unwrap_or(0)
}

/// Escribe el balance acumulado de comisiones del administrador
pub fn write_admin_commission_balance(env: &Env, amount: &i128) {
    let key = DataKey::AdminCommissionBalance;
    env.storage().persistent().set(&key, amount);
}
