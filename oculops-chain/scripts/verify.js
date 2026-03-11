const { run } = require("hardhat");

async function main() {
  // Read deployed addresses from environment or command line
  // In production, these would come from deployment artifacts
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
  const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS;
  const SETTLEMENT_ADDRESS = process.env.SETTLEMENT_ADDRESS;
  const REWARDS_ADDRESS = process.env.REWARDS_ADDRESS;

  if (!TOKEN_ADDRESS || !TREASURY_ADDRESS || !SETTLEMENT_ADDRESS || !REWARDS_ADDRESS) {
    console.error("Missing contract addresses. Set environment variables:");
    console.error("  TOKEN_ADDRESS, TREASURY_ADDRESS, SETTLEMENT_ADDRESS, REWARDS_ADDRESS");
    process.exit(1);
  }

  const [deployer] = await ethers.getSigners();

  console.log("═══════════════════════════════════════════════");
  console.log("  OCULOPS CHAIN — Contract Verification");
  console.log("═══════════════════════════════════════════════\n");

  try {
    console.log("1/4  Verifying OculopsToken...");
    await run("verify:verify", {
      address: TOKEN_ADDRESS,
      constructorArguments: [deployer.address, deployer.address],
    });
    console.log("     ✓ OculopsToken verified\n");
  } catch (e) {
    console.log(`     ⚠ ${e.message}\n`);
  }

  try {
    console.log("2/4  Verifying Treasury...");
    const totalSupply = ethers.parseEther("100000000");
    await run("verify:verify", {
      address: TREASURY_ADDRESS,
      constructorArguments: [
        TOKEN_ADDRESS,
        deployer.address,
        totalSupply / 100n,   // maxPerOp
        totalSupply / 20n,    // dailyLimit
      ],
    });
    console.log("     ✓ Treasury verified\n");
  } catch (e) {
    console.log(`     ⚠ ${e.message}\n`);
  }

  try {
    console.log("3/4  Verifying Settlement...");
    await run("verify:verify", {
      address: SETTLEMENT_ADDRESS,
      constructorArguments: [deployer.address],
    });
    console.log("     ✓ Settlement verified\n");
  } catch (e) {
    console.log(`     ⚠ ${e.message}\n`);
  }

  try {
    console.log("4/4  Verifying Rewards...");
    await run("verify:verify", {
      address: REWARDS_ADDRESS,
      constructorArguments: [
        TOKEN_ADDRESS,
        deployer.address,
        ethers.parseEther("10000"),
      ],
    });
    console.log("     ✓ Rewards verified\n");
  } catch (e) {
    console.log(`     ⚠ ${e.message}\n`);
  }

  console.log("═══════════════════════════════════════════════");
  console.log("  Verification complete. Check BaseScan.");
  console.log("═══════════════════════════════════════════════");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
