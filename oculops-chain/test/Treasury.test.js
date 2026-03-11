const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Treasury", function () {
  let token, treasury, owner, distributor, user1;
  const TOTAL_SUPPLY = ethers.parseEther("100000000");
  const MAX_PER_OP = ethers.parseEther("1000000");   // 1M
  const DAILY_LIMIT = ethers.parseEther("5000000");   // 5M

  beforeEach(async function () {
    [owner, distributor, user1] = await ethers.getSigners();

    // Deploy token
    const OculopsToken = await ethers.getContractFactory("OculopsToken");
    token = await OculopsToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    // Deploy treasury
    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(
      await token.getAddress(),
      owner.address,
      MAX_PER_OP,
      DAILY_LIMIT
    );
    await treasury.waitForDeployment();

    // Fund treasury
    await token.transfer(await treasury.getAddress(), ethers.parseEther("40000000"));

    // Grant distributor role
    const DISTRIBUTOR_ROLE = await treasury.DISTRIBUTOR_ROLE();
    await treasury.grantRole(DISTRIBUTOR_ROLE, distributor.address);
  });

  describe("Deployment", function () {
    it("should hold correct balance", async function () {
      expect(await treasury.balance()).to.equal(ethers.parseEther("40000000"));
    });
  });

  describe("Release", function () {
    it("should release tokens to recipient", async function () {
      const amount = ethers.parseEther("1000");
      await treasury.connect(distributor).release(user1.address, amount, "test");
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });

    it("should emit TokensReleased event", async function () {
      const amount = ethers.parseEther("1000");
      await expect(
        treasury.connect(distributor).release(user1.address, amount, "test")
      )
        .to.emit(treasury, "TokensReleased")
        .withArgs(user1.address, amount, "test");
    });

    it("should reject amount exceeding max per operation", async function () {
      const tooMuch = MAX_PER_OP + 1n;
      await expect(
        treasury.connect(distributor).release(user1.address, tooMuch, "test")
      ).to.be.revertedWith("Treasury: exceeds max per operation");
    });

    it("should reject unauthorized callers", async function () {
      await expect(
        treasury.connect(user1).release(user1.address, ethers.parseEther("100"), "test")
      ).to.be.reverted;
    });

    it("should reject zero recipient", async function () {
      await expect(
        treasury.connect(distributor).release(ethers.ZeroAddress, ethers.parseEther("100"), "test")
      ).to.be.revertedWith("Treasury: zero recipient");
    });

    it("should reject zero amount", async function () {
      await expect(
        treasury.connect(distributor).release(user1.address, 0, "test")
      ).to.be.revertedWith("Treasury: zero amount");
    });
  });

  describe("Rate limiting", function () {
    it("should enforce rate limit of 10 ops per hour", async function () {
      const amount = ethers.parseEther("100");
      // 10 releases should succeed
      for (let i = 0; i < 10; i++) {
        await treasury.connect(distributor).release(user1.address, amount, `op-${i}`);
      }
      // 11th should fail
      await expect(
        treasury.connect(distributor).release(user1.address, amount, "op-10")
      ).to.be.revertedWith("Treasury: rate limit exceeded");
    });
  });

  describe("Pause", function () {
    it("should block releases when paused", async function () {
      await treasury.pause();
      await expect(
        treasury.connect(distributor).release(user1.address, ethers.parseEther("100"), "test")
      ).to.be.reverted;
    });

    it("should allow emergency withdraw when paused", async function () {
      await treasury.pause();
      const amount = ethers.parseEther("1000");
      await treasury.emergencyWithdraw(owner.address, amount);
      expect(await token.balanceOf(owner.address)).to.be.gte(amount);
    });

    it("should reject emergency withdraw when not paused", async function () {
      await expect(
        treasury.emergencyWithdraw(owner.address, ethers.parseEther("1000"))
      ).to.be.revertedWith("Treasury: must be paused");
    });
  });
});
