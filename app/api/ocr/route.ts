import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `당신은 정육점 거래내역서 이미지를 분석하는 전문가입니다.
이미지에서 거래 데이터를 추출하여 반드시 JSON 배열만 반환하세요. 설명 텍스트 없이 JSON만.`

const USER_PROMPT = `이 이미지에서 거래 내역을 모두 추출해주세요.

반드시 아래 JSON 배열 형식으로만 응답하세요 (다른 텍스트 없이):
[
  {
    "거래일자": "YYYY-MM-DD 형식, 없으면 null",
    "거래처명": "거래처 이름, 없으면 null",
    "식육종류": "돼지고기/소고기/닭고기 등, 없으면 null",
    "부위명": "삼겹살/목살/등심 등, 없으면 null",
    "원산지": "국내산/미국산 등, 없으면 null",
    "이력번호": "이력번호 숫자, 없으면 null",
    "중량kg": 숫자 (kg 단위, 없으면 null),
    "단가": 숫자 (원 단위, 없으면 null),
    "금액": 숫자 (원 단위, 없으면 null),
    "등급": "1+/1/2 등, 없으면 null",
    "도축장명": "도축장 이름, 없으면 null",
    "비고": "기타 메모, 없으면 null"
  }
]

주의사항:
- 표에 여러 행이 있으면 각 행을 별도 객체로
- 숫자에서 콤마 제거 (1,000 → 1000)
- 날짜가 "04/01" 형식이면 올해 기준으로 변환
- 금액이 없고 중량×단가가 있으면 자동 계산
- 읽기 어려운 값은 null로 표시`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('image') as File | null
    if (!file) return NextResponse.json({ error: '이미지 없음' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mediaType = (file.type || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            { type: 'text', text: USER_PROMPT },
          ],
        },
      ],
    })

    const raw = message.content[0].type === 'text' ? message.content[0].text.trim() : ''

    // JSON 파싱 (코드블록 제거)
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

    let rows: Record<string, unknown>[]
    try {
      rows = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: 'JSON 파싱 실패', raw }, { status: 422 })
    }

    // 금액 자동 계산 및 정규화
    const normalized = rows.map((r) => {
      const weight = Number(r['중량kg']) || 0
      const price = Number(r['단가']) || 0
      const amount = r['금액'] ? Number(r['금액']) : Math.round(weight * price)
      const today = new Date().toISOString().split('T')[0]

      return {
        거래일자: r['거래일자'] ?? today,
        거래처명: r['거래처명'] ?? '',
        식육종류: r['식육종류'] ?? '',
        부위명: r['부위명'] ?? '',
        등급: r['등급'] ?? '-',
        원산지: r['원산지'] ?? '국내산',
        이력번호: r['이력번호'] ? String(r['이력번호']) : '',
        도축장명: r['도축장명'] ?? '-',
        중량kg: weight,
        단가: price,
        금액: amount,
        비고: r['비고'] ?? '',
        customerId: null,
        isCredit: false,
      }
    })

    return NextResponse.json({ rows: normalized, count: normalized.length })
  } catch (err) {
    console.error('[OCR ERROR]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
