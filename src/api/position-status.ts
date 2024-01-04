import { getBuiltGraphSDK } from '../../.graphclient'
import { CHAIN_ID } from '../utils/addresses'

const { getPositionStatus } = getBuiltGraphSDK()

export async function fetchPositionStatus(): Promise<{
  totalBondPositionCount: number
  totalLoanPositionCount: number
}> {
  const { positionStatus } = await getPositionStatus(
    {
      chainId: CHAIN_ID.toString(),
    },
    {
      url: process.env.SUBGRAPH_URL,
    },
  )
  return {
    totalBondPositionCount: Number(positionStatus?.totalBondPositionCount || 0),
    totalLoanPositionCount: Number(positionStatus?.totalLoanPositionCount || 0),
  }
}
