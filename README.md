# Stellar Motors 🚗

A decentralized car rental platform built on Stellar's Soroban smart contract platform. Stellar Motors enables peer-to-peer car rentals with secure payments, automatic commission management, and transparent rental tracking.

## Features

- 🚗 **Decentralized Car Rentals**: Peer-to-peer car rental without intermediaries
- 💰 **Secure Payments**: Stellar token-based payment system with escrow
- 📊 **Commission System**: Automated platform commission collection
- 🔒 **Smart Contract Security**: Built on Soroban with comprehensive validation
- 📱 **Modern Frontend**: React + TypeScript with auto-generated contract clients

## Tech Stack

- **Smart Contracts**: Rust + Soroban SDK
- **Frontend**: React + TypeScript + Vite
- **Blockchain**: Stellar/Soroban
- **Tooling**: Scaffold Stellar (hot reload, auto-generated clients)

## Quick Start

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) with `wasm32v1-none` target
- [Node.js](https://nodejs.org/) (v22 or higher) and npm
- [Stellar CLI](https://github.com/stellar/stellar-core)
- [Scaffold Stellar CLI Plugin](https://github.com/AhaLabs/scaffold-stellar)

See the [Soroban setup guide](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup) for detailed installation instructions.

### Setup

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure environment** (if needed):
   - Copy `.env.example` to `.env` and configure settings
   - Review `environments.toml` for environment-specific configurations

3. **Start development server**:

   ```bash
   npm run dev
   ```

   This will:
   - Watch for contract changes and rebuild automatically
   - Generate TypeScript clients for contracts
   - Start the Vite dev server at `http://localhost:5173`
   - Start a local Stellar network (if not already running)

4. **Open in browser**: Navigate to `http://localhost:5173`

## Project Structure

```
dApp-StellarMotors/
├── contracts/
│   └── rent-a-car/              # Car rental smart contract
│       ├── src/
│       │   ├── contract.rs      # Main implementation
│       │   ├── interface/       # Contract interfaces
│       │   ├── storage/         # Storage operations
│       │   ├── methods/         # Business logic
│       │   └── tests/           # Unit tests
│       └── README.md            # Contract documentation
├── packages/                       # Auto-generated TypeScript clients
├── src/                            # Frontend React application
│   ├── components/               # React components
│   ├── contracts/                # Contract interaction helpers
│   ├── hooks/                    # Custom React hooks
│   ├── pages/                    # App pages
│   └── ...
├── environments.toml              # Environment configurations
└── package.json                   # Dependencies and scripts
```

## Smart Contracts

### Rent-A-Car Contract

The core rental smart contract handling car listings, rentals, payments, and commission management.

**[📖 Full Documentation](contracts/rent-a-car/README.md)** - Complete API reference, usage examples, and architecture details.

**Key Functions**:

- `add_car()` - Register a car for rental
- `rental()` - Rent a car and process payment
- `end_rental()` - Return a car and mark as available
- `payout_owner()` - Withdraw earnings (car owners)
- `set_commission()` / `withdraw_admin_commissions()` - Commission management

## Deployment

### Local Development

The development environment runs a local Stellar network automatically. No additional setup required.

### Testnet/Mainnet

Deploy contracts using `stellar registry`:

```bash
# Publish contract to registry
stellar registry publish

# Deploy with constructor parameters
stellar registry deploy \
  --deployed-name rent-a-car \
  --published-name rent-a-car \
  -- \
  --admin <admin-address> \
  --token <token-address>

# Create local alias for easier access
stellar registry create-alias rent-a-car
```

For detailed deployment instructions, see the [Stellar documentation](https://developers.stellar.org/docs/build/smart-contracts/advanced-topics/contract-deployment).

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build frontend for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Documentation

- **[Rent-A-Car Contract](contracts/rent-a-car/README.md)** - Complete contract documentation
- [Soroban Documentation](https://developers.stellar.org/docs/build/smart-contracts)
- [Scaffold Stellar](https://github.com/AhaLabs/scaffold-stellar) - Framework documentation

## License

See [LICENSE](LICENSE) file.
