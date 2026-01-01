const { ethers } = require("ethers");
const express = require("express");
const abi = require("./abi.json");

const RPC_URL = "http://127.0.0.1:8545";
const CONTRACT_ADDRESS = "0x610178dA211FEF7D417bC0e6FeD39F05609AD788";

// Validate contract address
if (!ethers.isAddress(CONTRACT_ADDRESS)) {
  console.error("ERROR: Invalid contract address! Please update CONTRACT_ADDRESS in index.js");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, provider);

const flagged = new Set();
let lastBlock = 0;
let isInitialized = false;

// Scan for historical events on startup
async function scanHistoricalEvents() {
  try {
    const currentBlock = await provider.getBlockNumber();
    console.log("Scanning for historical events from block 0 to", currentBlock);

    const filter = contract.filters.AddressTagged();
    const events = await contract.queryFilter(filter, 0, currentBlock);

    console.log(`Found ${events.length} historical event(s)`);
    events.forEach(event => {
      const addr = event.args.addr;
      const source = event.args.source;
      console.log("  Tagged:", addr, source, "(Block:", event.blockNumber + ")");
      flagged.add(addr.toLowerCase());
    });

    lastBlock = currentBlock;
    isInitialized = true;
    console.log("Historical scan complete. Now monitoring for new events...\n");
  } catch (error) {
    console.error("Error scanning historical events:", error.message);
  }
}

// Poll for NEW events every 2 seconds
async function pollEvents() {
  if (!isInitialized) return;

  try {
    const currentBlock = await provider.getBlockNumber();

    if (currentBlock > lastBlock) {
      const filter = contract.filters.AddressTagged();
      const events = await contract.queryFilter(filter, lastBlock + 1, currentBlock);

      if (events.length > 0) {
        events.forEach(event => {
          const addr = event.args.addr;
          const source = event.args.source;
          console.log("New event - Tagged:", addr, source, "(Block:", event.blockNumber + ")");
          flagged.add(addr.toLowerCase());
        });
      }

      lastBlock = currentBlock;
    }
  } catch (error) {
    if (!error.message?.includes("results is not iterable")) {
      console.error("Polling error:", error.message);
    }
  }
}

setInterval(pollEvents, 2000);

const app = express();

app.get("/is-flagged/:address", (req, res) => {
  const addr = req.params.address.toLowerCase();
  res.json({ flagged: flagged.has(addr) });
});

app.listen(3000, async () => {
  console.log("Indexer running at http://localhost:3000");
  console.log("Monitoring contract:", CONTRACT_ADDRESS);
  console.log();

  // Scan for historical events first
  await scanHistoricalEvents();
});
