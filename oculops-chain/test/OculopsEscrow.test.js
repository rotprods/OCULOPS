const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("OculopsEscrow", function () {
  let token, escrow, admin, client, provider, treasury;
  const TOTAL_SUPPLY = ethers.parseEther("100000000");
  const ESCROW_AMOUNT = ethers.parseEther("10000");

  beforeEach(async function () {
    [admin, client, provider, treasury] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("OculopsToken");
    token = await Token.deploy(admin.address, admin.address);

    const Escrow = await ethers.getContractFactory("OculopsEscrow");
    escrow = await Escrow.deploy(
      await token.getAddress(),
      treasury.address,
      admin.address
    );

    // Give client some tokens
    await token.transfer(client.address, ESCROW_AMOUNT * 2n);
    // Client approves escrow contract
    await token.connect(client).approve(await escrow.getAddress(), ESCROW_AMOUNT * 2n);
  });

  describe("Create Escrow", function () {
    it("should create escrow and deduct creation fee", async function () {
      const deadline = (await time.latest()) + 86400 * 30; // 30 days
      const tx = await escrow.connect(client).createEscrow(
        provider.address, ESCROW_AMOUNT, 4, deadline
      );

      const fee = ESCROW_AMOUNT * 100n / 10000n; // 1%
      const net = ESCROW_AMOUNT - fee;

      const e = await escrow.getEscrow(0);
      expect(e.client).to.equal(client.address);
      expect(e.provider).to.equal(provider.address);
      expect(e.totalAmount).to.equal(net);
      expect(e.milestoneCount).to.equal(4);
      expect(e.status).to.equal(0); // Active

      // Fee went to treasury
      expect(await token.balanceOf(treasury.address)).to.equal(fee);
    });

    it("should emit EscrowCreated event", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, deadline)
      ).to.emit(escrow, "EscrowCreated");
    });

    it("should reject zero provider", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createEscrow(ethers.ZeroAddress, ESCROW_AMOUNT, 2, deadline)
      ).to.be.revertedWith("Zero provider");
    });

    it("should reject self-escrow", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createEscrow(client.address, ESCROW_AMOUNT, 2, deadline)
      ).to.be.revertedWith("Self-escrow");
    });

    it("should reject past deadline", async function () {
      await expect(
        escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, 1)
      ).to.be.revertedWith("Past deadline");
    });

    it("should reject zero milestones", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 0, deadline)
      ).to.be.revertedWith("Bad milestones");
    });

    it("should reject >20 milestones", async function () {
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 21, deadline)
      ).to.be.revertedWith("Bad milestones");
    });
  });

  describe("Release Milestone", function () {
    let escrowId;
    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400 * 30;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 4, deadline);
      escrowId = 0;
    });

    it("should release milestone to provider with fee", async function () {
      const e = await escrow.getEscrow(escrowId);
      const milestoneAmt = e.totalAmount / 4n;
      const fee = milestoneAmt * 200n / 10000n; // 2%
      const providerAmt = milestoneAmt - fee;

      await escrow.releaseMilestone(escrowId);
      expect(await token.balanceOf(provider.address)).to.equal(providerAmt);
    });

    it("should emit MilestoneReleased event", async function () {
      await expect(escrow.releaseMilestone(escrowId))
        .to.emit(escrow, "MilestoneReleased");
    });

    it("should complete escrow after all milestones", async function () {
      for (let i = 0; i < 4; i++) {
        await escrow.releaseMilestone(escrowId);
      }
      const e = await escrow.getEscrow(escrowId);
      expect(e.status).to.equal(1); // Completed
      expect(e.milestonesReleased).to.equal(4);
    });

    it("should reject release after completion", async function () {
      for (let i = 0; i < 4; i++) {
        await escrow.releaseMilestone(escrowId);
      }
      await expect(escrow.releaseMilestone(escrowId))
        .to.be.revertedWith("Not active");
    });

    it("should reject non-admin release", async function () {
      await expect(
        escrow.connect(client).releaseMilestone(escrowId)
      ).to.be.reverted;
    });
  });

  describe("Refund", function () {
    let escrowId;
    beforeEach(async function () {
      const deadline = (await time.latest()) + 86400 * 30;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 4, deadline);
      escrowId = 0;
    });

    it("should refund remaining to client", async function () {
      // Release 1 milestone first
      await escrow.releaseMilestone(escrowId);
      const balBefore = await token.balanceOf(client.address);
      
      await escrow.refund(escrowId);
      
      const e = await escrow.getEscrow(escrowId);
      expect(e.status).to.equal(2); // Refunded

      const balAfter = await token.balanceOf(client.address);
      expect(balAfter).to.be.greaterThan(balBefore);
    });

    it("should refund full amount if no milestones released", async function () {
      const e = await escrow.getEscrow(escrowId);
      await escrow.refund(escrowId);
      
      // Client gets back the net amount (total minus creation fee, already taken)
      const balAfter = await token.balanceOf(client.address);
      // Client started with 2x escrow, paid 1x, gets net back
      expect(balAfter).to.equal(ESCROW_AMOUNT * 2n - ESCROW_AMOUNT + e.totalAmount);
    });

    it("should reject non-admin refund", async function () {
      await expect(
        escrow.connect(client).refund(escrowId)
      ).to.be.reverted;
    });
  });

  describe("Claim Expired", function () {
    it("should allow client to reclaim after deadline", async function () {
      const deadline = (await time.latest()) + 100;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, deadline);

      // Fast forward past deadline
      await time.increase(200);

      const balBefore = await token.balanceOf(client.address);
      await escrow.connect(client).claimExpired(0);
      const balAfter = await token.balanceOf(client.address);

      expect(balAfter).to.be.greaterThan(balBefore);
      const e = await escrow.getEscrow(0);
      expect(e.status).to.equal(3); // Expired
    });

    it("should reject claim before deadline", async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, deadline);
      
      await expect(
        escrow.connect(client).claimExpired(0)
      ).to.be.revertedWith("Not expired");
    });

    it("should reject claim by non-client", async function () {
      const deadline = (await time.latest()) + 100;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, deadline);
      await time.increase(200);

      await expect(
        escrow.connect(provider).claimExpired(0)
      ).to.be.revertedWith("Not client");
    });
  });

  describe("Admin Controls", function () {
    it("should update fees", async function () {
      await escrow.setFees(200, 300);
      expect(await escrow.creationFeeBps()).to.equal(200);
      expect(await escrow.releaseFeeBps()).to.equal(300);
    });

    it("should reject fees >5%", async function () {
      await expect(escrow.setFees(501, 200)).to.be.revertedWith("Creation fee >5%");
      await expect(escrow.setFees(200, 501)).to.be.revertedWith("Release fee >5%");
    });

    it("should update treasury", async function () {
      const [,,, , newTreasury] = await ethers.getSigners();
      await escrow.setTreasury(newTreasury.address);
      expect(await escrow.treasury()).to.equal(newTreasury.address);
    });

    it("should pause and unpause", async function () {
      await escrow.pause();
      const deadline = (await time.latest()) + 86400;
      await expect(
        escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, deadline)
      ).to.be.reverted;

      await escrow.unpause();
      // Should work after unpause
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 2, deadline);
    });
  });

  describe("View Functions", function () {
    it("should return remaining balance", async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 4, deadline);

      const e = await escrow.getEscrow(0);
      expect(await escrow.getRemainingBalance(0)).to.equal(e.totalAmount);

      await escrow.releaseMilestone(0);
      const remaining = await escrow.getRemainingBalance(0);
      expect(remaining).to.be.lessThan(e.totalAmount);
    });

    it("should return milestone amount", async function () {
      const deadline = (await time.latest()) + 86400;
      await escrow.connect(client).createEscrow(provider.address, ESCROW_AMOUNT, 4, deadline);
      
      const e = await escrow.getEscrow(0);
      expect(await escrow.getMilestoneAmount(0)).to.equal(e.totalAmount / 4n);
    });
  });
});
