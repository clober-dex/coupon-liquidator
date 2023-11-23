import { getAddress, PublicClient } from 'viem'

import { LoanPosition } from '../model/loan-position'
import { getBuiltGraphSDK } from '../../.graphclient'
import { Asset } from '../model/asset'
import { calculateCurrentLTV, calculateIsOverLTVThreshold } from '../utils/ltv'
import { fetchPrices } from '../utils/price'
import { BigDecimal, dollarValue } from '../utils/numbers'

import { fetchCurrencies, toCurrency } from './asset'

const { getLoanPositions } = getBuiltGraphSDK()

export async function fetchLoanPositions(
  publicClient: PublicClient,
  assets: Asset[],
): Promise<{
  loanPositions: LoanPosition[]
  prices: { [address: `0x${string}`]: BigDecimal }
}> {
  const currencies = fetchCurrencies(assets)
  const [{ loanPositions }, prices] = await Promise.all([
    getLoanPositions(
      {},
      {
        url: process.env.SUBGRAPH_URL,
      },
    ),
    fetchPrices(
      publicClient,
      currencies.map((currency) => currency.address),
    ),
  ])

  return {
    prices,
    loanPositions: loanPositions.map((loanPosition) => {
      const position = {
        id: BigInt(loanPosition.id),
        user: getAddress(loanPosition.user),
        substitute: toCurrency(loanPosition.substitute),
        underlying: toCurrency(loanPosition.underlying),
        collateral: {
          underlying: toCurrency(loanPosition.collateral.underlying),
          substitute: toCurrency(loanPosition.collateral.substitute),
          liquidationThreshold: BigInt(
            loanPosition.collateral.liquidationThreshold,
          ),
          liquidationTargetLtv: BigInt(
            loanPosition.collateral.liquidationTargetLtv,
          ),
        },
        amount: BigInt(loanPosition.amount),
        collateralAmount: BigInt(loanPosition.collateralAmount),
        toEpoch: {
          id: Number(loanPosition.toEpoch.id),
          startTimestamp: Number(loanPosition.toEpoch.startTimestamp),
          endTimestamp: Number(loanPosition.toEpoch.endTimestamp),
        },
      }

      return {
        ...position,
        isOverLTVThreshold: calculateIsOverLTVThreshold(
          position.amount,
          prices[position.underlying.address],
          position.underlying,
          position.collateralAmount,
          prices[position.collateral.underlying.address],
          position.collateral,
        ),
        ltv: calculateCurrentLTV(
          position.amount,
          prices[position.underlying.address],
          position.underlying,
          position.collateralAmount,
          prices[position.collateral.underlying.address],
          position.collateral,
        ),
        debtUSDAmount: dollarValue(
          position.amount,
          position.underlying.decimals,
          prices[position.underlying.address],
        ).toNumber(),
        collateralUSDAmount: dollarValue(
          position.collateralAmount,
          position.collateral.underlying.decimals,
          prices[position.collateral.underlying.address],
        ).toNumber(),
      }
    }),
  }
}
