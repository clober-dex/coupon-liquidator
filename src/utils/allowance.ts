import { PublicClient } from 'viem'

import { Currency } from '../model/currency'

const _abi = [
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
    ],
    name: 'allowance',
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

export async function fetchAllowance(
  publicClient: PublicClient,
  currency: Currency,
  userAddress: `0x${string}`,
  spenderAddress: `0x${string}`,
): Promise<bigint> {
  const allowance = await publicClient.readContract({
    address: currency.address,
    abi: _abi,
    functionName: 'allowance',
    args: [userAddress, spenderAddress],
  })
  return allowance || 0n
}
