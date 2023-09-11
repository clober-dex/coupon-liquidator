import { getAddress, PublicClient } from 'viem'

import { Asset } from '../model/asset'
import { Currency } from '../model/currency'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const GAS_PROTECTION = 2000000000n
const isEthereum = (currency: Currency) => {
  return [
    '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    '0x4284186b053ACdBA28E8B26E99475d891533086a',
  ]
    .map((address) => getAddress(address))
    .includes(getAddress(currency.address))
}

export async function fetchBalances(
  publicClient: PublicClient,
  account: `0x${string}`,
  assets: Asset[],
): Promise<{ [address: `0x${string}`]: bigint }> {
  const balance = await publicClient.getBalance({
    address: account,
  })
  const results = await publicClient.multicall({
    contracts: assets.map((asset) => ({
      address: asset.underlying.address,
      abi: _abi,
      functionName: 'balanceOf',
      args: [account],
    })),
  })
  return results.reduce((acc, { result }, i) => {
    const asset = assets[i]
    return {
      ...acc,
      [asset.underlying.address]: isEthereum(asset.underlying)
        ? (result ?? 0n) + (balance - GAS_PROTECTION ?? 0n)
        : result,
    }
  }, {})
}
