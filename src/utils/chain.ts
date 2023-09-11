import { arbitrum, arbitrumGoerli } from 'viem/chains'

import { couponFinanceChain } from './dev-chain'

export type ChainID = 42161 | 421613 | 7777

const CHAIN_ID: ChainID = Number(process.env.CHAIN_ID) as ChainID

export const chain = {
  [42161]: arbitrum,
  [421613]: arbitrumGoerli,
  [7777]: couponFinanceChain,
}[CHAIN_ID]
