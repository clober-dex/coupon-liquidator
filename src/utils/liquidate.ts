import { maxUint256, PublicClient, WalletClient } from 'viem'

import { LoanPosition } from '../model/loan-position'
import { fetchAmountOutByOdos, fetchCallDataByOdos } from '../api/odos'

import { CONTRACT_ADDRESSES } from './addresses'
import { chain } from './chain'
import { sendSlackMessage } from './slack'
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
        name: 'swapAmount',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'swapData',
        type: 'bytes',
      },
      {
        internalType: 'uint256',
        name: 'maxRepayAmount',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'feeRecipient',
        type: 'address',
      },
    ],
    name: 'liquidate',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

export async function liquidate(
  publicClient: PublicClient,
  walletClient: WalletClient,
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
  ).map(({ result }) => ((result?.[0] - result?.[2]) as bigint) ?? 0n)
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
      gasPrice,
    })
    const swapData = await fetchCallDataByOdos({
      pathId,
      userAddress: walletClient.account.address,
    })
    const hash = await walletClient.writeContract({
      chain,
      address: CONTRACT_ADDRESSES.CouponLiquidator,
      abi: LIQUIDATOR_ABI,
      functionName: 'liquidate',
      args: [
        position.id,
        liquidationAmount,
        swapData,
        maxUint256,
        walletClient.account.address,
      ],
      account: walletClient.account,
    })
    await sendSlackMessage('info', [hash], 'LIQUIDATE_SUCCEEDED:')
  }
}
