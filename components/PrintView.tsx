'use client'

import type { Transaction } from '@/lib/types'

interface Props {
  transactions: Transaction[]
  title?: string
}

function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '' || v === 0) return '-'
  return String(v)
}

function money(n: number): string {
  if (!n) return '-'
  return n.toLocaleString()
}

export default function PrintView({ transactions, title }: Props) {
  const totalKg = transactions.reduce((s, t) => s + t.중량kg, 0)
  const totalAmt = transactions.reduce((s, t) => s + t.금액, 0)

  return (
    <div className="print-area bg-white p-8 text-sm" style={{ fontFamily: 'Arial, "Malgun Gothic", sans-serif' }}>
      {/* 헤더 */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold tracking-widest">식 육 거 래 내 역 서</h1>
        {title && <p className="text-gray-600 mt-1 text-sm">{title}</p>}
        <p className="text-gray-500 text-xs mt-1">출력일: {new Date().toLocaleDateString('ko-KR')}</p>
      </div>

      {/* 합계 요약 */}
      <div className="flex justify-end gap-6 mb-3 text-sm">
        <span>총 <b>{transactions.length}</b>건</span>
        <span>총 중량 <b>{totalKg.toLocaleString()}</b> kg</span>
        <span>총 금액 <b className="text-red-600">₩{totalAmt.toLocaleString()}</b></span>
      </div>

      {/* 표 */}
      <table className="w-full border-collapse" style={{ fontSize: '11px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f0f0f0' }}>
            {[
              ['No.', '4%'],
              ['거래연월일', '9%'],
              ['거래처', '10%'],
              ['식육종류', '9%'],
              ['부위명', '9%'],
              ['원산지', '8%'],
              ['등급', '5%'],
              ['중량(kg)', '8%'],
              ['단가(원)', '9%'],
              ['금액(원)', '10%'],
              ['이력번호', '11%'],
              ['도축장명', '8%'],
            ].map(([h, w]) => (
              <th
                key={h}
                style={{ width: w, border: '1px solid #999', padding: '6px 4px', textAlign: 'center', whiteSpace: 'nowrap' }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t, i) => (
            <tr key={t.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa' }}>
              <td style={tdStyle('center')}>{i + 1}</td>
              <td style={tdStyle('center')}>{val(t.거래일자)}</td>
              <td style={tdStyle('center')}>{val(t.거래처명)}</td>
              <td style={tdStyle('center')}>{val(t.식육종류)}</td>
              <td style={tdStyle('center')}>{val(t.부위명)}</td>
              <td style={tdStyle('center')}>{val(t.원산지)}</td>
              <td style={tdStyle('center')}>{val(t.등급)}</td>
              <td style={tdStyle('right')}>{t.중량kg ? t.중량kg.toLocaleString() : '-'}</td>
              <td style={tdStyle('right')}>{money(t.단가)}</td>
              <td style={{ ...tdStyle('right'), color: '#c00', fontWeight: 'bold' }}>{money(t.금액)}</td>
              <td style={tdStyle('center')}>{val(t.이력번호)}</td>
              <td style={tdStyle('center')}>{val(t.도축장명)}</td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={12} style={{ border: '1px solid #999', padding: '16px', textAlign: 'center', color: '#aaa' }}>
                거래내역 없음
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: '#fffde7', fontWeight: 'bold' }}>
            <td colSpan={7} style={{ ...tdStyle('center'), fontWeight: 'bold' }}>합 계</td>
            <td style={{ ...tdStyle('right'), fontWeight: 'bold' }}>{totalKg.toLocaleString()} kg</td>
            <td style={tdStyle('center')}></td>
            <td style={{ ...tdStyle('right'), color: '#c00', fontWeight: 'bold' }}>₩{totalAmt.toLocaleString()}</td>
            <td colSpan={2} style={tdStyle('center')}></td>
          </tr>
        </tfoot>
      </table>

      {/* 서명란 */}
      <div className="flex justify-end mt-8 gap-8 text-sm">
        <div className="text-center">
          <p className="border-b border-gray-400 pb-1 mb-1 w-32">공급자 (인)</p>
          <p className="text-gray-500 text-xs">사업자번호:</p>
        </div>
        <div className="text-center">
          <p className="border-b border-gray-400 pb-1 mb-1 w-32">공급받는자 (인)</p>
          <p className="text-gray-500 text-xs">사업자번호:</p>
        </div>
      </div>
    </div>
  )
}

function tdStyle(align: 'left' | 'center' | 'right'): React.CSSProperties {
  return {
    border: '1px solid #999',
    padding: '5px 4px',
    textAlign: align,
  }
}
