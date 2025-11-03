use soroban_sdk::Env;
use crate::storage::types::storage::DataKey;

/// Lee el porcentaje de comisión (basis points)
pub fn read_commission(env: &Env) -> i128 {
    env.storage()
        .instance()
        .get(&DataKey::Commission)
        .unwrap_or(0)
}

/// Escribe el porcentaje de comisión (basis points)
pub fn write_commission(env: &Env, commission: &i128) {
    env.storage().instance().set(&DataKey::Commission, commission);
}

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
