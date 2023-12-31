import { maxUint256, PublicClient, WalletClient } from 'viem'

import { LoanPosition } from '../model/loan-position'
import { fetchAmountOutByOdos, fetchCallDataByOdos } from '../api/odos'

import { CONTRACT_ADDRESSES } from './addresses'
import { chain } from './chain'
import { sendSlackMessage } from './slack'
import { SLIPPAGE_PERCENT } from './slippage'
import { formatUnits } from './numbers'
import { fetchBalances } from './balance'

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
  const liquidationAmountAndRepayAmounts = (
    (await publicClient.multicall({
      contracts: positions.map((position) => ({
        address: CONTRACT_ADDRESSES.LoanPositionManager,
        abi: LOAN_POSITION_MANAGER_ABI,
        functionName: 'getLiquidationStatus',
        args: [position.id, maxUint256],
      })),
    })) as { result: readonly [bigint, bigint, bigint] }[]
  ).map(({ result }) => [
    ((result?.[0] - result?.[2]) as bigint) ?? 0n,
    (result?.[1] as bigint) ?? 0n,
  ])
  for (let i = 0; i < positions.length; i++) {
    const position = positions[i]
    const liquidationAmount = liquidationAmountAndRepayAmounts[i][0]
    const repayAmount = liquidationAmountAndRepayAmounts[i][1]
    const liquidationAmountWithSlippage = BigInt(
      Math.floor(Number(liquidationAmount) * (1 - SLIPPAGE_PERCENT / 100)),
    )
    const { pathId } = await fetchAmountOutByOdos({
      chainId: chain.id,
      amountIn: liquidationAmountWithSlippage.toString(),
      tokenIn: position.collateral.underlying.address,
      tokenOut: position.underlying.address,
      slippageLimitPercent: SLIPPAGE_PERCENT,
      userAddress: CONTRACT_ADDRESSES.CouponLiquidator,
      gasPrice,
    })
    const swapData = await fetchCallDataByOdos({
      pathId,
      userAddress: CONTRACT_ADDRESSES.CouponLiquidator,
    })
    const balancesBefore = await fetchBalances(
      publicClient,
      walletClient.account.address,
      [position.underlying.address, position.collateral.underlying.address],
    )
    try {
      const hash = await walletClient.writeContract({
        chain,
        address: CONTRACT_ADDRESSES.CouponLiquidator,
        abi: LIQUIDATOR_ABI,
        functionName: 'liquidate',
        args: [
          position.id,
          liquidationAmountWithSlippage,
          swapData,
          walletClient.account.address,
        ],
        account: walletClient.account,
      })
      const balancesAfter = await fetchBalances(
        publicClient,
        walletClient.account.address,
        [position.underlying.address, position.collateral.underlying.address],
      )
      await sendSlackMessage(
        'info',
        [
          `TX: ${
            walletClient.chain?.blockExplorers?.default.url ||
            'https://arbiscan.io'
          }/tx/${hash}`,
          `  account: ${position.user}`,
          `  collateral amount: ${formatUnits(
            position.collateralAmount,
            position.collateral.underlying.decimals,
          )} ${position.collateral.underlying.symbol}`,
          `  debt amount: ${formatUnits(
            position.amount,
            position.underlying.decimals,
          )} ${position.underlying.symbol}`,
          `  liquidation amount: ${formatUnits(
            liquidationAmountWithSlippage,
            position.collateral.underlying.decimals,
          )} ${position.collateral.underlying.symbol}`,
          `  repay amount: ${formatUnits(
            repayAmount,
            position.underlying.decimals,
          )} ${position.underlying.symbol}`,
          `  earned amount: ${formatUnits(
            balancesAfter[position.underlying.address] -
              balancesBefore[position.underlying.address],
            position.underlying.decimals,
          )} ${position.underlying.symbol} & ${formatUnits(
            balancesAfter[position.collateral.underlying.address] -
              balancesBefore[position.collateral.underlying.address],
            position.collateral.underlying.decimals,
          )} ${position.collateral.underlying.symbol}`,
        ],
        'LIQUIDATE_SUCCEEDED:',
      )
    } catch (e: any) {
      await sendSlackMessage('info', [e.toString()], 'LIQUIDATE_FAILED:')
    }
  }
}
