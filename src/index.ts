import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { fetchAssets } from './api/asset'
import { Asset } from './model/asset'
import { sendSlackMessage } from './utils/slack'
import { chain } from './utils/chain'
import { classifyPositionByLTV, LoanPosition } from './model/loan-position'
import { fetchLoanPositions } from './api/loan-position'
import { approveMax } from './utils/approve'
import { CONTRACT_ADDRESSES } from './utils/addresses'
import { liquidate } from './utils/liquidate'
import { BigDecimal, formatUnits } from './utils/numbers'

let assets: Asset[] | null = null

const [publicClient, walletClient] = [
  createPublicClient({
    chain,
    transport: http(),
  }),
  createWalletClient({
    account: privateKeyToAccount(
      (process.env.PRIVATE_KEY || '0x') as `0x${string}`,
    ),
    chain,
    transport: http(),
  }),
]

const debug = async ({
  topRiskyPositions,
  topBorrowedPositions,
  prices,
}: {
  topRiskyPositions: LoanPosition[]
  topBorrowedPositions: LoanPosition[]
  prices: { [address: string]: BigDecimal }
}) => {
  if (!assets) {
    return
  }
  await sendSlackMessage(
    'debug',
    assets.map(
      (asset) =>
        `${asset.underlying.symbol.padStart(6)}: $${formatUnits(
          prices[asset.underlying.address].value,
          prices[asset.underlying.address].decimals,
        )}`,
    ),
    'PRICES:',
  )

  await sendSlackMessage(
    'debug',
    topRiskyPositions.map(
      (position) =>
        `${position.user.toLowerCase()} debt ratio: ${position.ltv
          .toFixed(2)
          .padStart(6)}% loan: ${formatUnits(
          position.amount,
          position.underlying.decimals,
          prices[position.underlying.address],
        ).padStart(8)} ${position.underlying.symbol} collateral: ${formatUnits(
          position.collateralAmount,
          position.collateral.underlying.decimals,
          prices[position.collateral.underlying.address],
        ).padStart(8)} ${
          position.collateral.underlying.symbol
        } (liq. price $${position.liquidationPrice.toFixed(4).padStart(8)})`,
    ),
    `TOP ${topRiskyPositions.length} RISKY POSITIONS:`,
  )

  await sendSlackMessage(
    'debug',
    topBorrowedPositions.map(
      (position) =>
        `${position.user.toLowerCase()} debt ratio: ${position.ltv
          .toFixed(2)
          .padStart(6)}% loan: ${formatUnits(
          position.amount,
          position.underlying.decimals,
          prices[position.underlying.address],
        ).padStart(8)} ${position.underlying.symbol} collateral: ${formatUnits(
          position.collateralAmount,
          position.collateral.underlying.decimals,
          prices[position.collateral.underlying.address],
        ).padStart(8)} ${
          position.collateral.underlying.symbol
        } (liq. price $${position.liquidationPrice.toFixed(4).padStart(8)})`,
    ),
    `TOP ${topBorrowedPositions.length} BORROWED POSITIONS:`,
  )
}

const main = async () => {
  if (!assets) {
    assets = await fetchAssets()
    await sendSlackMessage('debug', ['BOT STARTED'])
    await approveMax(
      publicClient,
      walletClient,
      assets,
      CONTRACT_ADDRESSES.LoanPositionLiquidateHelper,
    )
  }
  const rank = Number(process.env.RANK || '5')
  const { loanPositions: positions, prices } = await fetchLoanPositions(
    publicClient,
    assets,
  )
  const {
    topRiskyPositions,
    topBorrowedPositions,
    overLTVPositions,
    expiredPositions,
  } = await classifyPositionByLTV(positions, rank)

  await debug({ topRiskyPositions, topBorrowedPositions, prices })

  await liquidate(publicClient, walletClient, assets, [
    ...overLTVPositions,
    ...expiredPositions,
  ])
}

setInterval(
  () =>
    main()
      .then()
      .catch(async (e) => {
        await sendSlackMessage('debug', e.toString())
      }),
  5000,
)
