require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);

// XRPL EVM Sidechain Networks
const XRPL_EVM_MAINNET_RPC = process.env.XRPL_EVM_MAINNET_RPC || "https://rpc.xrplevm.org";
const XRPL_EVM_TESTNET_RPC = process.env.XRPL_EVM_TESTNET_RPC || "https://rpc.testnet.xrplevm.org";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // XRPL EVM Sidechain — Testnet (funded, ready to deploy)
    xrplEvmTestnet: {
      url: XRPL_EVM_TESTNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 1449000,
      gasPrice: "auto",
    },
    // XRPL EVM Sidechain — Mainnet
    xrplEvmMainnet: {
      url: XRPL_EVM_MAINNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 1440000,
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      xrplEvmTestnet: "no-api-key-needed",
      xrplEvmMainnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "xrplEvmTestnet",
        chainId: 1449000,
        urls: {
          apiURL: "https://explorer.testnet.xrplevm.org/api",
          browserURL: "https://explorer.testnet.xrplevm.org",
        },
      },
      {
        network: "xrplEvmMainnet",
        chainId: 1440000,
        urls: {
          apiURL: "https://explorer.xrplevm.org/api",
          browserURL: "https://explorer.xrplevm.org",
        },
      },
    ],
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
  },
};
