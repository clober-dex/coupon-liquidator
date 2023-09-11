import { PublicClient, WalletClient } from 'viem'

import { Asset } from '../model/asset'
import { LoanPosition } from '../model/loan-position'

import { CONTRACT_ADDRESSES } from './addresses'
import { fetchBalances } from './balance'

const _abi = [
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'positionId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxRepayAmount',
        type: 'uint256',
      },
    ],
    name: 'getLiquidationStatus',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'positionId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxRepayAmount',
        type: 'uint256',
      },
    ],
    name: 'liquidate',
    outputs: [
      {
        internalType: 'uint256',
        name: 'liquidationAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'repayAmount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'protocolFeeAmount',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export async function liquidate(
  publicClient: PublicClient,
  walletClient: WalletClient,
  assets: Asset[],
  positions: LoanPosition[],
) {
  if (!walletClient.account) {
    throw new Error('Wallet client is not connected')
  }
  const balances = await fetchBalances(
    publicClient,
    walletClient.account.address,
    assets,
  )
  const results = await publicClient.multicall({
    contracts: positions.map((position) => ({
      address: CONTRACT_ADDRESSES.LoanPositionManager,
      abi: _abi,
      functionName: 'getLiquidationStatus',
      args: [
        position.id,
        balances[position.collateral.underlying.address] ?? 0n,
      ],
    })),
  })
  const data = results.reduce(
    (acc, { result }, i) => ({
      ...acc,
      [positions[i].id.toString()]: {
        position: positions[i],
        liquidationAmount: result?.[0] ?? 0n,
        repayAmount: result?.[1] ?? 0n,
        protocolFeeAmount: result?.[2] ?? 0n,
      },
    }),
    {},
  )
  console.log('data', data)
}
