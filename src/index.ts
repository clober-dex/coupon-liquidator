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
    assets.map((asset) => ({
      symbol: asset.underlying.symbol,
      price: formatUnits(
        prices[asset.underlying.address].value,
        prices[asset.underlying.address].decimals,
      ),
    })),
    'PRICES:',
  )
  await sendSlackMessage(
    'debug',
    topRiskyPositions.map((position) => ({
      position: position.id.toString(),
      ltv: `${position.ltv.toFixed(2)}%`,
      debt: `${formatUnits(
        position.amount,
        position.underlying.decimals,
        prices[position.underlying.address],
      )} ${position.underlying.symbol}`,
      collateral: `${formatUnits(
        position.collateralAmount,
        position.collateral.underlying.decimals,
        prices[position.collateral.underlying.address],
      )} ${position.collateral.underlying.symbol}`,
    })),
    `TOP ${topRiskyPositions.length} RISKY POSITIONS:`,
  )
  await sendSlackMessage(
    'debug',
    topBorrowedPositions.map((position) => ({
      position: position.id.toString(),
      ltv: `${position.ltv.toFixed(2)}%`,
      debtUSDAmount: `$${position.debtUSDAmount.toFixed(2)}`,
    })),
    `TOP ${topBorrowedPositions.length} BORROWED POSITIONS:`,
  )
}

const main = async () => {
  if (!assets) {
    assets = await fetchAssets()
    await sendSlackMessage('debug', {
      message: 'BOT STARTED',
      time: `${new Date().toLocaleString()} ${new Date().getMilliseconds()}`,
      account: walletClient.account.address,
      chain: chain.id,
      assets: assets.map((asset) => asset.underlying.symbol),
    })
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
