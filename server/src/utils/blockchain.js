// server/src/utils/blockchain.js
import dotenv from "dotenv";
dotenv.config(); // Make sure to load env variables first
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "../../config/blockchain.js";

// Connect to Hardhat local node
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Make sure PRIVATE_KEY is defined
if (!process.env.PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY not found in .env file");
}

// Create wallet using the private key and provider
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Connect wallet to contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

export default contract;