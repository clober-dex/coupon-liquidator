// eslint-disable-next-line import/order
import * as dotenv from 'dotenv'

import '@nomiclabs/hardhat-waffle'
import '@typechain/hardhat'
import 'hardhat-deploy'
import '@nomiclabs/hardhat-ethers'

import { HardhatConfig } from 'hardhat/types'
import { arbitrum, arbitrumGoerli, localhost } from 'viem/chains'

dotenv.config()

const config: HardhatConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          evmVersion: 'london',
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
    overrides: {},
  },
  // @ts-ignore
  typechain: {
    outDir: 'typechain',
    target: 'ethers-v5',
  },

  defaultNetwork: 'hardhat',
  networks: {
    [arbitrum.id]: {
      url: arbitrum.rpcUrls.public.http[0],
      chainId: arbitrum.id,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1,
      timeout: 3000000,
      httpHeaders: {},
      live: true,
      saveDeployments: true,
      tags: ['mainnet', 'prod'],
      companionNetworks: {},
    },
    [arbitrumGoerli.id]: {
      url: arbitrumGoerli.rpcUrls.public.http[0],
      chainId: arbitrumGoerli.id,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gas: 'auto',
      gasPrice: 'auto',
      gasMultiplier: 1,
      timeout: 3000000,
      httpHeaders: {},
      live: true,
      saveDeployments: true,
      tags: ['testnet', 'dev'],
      companionNetworks: {},
    },
    [7777]: {
      url: 'http://dev-rpc.coupon.finance',
      chainId: 7777,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gas: 20000000,
      gasPrice: 20000000,
      gasMultiplier: 1,
      timeout: 3000000,
      httpHeaders: {},
      live: true,
      saveDeployments: true,
      tags: ['testnet', 'test'],
      companionNetworks: {},
    },
    hardhat: {
      chainId: localhost.id,
      gas: 20000000,
      gasPrice: 250000000000,
      gasMultiplier: 1,
      hardfork: 'london',
      // @ts-ignore
      // forking: {
      //   enabled: true,
      //   url: 'ARCHIVE_NODE_URL',
      // },
      mining: {
        auto: true,
        interval: 0,
        mempool: {
          order: 'fifo',
        },
      },
      accounts: {
        mnemonic:
          'loop curious foster tank depart vintage regret net frozen version expire vacant there zebra world',
        initialIndex: 0,
        count: 10,
        path: "m/44'/60'/0'/0",
        accountsBalance: '10000000000000000000000000000',
        passphrase: '',
      },
      blockGasLimit: 200000000,
      // @ts-ignore
      minGasPrice: undefined,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      allowUnlimitedContractSize: true,
      initialDate: new Date().toISOString(),
      loggingEnabled: false,
      // @ts-ignore
      chains: undefined,
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  abiExporter: [
    // @ts-ignore
    {
      path: './abi',
      runOnCompile: false,
      clear: true,
      flat: true,
      only: [],
      except: [],
      spacing: 2,
      pretty: false,
      filter: () => true,
    },
  ],
  mocha: {
    timeout: 40000000,
    require: ['hardhat/register'],
  },
  // @ts-ignore
  contractSizer: {
    runOnCompile: true,
  },
}

export default config
