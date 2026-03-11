const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  // Existing deployed addresses
  const TOKEN_ADDRESS = "0xE9C5A4e0c4380B8729aC22b081cb003b7DD750C6";
  const TREASURY_ADDRESS = "0xA189b02aFc53151E0Bd48A6CBcDfD5073c3eAa78";

  console.log("═══════════════════════════════════════════════");
  console.log("  OCULOPS CHAIN — Deploy Escrow Contract");
  console.log("═══════════════════════════════════════════════");
  console.log(`  Network:  ${network.name} (chainId: ${network.chainId})`);
  console.log(`  Deployer: ${deployer.address}`);
  console.log(`  Balance:  ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} XRP`);
  console.log("═══════════════════════════════════════════════\n");

  console.log("  Deploying OculopsEscrow...");
  const Escrow = await ethers.getContractFactory("OculopsEscrow");
  const escrow = await Escrow.deploy(
    TOKEN_ADDRESS,
    TREASURY_ADDRESS,
    deployer.address // admin = deployer (Roberto)
  );
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();

  console.log(`  ✓ OculopsEscrow deployed at: ${escrowAddress}`);
  console.log(`    Token:    ${TOKEN_ADDRESS}`);
  console.log(`    Treasury: ${TREASURY_ADDRESS}`);
  console.log(`    Admin:    ${deployer.address}`);
  console.log(`    Creation fee: ${await escrow.creationFeeBps()} bps (1%)`);
  console.log(`    Release fee:  ${await escrow.releaseFeeBps()} bps (2%)`);
  console.log("═══════════════════════════════════════════════\n");

  return { escrow: escrowAddress };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n  ✗ Deployment failed:", error);
    process.exit(1);
  });
