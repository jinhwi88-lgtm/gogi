import type { OcrResult } from './types'

// TODO: Replace with real OCR API (e.g., Google Vision, Naver Clova OCR)
// TODO: After OCR, optionally call 축산물이력제 API (https://data.mafra.go.kr) to auto-fill livestock history info
export async function mockOcr(_file: File): Promise<OcrResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200))

  return {
    거래일자: new Date().toISOString().split('T')[0],
    거래처명: '대박축산',
    식육종류: '돼지고기',
    부위명: '삼겹살',
    등급: '-',
    원산지: '국내산',
    이력번호: '123456789012',
    도축장명: '-',
    중량kg: 20,
    단가: 18000,
    금액: 360000,
    비고: '',
  }
}
