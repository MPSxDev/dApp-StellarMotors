use soroban_sdk::contracttype;

#[derive(Clone)]
#[contracttype]
pub struct Rental {
    pub total_days_to_rent: u32,
    pub amount: i128,
    pub start_time: u64,      // Ledger timestamp when rental started
    pub end_time: u64,        // Expected end time (start_time + days)
}
