use soroban_sdk::contracttype;
use soroban_sdk::String;

use crate::storage::types::car_status::CarStatus;

#[derive(Clone)]
#[contracttype]
pub struct Car {
    pub brand: String,
    pub model: String,
    pub color: String,
    pub passengers: u32,
    pub ac: bool,
    pub price_per_day: i128,
    pub car_status: CarStatus,
    pub available_to_withdraw: i128,
    pub commission_percentage: i128, // Commission percentage in basis points (1% = 100, 5% = 500, etc.)
}
