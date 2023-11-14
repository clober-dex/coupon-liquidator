import { getAddress } from 'viem'

import { ChainID } from './chain'

const CHAIN_ID: ChainID = Number(process.env.CHAIN_ID) as ChainID

export const CONTRACT_ADDRESSES: {
  CouponOracle: `0x${string}`
  LoanPositionManager: `0x${string}`
  CouponLiquidator: `0x${string}`
} = {
  [42161]: {
    CouponOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionManager:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    CouponLiquidator:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [421613]: {
    CouponOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionManager:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    CouponLiquidator:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [7777]: {
    CouponOracle: '0x8B0f27aDf87E037B53eF1AADB96bE629Be37CeA8' as `0x${string}`,
    LoanPositionManager:
      '0xA0D476c6A39beA239749C566a02343e5584Ec200' as `0x${string}`,
    CouponLiquidator:
      '0x9fd2e135C2f9401fCaBEDFD13dA439C91B96C95d' as `0x${string}`,
  },
}[CHAIN_ID]

export const isEtherAddress = (address: `0x${string}`) => {
  return [
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    '0x4284186b053ACdBA28E8B26E99475d891533086a',
  ]
    .map((ethAddr) => getAddress(ethAddr))
    .includes(getAddress(address))
}
