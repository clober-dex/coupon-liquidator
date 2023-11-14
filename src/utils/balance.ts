import { PublicClient } from 'viem'

import { isEtherAddress } from './addresses'

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

export async function fetchBalances(
  publicClient: PublicClient,
  userAddress: `0x${string}`,
  currencyAddresses: `0x${string}`[],
): Promise<{ [key in `0x${string}`]: bigint }> {
  const etherBalance = await publicClient.getBalance({ address: userAddress })
  const results = await publicClient.multicall({
    contracts: currencyAddresses.map((currencyAddress) => ({
      address: currencyAddress,
      abi: _abi,
      functionName: 'balanceOf',
      args: [userAddress],
    })),
  })
  return results.reduce((acc, { result }, index) => {
    const currencyAddress = currencyAddresses[index]
    return {
      ...acc,
      [currencyAddress]: isEtherAddress(currencyAddress)
        ? (result ?? 0n) + etherBalance
        : result,
    }
  }, {})
}
