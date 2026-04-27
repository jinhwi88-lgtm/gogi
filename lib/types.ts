export interface Transaction {
  id: number
  거래일자: string
  거래처명: string
  식육종류: string
  부위명: string
  등급: string
  원산지: string
  이력번호: string
  도축장명: string
  중량kg: number
  단가: number
  금액: number
  비고: string
  생성일: string
  customerId: number | null
  isCredit: boolean
}

export type TransactionInput = Omit<Transaction, 'id' | '생성일'>

export interface OcrResult extends Omit<TransactionInput, 'customerId' | 'isCredit'> {}

export interface Customer {
  id: number
  name: string
  createdAt: string
}

export interface PriceRule {
  id: number
  customerId: number
  cutKey: string   // "식육종류/부위명" 형태
  price: number
  updatedAt: string
}

export interface CustomerSummary extends Customer {
  totalAmount: number
  totalCredit: number
  recentTransactions: Transaction[]
}
