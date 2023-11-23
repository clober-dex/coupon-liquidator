import { LoanPosition } from '../model/loan-position'
import { Currency } from '../model/currency'

import { BigDecimal, formatUnits } from './numbers'

export const debug = async ({
  currencies,
  positions,
  unSafePositions,
  topRiskyPositions,
  topBorrowedPositions,
  prices,
}: {
  currencies: Currency[]
  positions: LoanPosition[]
  unSafePositions: LoanPosition[]
  topRiskyPositions: LoanPosition[]
  topBorrowedPositions: LoanPosition[]
  prices: { [address: string]: BigDecimal }
}) => {
  await sendSlackMessage(
    'debug',
    currencies.map(
      (currency) =>
        `${currency.symbol.padStart(6)}: $${formatUnits(
          prices[currency.address].value,
          prices[currency.address].decimals,
        )}`,
    ),
    'PRICES:',
  )

  await sendSlackMessage(
    'debug',
    [
      `TOTAL POSITIONS: ${positions.length} (UNSAFE: ${unSafePositions.length})`,
      ...topRiskyPositions.map(
        (position) =>
          `${position.user.toLowerCase()} debt ratio: ${position.ltv
            .toFixed(2)
            .padStart(6)}% loan: ${formatUnits(
            position.amount,
            position.underlying.decimals,
            prices[position.underlying.address],
          ).padStart(8)} ${
            position.underlying.symbol
          } collateral: ${formatUnits(
            position.collateralAmount,
            position.collateral.underlying.decimals,
            prices[position.collateral.underlying.address],
          ).padStart(8)} ${position.collateral.underlying.symbol}`,
      ),
    ],
    `TOP ${topRiskyPositions.length} RISKY POSITIONS:`,
  )

  await sendSlackMessage(
    'debug',
    [
      `TOTAL POSITIONS: ${positions.length} (UNSAFE: ${unSafePositions.length})`,
      ...topBorrowedPositions.map(
        (position) =>
          `${position.user.toLowerCase()} debt ratio: ${position.ltv
            .toFixed(2)
            .padStart(6)}% loan: ${formatUnits(
            position.amount,
            position.underlying.decimals,
            prices[position.underlying.address],
          ).padStart(8)} ${
            position.underlying.symbol
          } collateral: ${formatUnits(
            position.collateralAmount,
            position.collateral.underlying.decimals,
            prices[position.collateral.underlying.address],
          ).padStart(8)} ${position.collateral.underlying.symbol}`,
      ),
    ],
    `TOP ${topBorrowedPositions.length} BORROWED POSITIONS:`,
  )
}

export async function sendSlackMessage(
  type: 'info' | 'debug',
  rows: string[],
  title?: string,
) {
  if (type === 'info' && !process.env.SLACK_INFO_WEBHOOK_URL) {
    throw new Error('SLACK_INFO_WEBHOOK_URL is not defined')
  }
  if (type === 'debug' && !process.env.SLACK_DEBUG_WEBHOOK_URL) {
    throw new Error('SLACK_DEBUG_WEBHOOK_URL is not defined')
  }
  const url =
    (type === 'info'
      ? process.env.SLACK_INFO_WEBHOOK_URL
      : type === 'debug'
      ? process.env.SLACK_DEBUG_WEBHOOK_URL
      : '') || ''
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: title
        ? title + '\n```\n' + rows.join('\n') + '\n```'
        : '```\n' + rows.join('\n') + '\n```',
    }),
  })
}
