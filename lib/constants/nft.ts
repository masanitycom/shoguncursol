export const NFT_CONSTANTS = {
  MAX_TOTAL_PROFIT_PERCENTAGE: 300,
  BUSINESS_DAYS: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
  DEFAULT_DAILY_RATE: 0.5,
  MIN_PURCHASE_AMOUNT: 100000
} as const

export const NFT_ERROR_MESSAGES = {
  EXCEEDED_MAX_PROFIT: '利益が上限に達しました',
  INVALID_PURCHASE_DATE: '購入日が無効です',
  INSUFFICIENT_AMOUNT: '最低購入金額を下回っています'
} as const 