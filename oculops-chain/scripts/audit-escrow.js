const { ethers } = require("hardhat");

async function main() {
  const escrow = await ethers.getContractAt("OculopsEscrow", "0xfb7E3A09312b3664eddD71c427bc657f4638A866");
  const deployer = "0xd3175A921016d9E2f0F3730E550F3a84549A7C5f";

  const ADMIN_ROLE = await escrow.ADMIN_ROLE();
  const DEFAULT_ADMIN_ROLE = await escrow.DEFAULT_ADMIN_ROLE();

  console.log("═══════════════════════════════════════");
  console.log("  ESCROW ACCESS CONTROL AUDIT");
  console.log("═══════════════════════════════════════");
  console.log(`  ADMIN_ROLE:         ${await escrow.hasRole(ADMIN_ROLE, deployer)}`);
  console.log(`  DEFAULT_ADMIN_ROLE: ${await escrow.hasRole(DEFAULT_ADMIN_ROLE, deployer)}`);
  console.log(`  Treasury:           ${await escrow.treasury()}`);
  console.log(`  Paused:             ${await escrow.paused()}`);
  console.log(`  Creation Fee:       ${await escrow.creationFeeBps()} bps`);
  console.log(`  Release Fee:        ${await escrow.releaseFeeBps()} bps`);
  console.log(`  Escrows Created:    ${await escrow.escrowCount()}`);
  console.log("═══════════════════════════════════════");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
