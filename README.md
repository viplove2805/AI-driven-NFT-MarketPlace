# 🚀 AstraNode Art: AI-Powered ERC1155 NFT Marketplace

AstraNode Art is a high-performance, decentralized NFT marketplace that combines cutting-edge AI art generation with EVM-compatible ERC1155 smart contracts. The platform features an intelligent AI agent for art creation, a signature-based minting flow, and built-in profit mechanisms for the platform owner.

---

## 🏗️ Architecture Overview

- **Frontend**: Next.js 15 (Turbopack), Tailwind CSS, Lucide Icons, Shadcn/UI.
- **Smart Contracts**: Solidity ^0.8.20 (ERC1155, Burnable, Ownable).
- **Backend**: Node.js, Express, SQLite3 (Marketplace Indexer).
- **Blockchain Interaction**: Ethers.js v6.
- **AI Integration**: Custom Astra-Neural-v1 Agent for prompt enhancement and metadata extraction.
- **Containerization**: Docker & Docker Compose.

---

## 💰 Profit Mechanisms

The platform is designed with built-in revenue streams:

- **Minting Service Fee**: Users pay a flat fee (e.g., 0.01 TVX) to the treasury for each AI-generated asset they sign for minting.
- **Marketplace Commission**: The platform automatically takes a 2.5% commission on every secondary sale in the marketplace.
- **Treasury Management**: All fees are directed to a secure, configurable treasury wallet.

---

## 🛠️ Deployment (Docker)

The easiest way to run the entire stack is using Docker Compose.

### 1. Prerequisites

- **Docker** and **Docker Compose** installed.
- **MetaMask** browser extension.

### 2. Quick Start

Run the deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

This will:

1. Build the Frontend and Backend images.
2. Start the containers in detached mode.
3. Expose the **Frontend** at `http://localhost:3000`.
4. Expose the **Backend API** at `http://localhost:3001`.

---

## 🎨 Key Features

- **AI Creation Lab**: Generate unique art using natural language. The AI agent extracts metadata (name, price) and enhances your prompt automatically.
- **Signature-Only Minting**: Users sign their minting intent, allowing the platform owner to batch-process on-chain minting while collecting service fees.
- **ERC1155 Support**: Optimized for multi-token standards, reducing gas costs and improving flexibility.
- **Intelligent Marketplace**: Real-time indexing of listings with cryptographic signature verification for all updates.
- **Profit-Active**: Built-in logic for service fees and marketplace commissions.

---

## 📁 Project Structure

```text
astranode-art/
├── backend/                # Express server & SQLite DB
│   ├── index.js            # Main API logic & Profit tracking
│   └── verify.js           # EVM Signature verification
├── contracts/
│   └── evm/
│       └── contracts/      # ERC1155 Smart Contracts
├── frontend/               # Next.js 15 Application
│   ├── src/
│   │   ├── components/     # UI Components (Lab, Marketplace, etc.)
│   │   ├── hooks/          # useEVM wallet hook
│   │   └── constants/      # Contract ABIs & Config
├── docker-compose.yml      # Orchestration
└── deploy.sh               # Automation script
```

---

## 🤝 Configuration

Update `frontend/src/constants/config.ts` to change:

- `TREASURY_ADDRESS`: The wallet receiving fees.
- `MINTING_FEE`: Cost to mint an NFT.
- `MARKETPLACE_COMMISSION_PERCENT`: Platform cut on sales.

---

## 🛡️ Security

- **Cryptographic Signatures**: Every marketplace update (sync, price change, delist) requires a valid EIP-191 signature from the asset owner.
- **Owner-Only Minting**: The smart contract restricts minting to the owner, ensuring a curated and secure ecosystem.
