import { ChainID } from './chain'

const CHAIN_ID: ChainID = Number(process.env.CHAIN_ID) as ChainID

export const CONTRACT_ADDRESSES: {
  CouponOracle: `0x${string}`
  LoanPositionManager: `0x${string}`
  LoanPositionLiquidateHelper: `0x${string}`
} = {
  [42161]: {
    CouponOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionManager:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionLiquidateHelper:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [421613]: {
    CouponOracle: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionManager:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
    LoanPositionLiquidateHelper:
      '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
  [7777]: {
    CouponOracle: '0x8831c769874fF23ED5DF0daacfD84Cc147335506' as `0x${string}`,
    LoanPositionManager:
      '0xE0dBCB42CCAc63C949cE3EF879A647DDb662916d' as `0x${string}`,
    LoanPositionLiquidateHelper:
      '0x0000000000000000000000000000000000000001' as `0x${string}`,
  },
}[CHAIN_ID]
