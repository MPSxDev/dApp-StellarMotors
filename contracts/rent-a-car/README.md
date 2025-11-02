# Rent-A-Car Contract

A decentralized car rental smart contract built on Stellar's Soroban platform. This contract enables car owners to list their vehicles for rent and allows users to rent cars using Stellar tokens, with built-in commission management for platform administrators.

## Overview

**Stellar Motors** is a car rental dApp that leverages the Stellar blockchain to facilitate peer-to-peer car rentals. The `rent-a-car` contract serves as the core smart contract that handles all rental operations, including:

- Car registration and management
- Rental transactions
- Payment processing with automatic commission distribution
- Rental lifecycle management
- Owner payouts

## Features

### For Car Owners

- **List Vehicles**: Register your car with a daily rental price
- **Receive Payments**: Automatically receive rental payments when your car is rented
- **Withdraw Earnings**: Withdraw your accumulated earnings (only when car is available)
- **Track Status**: Monitor your car's availability and rental status

### For Renters

- **Browse Available Cars**: View and rent cars listed on the platform
- **Secure Payments**: Pay for rentals using Stellar tokens
- **Manage Rentals**: Start and end rental periods
- **View Rental History**: Check your active and past rentals

### For Administrators

- **Commission Management**: Set and collect platform commission fees
- **Car Management**: Add and remove cars from the platform
- **System Control**: Manage contract initialization and configuration

## Contract Architecture

### Core Components

```
contracts/rent-a-car/
├── src/
│   ├── contract.rs          # Main contract implementation
│   ├── interface/           # Contract interface/trait definitions
│   ├── storage/             # Storage operations
│   │   ├── admin.rs        # Admin address storage
│   │   ├── car.rs          # Car data storage
│   │   ├── rental.rs       # Rental records storage
│   │   ├── token.rs        # Payment token storage
│   │   ├── commission.rs   # Commission management
│   │   └── structs/        # Data structures (Car, Rental)
│   └── methods/            # Business logic
│       ├── validation.rs   # Input validation
│       └── token.rs        # Token transfer operations
```

### Data Structures

#### Car

```rust
struct Car {
    price_per_day: i128,           // Daily rental price
    car_status: CarStatus,         // Available | Rented
    available_to_withdraw: i128,   // Owner's withdrawable balance
}
```

#### Rental

```rust
struct Rental {
    total_days_to_rent: u32,  // Number of rental days
    amount: i128,              // Payment amount (excluding commission)
    start_time: u64,           // Rental start timestamp
    end_time: u64,             // Expected end timestamp
}
```

## Contract Functions

### Initialization

#### `__constructor(admin: Address, token: Address)`

Initializes the contract with an admin address and payment token address.

#### `initialize(admin: Address, token: Address)`

Alternative initialization method (can only be called if contract is not yet initialized).

### Admin Functions

#### `get_admin() -> Address`

Returns the current admin address.

#### `add_car(owner: Address, price_per_day: i128)`

Admin-only function to register a new car.

- **Requires**: Admin authentication
- **Validates**: Price must be positive
- **Effect**: Creates a new car entry with status `Available`

#### `remove_car(owner: Address)`

Admin-only function to remove a car from the platform.

- **Requires**: Admin authentication
- **Restriction**: Cannot remove cars that are currently rented
- **Effect**: Deletes car data from storage

#### `set_commission(commission: i128)`

Sets the platform commission fee (applied per rental).

- **Requires**: Admin authentication
- **Validates**: Commission must be non-negative

#### `withdraw_admin_commissions()`

Withdraws all accumulated commission fees.

- **Requires**: Admin authentication
- **Effect**: Transfers all commission balance to admin address

#### `get_admin_commission_balance() -> i128`

Returns the current accumulated commission balance.

### Owner Functions

#### `payout_owner(owner: Address, amount: i128)`

Allows car owners to withdraw their earnings.

- **Requires**: Owner authentication + contract authorization
- **Restriction**: Car must be in `Available` status (not currently rented)
- **Validates**: Amount cannot exceed available balance
- **Effect**: Transfers tokens from contract to owner

#### `get_available_to_withdraw(owner: Address) -> i128`

Returns the withdrawable balance for a car owner.

### Rental Functions

#### `rental(renter: Address, owner: Address, total_days_to_rent: u32, amount: i128)`

Creates a new rental transaction.

- **Requires**: Renter authentication
- **Validates**:
  - Car must exist and be available
  - Rental days must be positive
  - Payment amount must match: `price_per_day * total_days_to_rent`
  - Renter cannot rent their own car
  - No existing active rental for this renter-owner pair
- **Effect**:
  - Transfers `amount + commission` from renter to contract
  - Updates car status to `Rented`
  - Creates rental record
  - Adds amount to owner's available balance
  - Adds commission to admin commission balance

#### `end_rental(renter: Address, owner: Address)`

Ends an active rental and marks the car as available.

- **Requires**: Renter authentication
- **Validates**: Rental must exist and car must be in `Rented` status
- **Effect**:
  - Updates car status to `Available`
  - Removes rental record

### Query Functions

#### `get_car(owner: Address) -> Car`

Returns complete car information for a given owner.

#### `has_car(owner: Address) -> bool`

Checks if a car exists for the given owner address.

#### `get_car_status(owner: Address) -> CarStatus`

Returns the current status of a car (`Available` or `Rented`).

#### `get_rental(renter: Address, owner: Address) -> Rental`

Returns rental details for a specific renter-owner pair.

#### `has_rental(renter: Address, owner: Address) -> bool`

Checks if an active rental exists for a renter-owner pair.

#### `get_commission() -> i128`

Returns the current commission fee amount.

## Payment Flow

### Rental Payment Process

1. **Renter calls `rental()`** with:
   - Owner address (car identifier)
   - Number of rental days
   - Payment amount (must equal `price_per_day × days`)

2. **Contract validates**:
   - Car exists and is available
   - Payment amount is correct
   - No duplicate rental

3. **Payment processing**:
   - Total charge = `payment_amount + commission`
   - Contract receives total charge from renter
   - Owner's available balance increases by `payment_amount`
   - Admin commission balance increases by `commission`

4. **State updates**:
   - Car status → `Rented`
   - Rental record created with timestamps

### Owner Withdrawal Process

1. **Owner calls `payout_owner()`** with:
   - Their address
   - Withdrawal amount

2. **Contract validates**:
   - Car is in `Available` status
   - Amount doesn't exceed available balance

3. **Transfer**:
   - Tokens transferred from contract to owner
   - Available balance decreased

## Security Features

- **Authentication**: All state-changing operations require proper authentication
- **Authorization**: Role-based access (admin, owner, renter)
- **Validation**: Comprehensive input validation for all parameters
- **Overflow Protection**: All arithmetic operations use checked math
- **State Checks**: Critical operations verify contract state before execution
- **Self-Rental Prevention**: Renters cannot rent their own cars
- **Status Validation**: Owners can only withdraw when car is available

## Usage Examples

### Admin Setup

```rust
// Initialize contract
contract.initialize(admin_address, token_address);

// Set commission (e.g., 1000 stroops per rental)
contract.set_commission(1000);

// Add a car with daily price of 50000 stroops (5 XLM)
contract.add_car(car_owner_address, 50000);
```

### Renting a Car

```rust
// Rent a car for 3 days
// Payment: 3 days × 50000 = 150000 stroops
// Total charge: 150000 + 1000 (commission) = 151000
contract.rental(
    renter_address,
    car_owner_address,
    3,           // days
    150000       // payment amount
);
```

### Ending a Rental

```rust
// Return the car
contract.end_rental(renter_address, car_owner_address);
```

### Owner Withdrawal

```rust
// Check available balance
let balance = contract.get_available_to_withdraw(car_owner_address);

// Withdraw earnings
contract.payout_owner(car_owner_address, balance);
```

## Building and Testing

### Prerequisites

- Rust toolchain (see [Soroban setup guide](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup))
- Stellar CLI
- Soroban SDK

### Build

```bash
# From project root
cd contracts/rent-a-car
cargo build --target wasm32v1-none --release
```

### Run Tests

```bash
cargo test
```

## Integration

This contract is part of the **Stellar Motors** dApp. It integrates with:

- Frontend React application (auto-generated TypeScript clients)
- Stellar wallet integration
- Local/testnet deployment via Scaffold Stellar

For full project setup and development, see the main [README.md](../README.md) in the project root.

## Development Status

This contract is actively maintained and includes:

- ✅ Core rental functionality
- ✅ Commission management
- ✅ Security validations
- ✅ Comprehensive error handling
- ✅ Query functions for frontend integration

## License

See the main project [LICENSE](../LICENSE) file.
