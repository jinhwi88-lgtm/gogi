'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Home() {
  const [todaySummary, setTodaySummary] = useState<{ count: number; amount: number; credit: number } | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    fetch(`/api/transactions?date=${today}`).then(r => r.json()).then((rows: { 금액: number; isCredit: boolean }[]) => {
      setTodaySummary({
        count: rows.length,
        amount: rows.reduce((s, r) => s + r.금액, 0),
        credit: rows.reduce((s, r) => s + (r.isCredit ? r.금액 : 0), 0),
      })
    })
  }, [])

  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })

  return (
    <main className="min-h-screen bg-green-700 flex flex-col">
      <div className="px-5 pt-10 pb-4 text-white">
        <p className="text-green-200 text-sm">{today}</p>
        <h1 className="text-3xl font-bold mt-1">정육 거래장부</h1>
      </div>

      {/* 오늘 매출 카드 */}
      <div className="mx-5 mb-4 bg-white/15 rounded-2xl px-5 py-4 text-white">
        <p className="text-green-200 text-sm font-medium">오늘 매출</p>
        {todaySummary === null ? (
          <p className="text-2xl font-bold mt-1 opacity-60">집계 중...</p>
        ) : todaySummary.count === 0 ? (
          <p className="text-xl font-bold mt-1 opacity-70">오늘 거래 없음</p>
        ) : (
          <div className="flex items-end gap-4 mt-1">
            <p className="text-3xl font-bold">₩{todaySummary.amount.toLocaleString()}</p>
            <div className="mb-0.5">
              <p className="text-sm opacity-80">{todaySummary.count}건</p>
              {todaySummary.credit > 0 && (
                <p className="text-sm text-orange-300 font-bold">외상 ₩{todaySummary.credit.toLocaleString()}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 bg-gray-50 rounded-t-3xl px-5 pt-6 pb-6 space-y-3">
        <BigButton href="/input"     emoji="✏️" label="거래 직접 입력"   sub="거래처 선택 → 단가 자동 → 빠른 저장" color="bg-green-600" />
        <BigButton href="/scan"      emoji="📷" label="사진 스캔"         sub="AI가 거래내역서 자동 인식"             color="bg-blue-600" />
        <BigButton href="/customers" emoji="🏪" label="거래처 관리"       sub="미수금 확인 · 계약단가 · 거래 이력"   color="bg-purple-600" />
        <BigButton href="/list"      emoji="📋" label="거래내역 목록"     sub="날짜·거래처 검색 및 수정"              color="bg-gray-700" />
        <BigButton href="/print"     emoji="🖨️" label="거래내역서 출력"  sub="A4 양식 PDF 인쇄"                      color="bg-orange-600" />
      </div>
    </main>
  )
}

function BigButton({ href, emoji, label, sub, color }: {
  href: string; emoji: string; label: string; sub: string; color: string
}) {
  return (
    <Link href={href} className={`flex items-center gap-4 ${color} text-white rounded-2xl px-5 py-4 active:opacity-80`}>
      <span className="text-4xl">{emoji}</span>
      <div>
        <p className="text-lg font-bold">{label}</p>
        <p className="text-xs opacity-80 mt-0.5">{sub}</p>
      </div>
      <span className="ml-auto text-2xl opacity-60">›</span>
    </Link>
  )
}
