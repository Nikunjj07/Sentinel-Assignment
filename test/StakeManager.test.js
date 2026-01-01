const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StakeManager", function () {
  let token, stakeManager;
  let owner, burner, user;

  beforeEach(async () => {
    [owner, burner, user] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("TestToken");
    token = await Token.deploy();

    const StakeManager = await ethers.getContractFactory("StakeManager");
    stakeManager = await StakeManager.deploy(
      await token.getAddress(),
      burner.address
    );

    await token.transfer(user.address, ethers.parseEther("100"));
  });

  afterEach(async () => {
    if (stakeManager) {
      await stakeManager.removeAllListeners();
    }
    if (token) {
      await token.removeAllListeners();
    }
  });

  after(async () => {
    if (process.platform === "win32") {
      setTimeout(() => {
        process.exit(0);
      }, 100);
    }
  });

  it("allows user to stake", async () => {
    await token.connect(user).approve(
      await stakeManager.getAddress(),
      ethers.parseEther("50")
    );

    await stakeManager.connect(user).stake(ethers.parseEther("50"));
    expect(await stakeManager.staked(user.address))
      .to.equal(ethers.parseEther("50"));
  });

  it("prevents unauthorized burn", async () => {
    await expect(
      stakeManager.burnFromStake(user.address, 1)
    ).to.be.revertedWith("not authorized");
  });

  it("burns stake and emits event", async () => {
    await token.connect(user).approve(
      await stakeManager.getAddress(),
      ethers.parseEther("10")
    );
    await stakeManager.connect(user).stake(ethers.parseEther("10"));

    await expect(
      stakeManager.connect(burner).burnFromStake(
        user.address,
        ethers.parseEther("5")
      )
    )
      .to.emit(stakeManager, "AddressTagged")
      .withArgs(user.address, "stake-burn");
  });
});
