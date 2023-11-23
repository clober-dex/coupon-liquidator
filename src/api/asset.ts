import { getAddress } from 'viem'

import { getBuiltGraphSDK, Token } from '../../.graphclient'
import { Asset } from '../model/asset'
import { Currency } from '../model/currency'

const { getAssets } = getBuiltGraphSDK()

export const toCurrency = (
  token: Pick<Token, 'id' | 'symbol' | 'name' | 'decimals'>,
) => ({
  address: getAddress(token.id),
  name: token.name,
  symbol: token.symbol,
  decimals: token.decimals,
})

export async function fetchAssets(): Promise<Asset[]> {
  const { assets } = await getAssets(
    {},
    {
      url: process.env.SUBGRAPH_URL,
    },
  )

  const result = assets.map((asset) => ({
    underlying: toCurrency(asset.underlying),
    collaterals: asset.collaterals.map((collateral) => ({
      underlying: toCurrency(collateral.underlying),
      substitute: toCurrency(collateral.substitute),
      liquidationThreshold: collateral.liquidationThreshold,
      liquidationTargetLtv: collateral.liquidationTargetLtv,
    })),
    substitutes: asset.substitutes.map((substitute) => toCurrency(substitute)),
  }))

  return result
}

export function fetchCurrencies(assets: Asset[]) {
  return Object.values<Currency>(
    assets
      .reduce(
        (acc: Currency[], asset) => [
          ...acc,
          asset.underlying,
          ...asset.substitutes.map((substitute) => substitute),
          ...asset.collaterals.map((collateral) => collateral.underlying),
          ...asset.collaterals.map((collateral) => collateral.substitute),
        ],
        [],
      )
      .reduce((acc: { [key in `0x${string}`]: Currency }, currency) => {
        return {
          ...acc,
          [currency.address]: currency,
        }
      }, {}),
  )
}
