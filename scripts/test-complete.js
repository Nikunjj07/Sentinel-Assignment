const { ethers } = require("hardhat");

async function main() {
    console.log("=== COMPLETE END-TO-END TEST ===\n");

    // 1. Deploy contracts
    console.log("Step 1: Deploying contracts...");
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
    console.log("✓ StakeManager:", stakeManagerAddress);

    // 2. Stake
    console.log("\nStep 2: Alice stakes tokens...");
    await token.transfer(alice.address, ethers.parseEther("100"));
    await token.connect(alice).approve(stakeManagerAddress, ethers.parseEther("100"));
    await stakeManager.connect(alice).stake(ethers.parseEther("100"));
    console.log("✓ Staked 100 tokens");

    // 3. Burn
    console.log("\nStep 3: Burner burns 50 tokens...");
    const tx = await stakeManager.connect(burner).burnFromStake(alice.address, ethers.parseEther("50"));
    await tx.wait();
    console.log("✓ Burned 50 tokens");

    // 4. Query event manually
    console.log("\nStep 4: Querying AddressTagged events...");
    const filter = stakeManager.filters.AddressTagged();
    const events = await stakeManager.queryFilter(filter);

    if (events.length > 0) {
        console.log(`✓ Found ${events.length} event(s)`);
        events.forEach(event => {
            console.log(`  - Address: ${event.args.addr}`);
            console.log(`  - Source: ${event.args.source}`);
            console.log(`  - Block: ${event.blockNumber}`);
        });
    } else {
        console.log("✗ No events found!");
    }

    // 5. Simulate backend check
    console.log("\nStep 5: Simulating backend check...");
    const flaggedSet = new Set();
    events.forEach(event => {
        flaggedSet.add(event.args.addr.toLowerCase());
    });

    const isAliceFlagged = flaggedSet.has(alice.address.toLowerCase());
    console.log(`  Alice (${alice.address}): flagged = ${isAliceFlagged}`);

    if (isAliceFlagged) {
        console.log("\n✅ SUCCESS! The system works!");
        console.log("\n=== To make backend work: ===");
        console.log("1. Update backend/index.js line 6:");
        console.log(`   const CONTRACT_ADDRESS = "${stakeManagerAddress}";`);
        console.log("\n2. Restart backend:");
        console.log("   cd backend");
        console.log("   npm run dev");
        console.log("\n3. Wait 5 seconds, then query:");
        console.log(`   curl http://localhost:3000/is-flagged/${alice.address}`);
    } else {
        console.log("\n✗ FAILED! Events not working");
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
