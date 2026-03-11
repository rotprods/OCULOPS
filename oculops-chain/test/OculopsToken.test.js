const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OculopsToken", function () {
  let token, owner, user1, user2;
  const TOTAL_SUPPLY = ethers.parseEther("100000000"); // 100M

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const OculopsToken = await ethers.getContractFactory("OculopsToken");
    token = await OculopsToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should mint total supply to initial recipient", async function () {
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    });

    it("should set correct name and symbol", async function () {
      expect(await token.name()).to.equal("Oculops Credit");
      expect(await token.symbol()).to.equal("OCUL");
    });

    it("should grant admin and pauser roles", async function () {
      const ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
      const PAUSER_ROLE = await token.PAUSER_ROLE();
      expect(await token.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
      expect(await token.hasRole(PAUSER_ROLE, owner.address)).to.be.true;
    });

    it("should revert with zero recipient", async function () {
      const OculopsToken = await ethers.getContractFactory("OculopsToken");
      await expect(
        OculopsToken.deploy(ethers.ZeroAddress, owner.address)
      ).to.be.revertedWith("OculopsToken: zero recipient");
    });

    it("should revert with zero admin", async function () {
      const OculopsToken = await ethers.getContractFactory("OculopsToken");
      await expect(
        OculopsToken.deploy(owner.address, ethers.ZeroAddress)
      ).to.be.revertedWith("OculopsToken: zero admin");
    });
  });

  describe("Transfers", function () {
    it("should transfer tokens between accounts", async function () {
      const amount = ethers.parseEther("1000");
      await token.transfer(user1.address, amount);
      expect(await token.balanceOf(user1.address)).to.equal(amount);
    });
  });

  describe("Burn", function () {
    it("should allow holders to burn their tokens", async function () {
      const burnAmount = ethers.parseEther("1000");
      await token.burn(burnAmount);
      expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY - burnAmount);
    });
  });

  describe("Pause", function () {
    it("should pause and unpause transfers", async function () {
      await token.pause();
      await expect(
        token.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.reverted;

      await token.unpause();
      await token.transfer(user1.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user1.address)).to.equal(
        ethers.parseEther("100")
      );
    });

    it("should only allow PAUSER_ROLE to pause", async function () {
      await expect(token.connect(user1).pause()).to.be.reverted;
    });
  });
});
