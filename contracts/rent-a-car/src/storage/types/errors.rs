use soroban_sdk::{contracterror, contracttype};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum RentACarError {
    // General errors
    NotFound = 1,              // Car, rental, or resource not found
    AlreadyExists = 2,         // Resource already exists
    
    // Validation errors
    InvalidAmount = 10,       // Amount is zero or negative
    InvalidPrice = 11,        // Price is zero or negative
    InvalidDays = 12,         // Invalid rental days
    AmountMismatch = 13,      // Payment amount doesn't match expected price
    InsufficientFunds = 14,   // Insufficient available funds for withdrawal
    SelfRental = 15,          // Owner trying to rent their own car
    
    // State errors
    CarNotAvailable = 20,     // Car is not available (rented or maintenance)
    CarAlreadyRented = 21,    // Car is already rented
    CarStillRented = 22,      // Cannot remove car that is still rented
    RentalNotActive = 23,     // Rental is not active or doesn't exist
    
    // Authorization errors
    Unauthorized = 30,       // Unauthorized operation
    NotAdmin = 31,           // Not the admin
    NotOwner = 32,           // Not the owner
    
    // Contract state errors
    AlreadyInitialized = 40,  // Contract already initialized
    NotInitialized = 41,      // Contract not initialized
}
