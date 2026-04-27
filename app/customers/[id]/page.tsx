'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { CustomerSummary, PriceRule } from '@/lib/types'

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [summary, setSummary] = useState<CustomerSummary | null>(null)
  const [priceRules, setPriceRules] = useState<PriceRule[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [s, p] = await Promise.all([
      fetch(`/api/customers/${id}/summary`).then(r => r.json()),
      fetch(`/api/customers/${id}/price-rules`).then(r => r.json()),
    ])
    setSummary(s)
    setPriceRules(p)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function deleteRule(ruleId: number) {
    await fetch(`/api/customers/${id}/price-rules`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ruleId }),
    })
    load()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400 text-lg">불러오는 중...</div>
  if (!summary) return <div className="min-h-screen flex items-center justify-center text-gray-400">거래처 없음</div>

  const cashAmount = summary.totalAmount - summary.totalCredit

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-700 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/customers" className="text-3xl leading-none font-bold">←</Link>
        <h1 className="text-xl font-bold">{summary.name}</h1>
        <Link href="/input" className="ml-auto bg-white/20 px-3 py-2 rounded-xl text-sm font-bold">+ 거래입력</Link>
      </header>

      {/* 미수금 카드 */}
      <div className="m-4 rounded-2xl overflow-hidden shadow">
        {summary.totalCredit > 0 ? (
          <div className="bg-orange-500 text-white p-5">
            <p className="text-sm font-medium opacity-80">미수금 (외상 미결제)</p>
            <p className="text-4xl font-bold mt-1">₩{summary.totalCredit.toLocaleString()}</p>
            <p className="text-sm opacity-70 mt-1">전체 거래 ₩{summary.totalAmount.toLocaleString()} 중</p>
          </div>
        ) : summary.totalAmount > 0 ? (
          <div className="bg-green-500 text-white p-5">
            <p className="text-sm font-medium opacity-80">미수금</p>
            <p className="text-3xl font-bold mt-1">없음 ✓</p>
            <p className="text-sm opacity-70 mt-1">전체 거래 ₩{summary.totalAmount.toLocaleString()} 모두 결제 완료</p>
          </div>
        ) : (
          <div className="bg-gray-400 text-white p-5">
            <p className="text-sm opacity-80">아직 거래 없음</p>
            <p className="text-2xl font-bold mt-1">거래를 시작하세요</p>
          </div>
        )}
        {summary.totalAmount > 0 && (
          <div className="bg-white grid grid-cols-2 divide-x">
            <div className="p-4 text-center">
              <p className="text-xs text-gray-500">총 거래금액</p>
              <p className="text-lg font-bold text-gray-900 mt-1">₩{summary.totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-gray-500">현금·계좌 결제</p>
              <p className="text-lg font-bold text-blue-600 mt-1">₩{cashAmount.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>

      {/* 계약단가 */}
      {priceRules.length > 0 && (
        <div className="mx-4 mb-4">
          <h2 className="font-bold text-gray-700 mb-2 px-1">📋 계약단가</h2>
          <div className="bg-white rounded-2xl overflow-hidden shadow divide-y">
            {priceRules.map(r => (
              <div key={r.id} className="flex items-center justify-between px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">{r.cutKey}</p>
                  <p className="text-xl font-bold text-green-700">₩{r.price.toLocaleString()}/kg</p>
                </div>
                <button onClick={() => deleteRule(r.id)}
                  className="text-red-500 border-2 border-red-200 rounded-xl px-4 py-2.5 font-bold text-sm active:bg-red-50">
                  삭제
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 최근 거래 */}
      <div className="mx-4 mb-8">
        <h2 className="font-bold text-gray-700 mb-2 px-1">🕐 최근 거래 ({summary.recentTransactions.length}건)</h2>
        {summary.recentTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-gray-400">
            <p className="text-lg">아직 거래가 없습니다</p>
            <Link href="/input" className="mt-3 inline-block bg-green-600 text-white px-6 py-3 rounded-2xl font-bold text-sm">
              첫 거래 입력하기
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl overflow-hidden shadow divide-y">
            {summary.recentTransactions.map(t => (
              <div key={t.id} className="px-4 py-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-gray-500">{t.거래일자} · {t.식육종류} {t.부위명}</p>
                    <p className="text-sm text-gray-500">{t.원산지} · {t.중량kg}kg · ₩{t.단가.toLocaleString()}/kg</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-base">₩{t.금액.toLocaleString()}</p>
                    {t.isCredit ? (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">💳 외상</span>
                    ) : (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">✓ 결제</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
