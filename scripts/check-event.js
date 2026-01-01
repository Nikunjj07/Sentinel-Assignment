const { ethers } = require("hardhat");

async function main() {
    console.log("=== Event Query Test ===\n");

    // Deploy new contracts
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

    const stakeManagerAddress = await stakeManager.getAddress();
    console.log("StakeManager deployed at:", stakeManagerAddress);
    console.log("\n>>> UPDATE backend/index.js line 6 with this address <<<\n");

    // Do stake and burn
    await token.transfer(alice.address, ethers.parseEther("100"));
    await token.connect(alice).approve(stakeManagerAddress, ethers.parseEther("100"));
    await stakeManager.connect(alice).stake(ethers.parseEther("100"));
    console.log("Alice staked 100 tokens");

    const tx = await stakeManager.connect(burner).burnFromStake(alice.address, ethers.parseEther("50"));
    const receipt = await tx.wait();
    console.log("\nBurn transaction mined in block:", receipt.blockNumber);

    // Query events manually
    console.log("\nQuerying AddressTagged events...");
    const filter = stakeManager.filters.AddressTagged();
    const events = await stakeManager.queryFilter(filter);

    console.log(`Found ${events.length} event(s):`);
    events.forEach((event, i) => {
        console.log(`Event ${i + 1}:`);
        console.log("  Address:", event.args.addr);
        console.log("  Source:", event.args.source);
        console.log("  Block:", event.blockNumber);
    });

    console.log("\n=== Test Complete ===");
    console.log("Next steps:");
    console.log("1. Copy StakeManager address above");
    console.log("2. Update backend/index.js line 6");
    console.log("3. Restart backend: npm run dev");
    console.log("4. Run demo: npx hardhat run scripts/demo.js --network localhost");
    console.log("5. Watch for 'Tagged:' message in backend terminal");
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
