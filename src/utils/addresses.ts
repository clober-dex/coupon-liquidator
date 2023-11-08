import { ChainID } from './chain'

const CHAIN_ID: ChainID = Number(process.env.CHAIN_ID) as ChainID

export const CONTRACT_ADDRESSES: {
  CouponOracle: `0x${string}`
  LoanPositionManager: `0x${string}`
  LoanPositionLiquidateHelper: `0x${string}`
  CouponLiquidator: `0x${string}`
} = {
  [42161]: {
    CouponOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionManager:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionLiquidateHelper:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    CouponLiquidator:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [421613]: {
    CouponOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionManager:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionLiquidateHelper:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    CouponLiquidator:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [7777]: {
    CouponOracle: '0xbaF0FF012884917b1FCb2222d6e6D75Eb795D23B' as `0x${string}`,
    LoanPositionManager:
      '0xa87224d1F96cA183CE119f94b6e48035c93B05Fb' as `0x${string}`,
    LoanPositionLiquidateHelper:
      '0x0000000000000000000000000000000000000001' as `0x${string}`,
    CouponLiquidator:
      '0x8EAEDF34bd1fcbb5A81CAD76FA2B3DFEF616a317' as `0x${string}`,
  },
}[CHAIN_ID]
