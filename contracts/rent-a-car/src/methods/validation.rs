use soroban_sdk::Env;
use crate::storage::types::errors::RentACarError;

/// Validates that an amount is positive
pub fn validate_positive_amount(amount: i128) -> Result<(), RentACarError> {
    if amount <= 0 {
        return Err(RentACarError::InvalidAmount);
    }
    Ok(())
}

/// Validates that price per day is positive
pub fn validate_price(price_per_day: i128) -> Result<(), RentACarError> {
    if price_per_day <= 0 {
        return Err(RentACarError::InvalidPrice);
    }
    Ok(())
}

/// Validates that rental days is positive
pub fn validate_rental_days(days: u32) -> Result<(), RentACarError> {
    if days == 0 {
        return Err(RentACarError::InvalidDays);
    }
    Ok(())
}

/// Validates that payment amount matches expected price
pub fn validate_payment_amount(amount: i128, price_per_day: i128, days: u32) -> Result<(), RentACarError> {
    validate_positive_amount(amount)?;
    let expected_amount = price_per_day
        .checked_mul(days as i128)
        .ok_or(RentACarError::AmountMismatch)?;
    
    if amount != expected_amount {
        return Err(RentACarError::AmountMismatch);
    }
    Ok(())
}

/// Validates that withdrawal amount doesn't exceed available funds
pub fn validate_withdrawal_amount(amount: i128, available: i128) -> Result<(), RentACarError> {
    validate_positive_amount(amount)?;
    if amount > available {
        return Err(RentACarError::InsufficientFunds);
    }
    Ok(())
}

/// Validates that renter is not the same as owner (self-rental prevention)
pub fn validate_not_self_rental(renter: &soroban_sdk::Address, owner: &soroban_sdk::Address) -> Result<(), RentACarError> {
    if renter == owner {
        return Err(RentACarError::SelfRental);
    }
    Ok(())
}
