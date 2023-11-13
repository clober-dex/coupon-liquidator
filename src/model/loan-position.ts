import { Currency } from './currency'
import { Collateral } from './collateral'
import { Epoch } from './epoch'

export type LoanPosition = {
  id: bigint
  user: `0x${string}`
  substitute: Currency
  underlying: Currency
  collateral: Collateral
  amount: bigint
  debtUSDAmount: number
  collateralAmount: bigint
  collateralUSDAmount: number
  toEpoch: Epoch
  isOverLTVThreshold: boolean
  ltv: number
}

export async function classifyPositionByLTV(
  positions: LoanPosition[],
  rank: number = 5,
): Promise<{
  topRiskyPositions: LoanPosition[]
  topBorrowedPositions: LoanPosition[]
  overLTVPositions: LoanPosition[]
  expiredPositions: LoanPosition[]
}> {
  const currentTimestamp = Math.floor(Date.now() / 1000)
  return {
    topRiskyPositions: positions.sort((a, b) => b.ltv - a.ltv).slice(0, rank),
    topBorrowedPositions: positions
      .sort((a, b) => Number(b.debtUSDAmount) - Number(a.debtUSDAmount))
      .slice(0, rank),
    overLTVPositions: positions.filter(
      (loanPosition) => loanPosition.isOverLTVThreshold,
    ),
    expiredPositions: positions.filter(
      (loanPosition) => loanPosition.toEpoch.endTimestamp < currentTimestamp,
    ),
  }
}
