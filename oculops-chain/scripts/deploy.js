const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log("═══════════════════════════════════════════════");
  console.log("  OCULOPS CHAIN — Deployment (XRPL EVM Sidechain)");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Network:  ${network.name} (chainId: ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log("═══════════════════════════════════════════════\n");

  // --- 1. Deploy OculopsToken ---
  console.log("1/4  Deploying OculopsToken...");
  const OculopsToken = await ethers.getContractFactory("OculopsToken");
  // In Phase 1, all tokens go to deployer, then transferred to Treasury
  const token = await OculopsToken.deploy(deployer.address, deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log(`     ✓ OculopsToken deployed at: ${tokenAddress}`);
  console.log(`     Supply: ${ethers.formatEther(await token.totalSupply())} OCUL\n`);

  // --- 2. Deploy Treasury ---
  console.log("2/4  Deploying Treasury...");
  const TOTAL_SUPPLY = await token.TOTAL_SUPPLY();
  const maxPerOp = TOTAL_SUPPLY / 100n;    // 1% of supply
  const dailyLimit = TOTAL_SUPPLY / 20n;    // 5% of supply

  const Treasury = await ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy(
    tokenAddress,
    deployer.address,
    maxPerOp,
    dailyLimit
  );
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`     ✓ Treasury deployed at: ${treasuryAddress}`);
  console.log(`     Max per op: ${ethers.formatEther(maxPerOp)} OCUL`);
  console.log(`     Daily limit: ${ethers.formatEther(dailyLimit)} OCUL\n`);

  // --- 3. Deploy Settlement ---
  console.log("3/4  Deploying Settlement...");
  const Settlement = await ethers.getContractFactory("Settlement");
  const settlement = await Settlement.deploy(deployer.address);
  await settlement.waitForDeployment();
  const settlementAddress = await settlement.getAddress();
  console.log(`     ✓ Settlement deployed at: ${settlementAddress}\n`);

  // --- 4. Deploy Rewards ---
  console.log("4/4  Deploying Rewards...");
  const maxClaimPerEpoch = ethers.parseEther("10000"); // 10K OCUL max claim per user per epoch
  const Rewards = await ethers.getContractFactory("Rewards");
  const rewards = await Rewards.deploy(
    tokenAddress,
    deployer.address,
    maxClaimPerEpoch
  );
  await rewards.waitForDeployment();
  const rewardsAddress = await rewards.getAddress();
  console.log(`     ✓ Rewards deployed at: ${rewardsAddress}\n`);

  // --- 5. Fund contracts ---
  console.log("5/5  Funding contracts...");

  // Transfer 40% to Treasury (40M OCUL)
  const treasuryAlloc = ethers.parseEther("40000000");
  await token.transfer(treasuryAddress, treasuryAlloc);
  console.log(`     ✓ Treasury funded: ${ethers.formatEther(treasuryAlloc)} OCUL`);

  // Transfer 25% to Rewards pool (25M OCUL)
  const rewardsAlloc = ethers.parseEther("25000000");
  await token.transfer(rewardsAddress, rewardsAlloc);
  console.log(`     ✓ Rewards funded: ${ethers.formatEther(rewardsAlloc)} OCUL`);

  // Remaining 35% stays with deployer (Team 20% + Reserve 10% + Early Adopters 5%)
  const deployerBalance = await token.balanceOf(deployer.address);
  console.log(`     ✓ Deployer retains: ${ethers.formatEther(deployerBalance)} OCUL\n`);

  // --- Summary ---
  console.log("═══════════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("═══════════════════════════════════════════════");
  console.log(`  OculopsToken:  ${tokenAddress}`);
  console.log(`  Treasury:      ${treasuryAddress}`);
  console.log(`  Settlement:    ${settlementAddress}`);
  console.log(`  Rewards:       ${rewardsAddress}`);
  console.log("═══════════════════════════════════════════════");
  console.log("\n  IMPORTANT: Save these addresses in .env and");
  console.log("  register them in Supabase chain_contracts table.");
  console.log("\n  Next steps:");
  console.log("  1. Run: npx hardhat run scripts/verify.js --network xrplEvmDevnet");
  console.log("  2. Register contracts in Supabase");
  console.log("  3. Configure chain-bridge Edge Function");

  return {
    token: tokenAddress,
    treasury: treasuryAddress,
    settlement: settlementAddress,
    rewards: rewardsAddress,
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n  ✗ Deployment failed:", error);
    process.exit(1);
  });
