import { maxUint256, PublicClient, WalletClient } from 'viem'

import { Asset } from '../model/asset'
import { LoanPosition } from '../model/loan-position'
import { fetchAmountOutByOdos, fetchCallDataByOdos } from '../api/odos'

import { CONTRACT_ADDRESSES } from './addresses'
import { chain } from './chain'
import { SLIPPAGE } from './slippage'

const LOAN_POSITION_MANAGER_ABI = [
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
] as const

const LIQUIDATOR_ABI = [
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
      {
        internalType: 'bytes',
        name: 'swapData',
        type: 'bytes',
      },
    ],
    name: 'liquidate',
    outputs: [
      {
        internalType: 'bytes',
        name: 'result',
        type: 'bytes',
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
  const gasPrice = Number(await publicClient.getGasPrice())
  const liquidationAmounts = (
    (await publicClient.multicall({
      contracts: positions.map((position) => ({
        address: CONTRACT_ADDRESSES.LoanPositionManager,
        abi: LOAN_POSITION_MANAGER_ABI,
        functionName: 'getLiquidationStatus',
        args: [position.id, maxUint256],
      })),
    })) as { result: readonly [bigint, bigint, bigint] }[]
  ).map(({ result }) => (result?.[0] as bigint) ?? 0n)
  const swapDataList: `0x${string}`[] = []
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i]
    const liquidationAmount = liquidationAmounts[i]
    const { pathId } = await fetchAmountOutByOdos({
      chainId: chain.id,
      amountIn: liquidationAmount.toString(),
      tokenIn: position.collateral.underlying.address,
      tokenOut: position.underlying.address,
      slippageLimitPercent: SLIPPAGE,
      userAddress: walletClient.account.address,
      gasPrice: gasPrice,
    })
    const swapData = await fetchCallDataByOdos({
      pathId,
      userAddress: walletClient.account.address,
    })
    swapDataList.push(swapData)
  }
  const liquidationResults = (
    (await publicClient.multicall({
      contracts: positions.map((position, i) => {
        const liquidationAmount = liquidationAmounts[i]
        const swapData = swapDataList[i]
        return {
          address: CONTRACT_ADDRESSES.LoanPositionManager,
          abi: LIQUIDATOR_ABI,
          functionName: 'liquidate',
          args: [position.id, liquidationAmount, swapData],
        }
      }),
    })) as { result: `0x${string}` }[]
  ).map(({ result }) => result)
  console.log(liquidationResults)
}
