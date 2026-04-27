'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PrintView from '@/components/PrintView'
import type { Transaction } from '@/lib/types'

export default function PrintPage() {
  const [rows, setRows] = useState<Transaction[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchRows() {
    setLoading(true)
    const res = await fetch('/api/transactions')
    const all: Transaction[] = await res.json()

    let filtered = all
    if (from) filtered = filtered.filter((r) => r.거래일자 >= from)
    if (to) filtered = filtered.filter((r) => r.거래일자 <= to)
    if (search) filtered = filtered.filter((r) => r.거래처명.includes(search))

    setRows(filtered.sort((a, b) => a.거래일자.localeCompare(b.거래일자)))
    setLoading(false)
  }

  useEffect(() => { fetchRows() }, [from, to, search])

  const title = [
    from || to ? `${from || '처음'} ~ ${to || '현재'}` : '',
    search ? `거래처: ${search}` : '',
  ].filter(Boolean).join(' / ')

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="no-print">
        <header className="bg-orange-600 text-white px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-2xl">←</Link>
          <h1 className="text-lg font-bold">거래내역서 출력</h1>
        </header>

        <div className="px-4 py-4 bg-white border-b space-y-3">
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-500 w-10">기간</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 border rounded-lg px-2 py-2 text-sm" />
            <span className="text-gray-400">~</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 border rounded-lg px-2 py-2 text-sm" />
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-500 w-10">거래처</label>
            <input
              type="text"
              placeholder="전체"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border rounded-lg px-2 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => window.print()}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-bold text-base"
          >
            🖨️ 인쇄 / PDF 저장
          </button>
        </div>

        <div className="px-4 py-3 text-sm text-gray-500">
          {loading ? '불러오는 중...' : `총 ${rows.length}건 · ${rows.reduce((s, r) => s + r.중량kg, 0).toLocaleString()}kg · ₩${rows.reduce((s, r) => s + r.금액, 0).toLocaleString()}`}
        </div>
      </div>

      <div className="overflow-x-auto">
        <PrintView transactions={rows} title={title} />
      </div>
    </div>
  )
}
