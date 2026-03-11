const { expect } = require("chai");
const { ethers } = require("hardhat");
const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");

describe("Rewards", function () {
  let token, rewards, owner, user1, user2, user3;
  const MAX_CLAIM = ethers.parseEther("10000");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy token
    const OculopsToken = await ethers.getContractFactory("OculopsToken");
    token = await OculopsToken.deploy(owner.address, owner.address);
    await token.waitForDeployment();

    // Deploy rewards
    const Rewards = await ethers.getContractFactory("Rewards");
    rewards = await Rewards.deploy(
      await token.getAddress(),
      owner.address,
      MAX_CLAIM
    );
    await rewards.waitForDeployment();

    // Fund rewards pool
    await token.transfer(await rewards.getAddress(), ethers.parseEther("25000000"));
  });

  describe("Merkle Root Update", function () {
    it("should update merkle root and increment epoch", async function () {
      const root = ethers.keccak256(ethers.toUtf8Bytes("merkle-root-1"));
      await rewards.updateMerkleRoot(root);
      expect(await rewards.currentEpoch()).to.equal(1);
      expect(await rewards.merkleRoot()).to.equal(root);
    });

    it("should store historical roots", async function () {
      const root1 = ethers.keccak256(ethers.toUtf8Bytes("root-1"));
      const root2 = ethers.keccak256(ethers.toUtf8Bytes("root-2"));

      await rewards.updateMerkleRoot(root1);
      await rewards.updateMerkleRoot(root2);

      expect(await rewards.epochRoots(1)).to.equal(root1);
      expect(await rewards.epochRoots(2)).to.equal(root2);
    });

    it("should reject empty root", async function () {
      await expect(
        rewards.updateMerkleRoot(ethers.ZeroHash)
      ).to.be.revertedWith("Rewards: empty root");
    });

    it("should reject unauthorized updaters", async function () {
      const root = ethers.keccak256(ethers.toUtf8Bytes("unauth-root"));
      await expect(
        rewards.connect(user1).updateMerkleRoot(root)
      ).to.be.reverted;
    });
  });

  describe("Claim with Merkle Proof", function () {
    let merkleTree;
    const reward1 = ethers.parseEther("500");
    const reward2 = ethers.parseEther("1000");

    beforeEach(async function () {
      // Build merkle tree off-chain
      const values = [
        [user1.address, reward1],
        [user2.address, reward2],
      ];

      merkleTree = StandardMerkleTree.of(values, ["address", "uint256"]);

      // Publish root on-chain
      await rewards.updateMerkleRoot(merkleTree.root);
    });

    it("should allow valid claims with proof", async function () {
      // Find user1's proof
      let proof;
      for (const [i, v] of merkleTree.entries()) {
        if (v[0] === user1.address) {
          proof = merkleTree.getProof(i);
          break;
        }
      }

      await rewards.connect(user1).claim(reward1, proof);
      expect(await token.balanceOf(user1.address)).to.equal(reward1);
    });

    it("should emit RewardClaimed event", async function () {
      let proof;
      for (const [i, v] of merkleTree.entries()) {
        if (v[0] === user1.address) {
          proof = merkleTree.getProof(i);
          break;
        }
      }

      await expect(rewards.connect(user1).claim(reward1, proof))
        .to.emit(rewards, "RewardClaimed")
        .withArgs(user1.address, 1, reward1);
    });

    it("should reject double claims", async function () {
      let proof;
      for (const [i, v] of merkleTree.entries()) {
        if (v[0] === user1.address) {
          proof = merkleTree.getProof(i);
          break;
        }
      }

      await rewards.connect(user1).claim(reward1, proof);
      await expect(
        rewards.connect(user1).claim(reward1, proof)
      ).to.be.revertedWith("Rewards: already claimed");
    });

    it("should reject invalid proofs", async function () {
      // User3 is not in the tree
      const fakeProof = [ethers.keccak256(ethers.toUtf8Bytes("fake"))];
      await expect(
        rewards.connect(user3).claim(ethers.parseEther("500"), fakeProof)
      ).to.be.revertedWith("Rewards: invalid proof");
    });

    it("should reject claims exceeding max per epoch", async function () {
      await expect(
        rewards.connect(user1).claim(MAX_CLAIM + 1n, [])
      ).to.be.revertedWith("Rewards: exceeds max claim");
    });

    it("should track claimed status correctly", async function () {
      let proof;
      for (const [i, v] of merkleTree.entries()) {
        if (v[0] === user1.address) {
          proof = merkleTree.getProof(i);
          break;
        }
      }

      expect(await rewards.hasClaimed(1, user1.address)).to.be.false;
      await rewards.connect(user1).claim(reward1, proof);
      expect(await rewards.hasClaimed(1, user1.address)).to.be.true;
    });
  });

  describe("Available Rewards", function () {
    it("should report correct available balance", async function () {
      expect(await rewards.availableRewards()).to.equal(
        ethers.parseEther("25000000")
      );
    });
  });

  describe("Pause", function () {
    it("should block claims when paused", async function () {
      await rewards.pause();
      await expect(
        rewards.connect(user1).claim(ethers.parseEther("100"), [])
      ).to.be.reverted;
    });
  });
});
