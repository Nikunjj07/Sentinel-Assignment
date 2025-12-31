# Staking System with Event Indexing (Hardhat + Node.js)

This project is a minimal end-to-end staking system built with Solidity and Hardhat.
It includes a burnable ERC-20 token, a staking contract with controlled burn logic, and a lightweight Node.js backend that indexes on-chain events and exposes a simple API.

The goal of the project is to demonstrate:

* Basic staking mechanics
* Restricted / role-based actions on-chain
* Emitting and indexing blockchain events
* Querying indexed data off-chain

---

## What’s Included

* **ERC-20 Token (`TestToken.sol`)**
  A simple burnable token with an initial supply of 1,000,000 tokens.

* **Stake Manager (`StakeManager.sol`)**
  Allows anyone to stake tokens, while a designated burner address can burn a portion of a user’s staked balance.

* **Event Indexing Backend**
  A Node.js + Express service that listens for on-chain `AddressTagged` events and lets you query whether an address has been flagged.

---

## How Staking Works

### Prerequisites

* A local Hardhat node running at `http://127.0.0.1:8545`
* Contracts deployed to the local network

### Staking Flow

Staking follows the standard ERC-20 pattern:

1. The user approves the `StakeManager` to spend their tokens
2. The user calls `stake(amount)`
3. The tokens are transferred to the `StakeManager`, and the staked balance is recorded

### Example (Hardhat Console)

```bash
npx hardhat console --network localhost
```

```js
const [owner, user] = await ethers.getSigners();

const token = await ethers.getContractAt("TestToken", "TOKEN_ADDRESS");
const stakeManager = await ethers.getContractAt("StakeManager", "STAKE_MANAGER_ADDRESS");

// Approve tokens
await token.connect(user).approve(
  stakeManager.address,
  ethers.parseEther("100")
);

// Stake tokens
await stakeManager.connect(user).stake(ethers.parseEther("100"));

// Check staked balance
await stakeManager.staked(user.address);
```

---

## How the Burn Logic Works

Only a **designated burner address** (set during deployment) is allowed to burn staked tokens.

When the burner calls `burnFromStake(user, amount)`:

* The user’s staked balance is reduced
* Tokens are burned using `ERC20Burnable`
* An `AddressTagged` event is emitted

### Example (Hardhat Console)

```js
const [owner, burner, user] = await ethers.getSigners();

const stakeManager = await ethers.getContractAt(
  "StakeManager",
  "STAKE_MANAGER_ADDRESS"
);

await stakeManager.connect(burner).burnFromStake(
  user.address,
  ethers.parseEther("25")
);
```

**Important notes:**

* Only the burner can call this function
* The user must have enough staked tokens
* The function emits:

  ```solidity
  AddressTagged(address addr, string source)
  ```

  with `source = "stake-burn"`

---

## How the Indexing Backend Works

This project uses **Option B (Custom Backend Indexer)** from the problem statement.

Instead of The Graph, a small Node.js service listens for events and keeps track of flagged addresses.

### High-Level Flow

```
StakeManager contract
      │
      │ emits AddressTagged
      ▼
ethers.js event listener
      │
      │ stores address
      ▼
in-memory Set
      │
      ▼
Express REST API
```

### Key Pieces

#### Event Listener

The backend connects to the local Hardhat network and subscribes to the `AddressTagged` event:

```js
contract.on("AddressTagged", (addr, source) => {
  flagged.add(addr.toLowerCase());
});
```

Whenever a burn happens, the affected address is automatically flagged.

#### Storage

* Flagged addresses are stored in a JavaScript `Set`
* Lookups are O(1)
* Data is **not persisted** (reset on restart)

This keeps the solution simple and easy to review.

#### API

An Express server exposes a single endpoint to check if an address is flagged.

---

## Checking if an Address Is Flagged

### Endpoint

```
GET /is-flagged/:address
```

### Example Request

```bash
curl http://localhost:3000/is-flagged/0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

### Example Responses

**Before any burn:**

```json
{ "flagged": false }
```

**After a burn event:**

```json
{ "flagged": true }
```

---

## Quick Start

1. **Install dependencies**

```bash
npm install
cd backend
npm install
cd ..
```

2. **Start Hardhat node**

```bash
npx hardhat node
```

3. **Deploy contracts**

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Copy the deployed `StakeManager` address.

4. **Configure backend**
   Update `backend/index.js`:

```js
const CONTRACT_ADDRESS = "0x...";
```

5. **Start backend**

```bash
cd backend
node index.js
```

6. **Run tests**

```bash
npx hardhat test
```

All tests should pass.

---

## Tests

The test suite covers:

* Successful staking
* Rejection of unauthorized burns
* Burning staked tokens and emitting `AddressTagged`

All tests pass using Hardhat’s local network.

---

## Design Decisions

### Why an In-Memory Indexer?

* Keeps the solution minimal and easy to reason about
* No database setup required
* Sufficient for demonstrating event indexing logic

For a production system, this could be extended with:

* SQLite / PostgreSQL
* MongoDB
* The Graph subgraph

### Why a Single Burner Address?

* Simple and explicit access control
* Set once at deployment
* Easy to extend later using role-based access control

---
