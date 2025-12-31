const { ethers } = require("hardhat");

async function main() {
  const [deployer, burner] = await ethers.getSigners();

  const Token = await ethers.getContractFactory("TestToken");
  const token = await Token.deploy();

  const StakeManager = await ethers.getContractFactory("StakeManager");
  const stakeManager = await StakeManager.deploy(
    await token.getAddress(),
    burner.address
  );

  console.log("Token:", await token.getAddress());
  console.log("StakeManager:", await stakeManager.getAddress());
}

main();
