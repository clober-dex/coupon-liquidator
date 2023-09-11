import { Currency } from '../model/currency'
import { Collateral } from '../model/collateral'

import { LIQUIDATION_TARGET_LTV_PRECISION } from './bigint'
import { BigDecimal, dollarValue } from './numbers'

export function calculateIsOverLTVThreshold(
  debtAmount: bigint,
  debtPrice: BigDecimal,
  debt: Currency,
  collateralAmount: bigint,
  collateralPrice: BigDecimal,
  collateral: Collateral,
): boolean {
  if (!debtPrice || !collateralPrice) {
    throw new Error('Missing price')
  }
  // debtAmount * debtPrice / collateralAmount * collateralPrice > collateral.liquidationThreshold
  return (
    debtAmount *
      10n ** BigInt(18 - debt.decimals) *
      debtPrice.value *
      LIQUIDATION_TARGET_LTV_PRECISION >
    collateralAmount *
      10n ** BigInt(18 - collateral.underlying.decimals) *
      collateralPrice.value *
      collateral.liquidationThreshold
  )
}

export function calculateCurrentLTV(
  debtAmount: bigint,
  debtPrice: BigDecimal,
  debt: Currency,
  collateralAmount: bigint,
  collateralPrice: BigDecimal,
  collateral: Collateral,
): number {
  return dollarValue(debtAmount, debt.decimals, debtPrice)
    .times(LIQUIDATION_TARGET_LTV_PRECISION.toString())
    .times(100)
    .div(
      dollarValue(
        collateralAmount,
        collateral.underlying.decimals,
        collateralPrice,
      ),
    )
    .div(collateral.liquidationThreshold.toString())
    .toNumber()
}
