import { PublicClient } from 'viem'

import { CONTRACT_ADDRESSES } from './addresses'
import { BigDecimal } from './numbers'

const _abi = [
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address[]',
        name: 'assets',
        type: 'address[]',
      },
    ],
    name: 'getAssetsPrices',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'prices',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export async function fetchPrices(
  publicClient: PublicClient,
  currencyAddresses: `0x${string}`[],
): Promise<{
  [key in `0x${string}`]: BigDecimal
}> {
  const [{ result: prices }, { result: decimals }] =
    await publicClient.multicall({
      contracts: [
        {
          address: CONTRACT_ADDRESSES.CouponOracle,
          abi: _abi,
          functionName: 'getAssetsPrices',
          args: [currencyAddresses],
        },
        {
          address: CONTRACT_ADDRESSES.CouponOracle,
          abi: _abi,
          functionName: 'decimals',
        },
      ],
    })

  if (!prices || !decimals) {
    return {}
  }

  return prices.reduce((acc, value, i) => {
    const currencyAddress = currencyAddresses[i]
    return {
      ...acc,
      [currencyAddress]: { value, decimals },
    }
  }, {})
}
