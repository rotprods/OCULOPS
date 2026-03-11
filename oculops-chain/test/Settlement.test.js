const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Settlement", function () {
  let settlement, owner, recorder, user1;

  beforeEach(async function () {
    [owner, recorder, user1] = await ethers.getSigners();

    const Settlement = await ethers.getContractFactory("Settlement");
    settlement = await Settlement.deploy(owner.address);
    await settlement.waitForDeployment();

    // Grant recorder role
    const RECORDER_ROLE = await settlement.RECORDER_ROLE();
    await settlement.grantRole(RECORDER_ROLE, recorder.address);
  });

  describe("Record Batch", function () {
    it("should record a valid batch", async function () {
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-001"));
      await settlement.connect(recorder).recordBatch(batchHash, 5, ethers.parseEther("10000"));

      const [count, total, timestamp, recorded] = await settlement.getBatch(batchHash);
      expect(recorded).to.be.true;
      expect(count).to.equal(5);
      expect(total).to.equal(ethers.parseEther("10000"));
    });

    it("should emit BatchRecorded event", async function () {
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-002"));
      await expect(
        settlement.connect(recorder).recordBatch(batchHash, 3, ethers.parseEther("5000"))
      )
        .to.emit(settlement, "BatchRecorded")
        .withArgs(batchHash, 3, ethers.parseEther("5000"), (v) => v > 0);
    });

    it("should increment total counters", async function () {
      const hash1 = ethers.keccak256(ethers.toUtf8Bytes("batch-a"));
      const hash2 = ethers.keccak256(ethers.toUtf8Bytes("batch-b"));

      await settlement.connect(recorder).recordBatch(hash1, 2, ethers.parseEther("1000"));
      await settlement.connect(recorder).recordBatch(hash2, 3, ethers.parseEther("2000"));

      expect(await settlement.totalBatches()).to.equal(2);
      expect(await settlement.totalSettledAmount()).to.equal(ethers.parseEther("3000"));
    });

    it("should reject duplicate batch hashes", async function () {
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-dup"));
      await settlement.connect(recorder).recordBatch(batchHash, 1, ethers.parseEther("100"));

      await expect(
        settlement.connect(recorder).recordBatch(batchHash, 1, ethers.parseEther("100"))
      ).to.be.revertedWith("Settlement: duplicate batch");
    });

    it("should reject empty hash", async function () {
      await expect(
        settlement.connect(recorder).recordBatch(ethers.ZeroHash, 1, ethers.parseEther("100"))
      ).to.be.revertedWith("Settlement: empty hash");
    });

    it("should reject zero count", async function () {
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-zero"));
      await expect(
        settlement.connect(recorder).recordBatch(batchHash, 0, ethers.parseEther("100"))
      ).to.be.revertedWith("Settlement: zero count");
    });

    it("should reject unauthorized callers", async function () {
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-unauth"));
      await expect(
        settlement.connect(user1).recordBatch(batchHash, 1, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });

  describe("Verify Batch", function () {
    it("should verify recorded batches", async function () {
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-verify"));
      await settlement.connect(recorder).recordBatch(batchHash, 1, ethers.parseEther("100"));

      const [recorded, timestamp] = await settlement.verifyBatch(batchHash);
      expect(recorded).to.be.true;
      expect(timestamp).to.be.gt(0);
    });

    it("should return false for unrecorded batches", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const [recorded, timestamp] = await settlement.verifyBatch(fakeHash);
      expect(recorded).to.be.false;
      expect(timestamp).to.equal(0);
    });
  });

  describe("Pause", function () {
    it("should block recording when paused", async function () {
      await settlement.pause();
      const batchHash = ethers.keccak256(ethers.toUtf8Bytes("batch-paused"));
      await expect(
        settlement.connect(recorder).recordBatch(batchHash, 1, ethers.parseEther("100"))
      ).to.be.reverted;
    });
  });
});
