import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

import { fetchAssets } from './api/asset'
import { Asset } from './model/asset'
import { debug, sendSlackMessage } from './utils/slack'
import { chain } from './utils/chain'
import { classifyPositionByLTV } from './model/loan-position'
import { fetchLoanPositions } from './api/loan-position'
import { liquidate } from './utils/liquidate'

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

const main = async () => {
  if (!assets) {
    assets = await fetchAssets()
    await sendSlackMessage('info', ['BOT STARTED'])
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
  const unSafePositions = [...overLTVPositions, ...expiredPositions]

  await debug({
    assets,
    positions,
    unSafePositions,
    topRiskyPositions,
    topBorrowedPositions,
    prices,
  })
  if (unSafePositions.length > 0) {
    await liquidate(publicClient, walletClient, unSafePositions)
  }
}

setInterval(
  () =>
    main()
      .then()
      .catch(async (e) => {
        await sendSlackMessage('debug', [e.toString()])
      }),
  10 * 1000,
)
