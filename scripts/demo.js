const { ethers } = require("hardhat");

async function main() {
  console.log("=== DEMO: Staking & Burning with Event Indexing ===\n");

  // Deploy contracts first
  console.log("Deploying contracts...");
  const [deployer, burner, alice] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("TestToken");
  const token = await Token.deploy();
  await token.waitForDeployment();

  const StakeManager = await ethers.getContractFactory("StakeManager");
  const stakeManager = await StakeManager.deploy(
    await token.getAddress(),
    burner.address
  );
  await stakeManager.waitForDeployment();

  const tokenAddress = await token.getAddress();
  const stakeManagerAddress = await stakeManager.getAddress();

  console.log("Token:", tokenAddress);
  console.log("StakeManager:", stakeManagerAddress);
  console.log("\nNOTE: Update backend/index.js line 6 with StakeManager address above!\n");

  console.log("Accounts:");
  console.log("- Alice:", alice.address);
  console.log("- Burner:", burner.address, "\n");

  console.log("Step 1: Giving Alice 100 tokens...");
  await token.transfer(alice.address, ethers.parseEther("100"));
  console.log("Done!\n");

  console.log("Step 2: Alice approves and stakes 100 tokens...");
  await token.connect(alice).approve(stakeManagerAddress, ethers.parseEther("100"));
  await stakeManager.connect(alice).stake(ethers.parseEther("100"));
  console.log("Staked successfully!\n");

  console.log(">>> WATCH THE BACKEND TERMINAL NOW! <<<\n");
  await new Promise(r => setTimeout(r, 2000));

  console.log("Step 3: Burner burns 50 of Alice's tokens...");
  const tx = await stakeManager.connect(burner).burnFromStake(alice.address, ethers.parseEther("50"));
  await tx.wait();
  console.log("BURNED! (Check backend terminal for event)\n");

  const remaining = await stakeManager.staked(alice.address);
  console.log("Final State:");
  console.log("- Alice's remaining stake:", ethers.formatEther(remaining), "tokens");
  console.log("\nNow check API: curl http://localhost:3000/is-flagged/" + alice.address);
  console.log("Expected result: {\"flagged\": true}\n");
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});