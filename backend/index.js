const { ethers } = require("ethers");
const express = require("express");
const abi = require("./abi.json");

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Validate contract address
if (!ethers.isAddress(CONTRACT_ADDRESS)) {
  console.error("ERROR: Invalid contract address! Please update CONTRACT_ADDRESS in index.js");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

const flagged = new Set();

contract.on("AddressTagged", (addr, source) => {
  console.log("Tagged:", addr, source);
  flagged.add(addr.toLowerCase());
});

const app = express();

app.get("/is-flagged/:address", (req, res) => {
  const addr = req.params.address.toLowerCase();
  res.json({ flagged: flagged.has(addr) });
});

app.listen(3000, () => {
  console.log("Indexer running at http://localhost:3000");
});
