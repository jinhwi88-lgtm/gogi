'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Transaction } from '@/lib/types'

export default function ListPage() {
  const [rows, setRows] = useState<Transaction[]>([])
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [editRow, setEditRow] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  async function fetchRows() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (date) params.set('date', date)
    const res = await fetch(`/api/transactions?${params}`)
    setRows(await res.json())
    setLoading(false)
  }

  useEffect(() => { fetchRows() }, [search, date])

  async function handleDelete(id: number) {
    if (!confirm('삭제하시겠습니까?')) return
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
    fetchRows()
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!editRow) return
    await fetch(`/api/transactions/${editRow.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editRow),
    })
    setEditRow(null)
    fetchRows()
  }

  const totalKg = rows.reduce((s, r) => s + r.중량kg, 0)
  const totalAmt = rows.reduce((s, r) => s + r.금액, 0)
  const totalCredit = rows.reduce((s, r) => s + (r.isCredit ? r.금액 : 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-700 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-3xl leading-none font-bold">←</Link>
        <h1 className="text-lg font-bold">거래내역 목록</h1>
        <Link href="/input" className="ml-auto bg-green-600 text-white text-sm px-4 py-2 rounded-xl font-bold">+ 추가</Link>
      </header>

      {/* 검색 */}
      <div className="px-4 py-3 bg-white border-b flex gap-2">
        <input type="text" placeholder="거래처명 검색"
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-base focus:outline-none focus:border-green-400"
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)}
          className="border-2 border-gray-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none"
        />
        {(search || date) && (
          <button onClick={() => { setSearch(''); setDate('') }}
            className="text-gray-400 text-lg px-2">✕</button>
        )}
      </div>

      {/* 합계 */}
      {rows.length > 0 && (
        <div className="px-4 py-2.5 bg-yellow-50 border-b flex gap-4 text-sm">
          <span>총 <b>{rows.length}</b>건</span>
          <span><b>{totalKg.toLocaleString()}</b> kg</span>
          <span className="text-red-600 font-bold">₩{totalAmt.toLocaleString()}</span>
          {totalCredit > 0 && (
            <span className="text-orange-600 font-bold">외상 ₩{totalCredit.toLocaleString()}</span>
          )}
        </div>
      )}

      {/* 목록 */}
      <div className="divide-y">
        {loading ? (
          <p className="text-center py-12 text-gray-400">불러오는 중...</p>
        ) : rows.length === 0 ? (
          <p className="text-center py-12 text-gray-400">거래내역이 없습니다</p>
        ) : rows.map(row => (
          <div key={row.id} className="bg-white px-4 py-4">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                {/* 거래처명 — customerId 있으면 상세 링크 */}
                {row.customerId ? (
                  <button onClick={() => router.push(`/customers/${row.customerId}`)}
                    className="font-bold text-gray-900 text-base text-left underline decoration-dotted">
                    {row.거래처명}
                  </button>
                ) : (
                  <p className="font-bold text-gray-900 text-base">{row.거래처명}</p>
                )}
                <p className="text-sm text-gray-500 mt-0.5">
                  {row.거래일자} · {row.식육종류} {row.부위명}
                </p>
                <p className="text-sm text-gray-500">
                  {row.원산지} · {row.중량kg}kg · ₩{row.단가.toLocaleString()}/kg
                </p>
                {/* 외상 배지 */}
                {row.isCredit && (
                  <span className="inline-block mt-1 text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-bold">
                    💳 외상
                  </span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold text-red-600">₩{row.금액.toLocaleString()}</p>
                {/* 크게 키운 버튼 */}
                <div className="flex gap-2 mt-2">
                  <button onClick={() => setEditRow({ ...row })}
                    className="text-sm text-blue-600 border-2 border-blue-200 rounded-xl px-4 py-2.5 font-bold active:bg-blue-50">
                    수정
                  </button>
                  <button onClick={() => handleDelete(row.id)}
                    className="text-sm text-red-600 border-2 border-red-200 rounded-xl px-4 py-2.5 font-bold active:bg-red-50">
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSV */}
      {rows.length > 0 && (
        <div className="px-4 py-4">
          <button onClick={() => downloadCsv(rows)}
            className="w-full border-2 border-gray-300 text-gray-600 py-3 rounded-2xl text-sm font-medium">
            📥 CSV 다운로드
          </button>
        </div>
      )}

      {/* 수정 모달 — 큰 버튼 UX */}
      {editRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[90vh] overflow-y-auto rounded-t-3xl p-5 pb-10">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-bold text-xl">거래 수정</h2>
              <button onClick={() => setEditRow(null)} className="text-gray-400 text-3xl leading-none">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              {/* 날짜 */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">거래일자</label>
                <input type="date" value={editRow.거래일자}
                  onChange={e => setEditRow({ ...editRow, 거래일자: e.target.value })}
                  className={modalInput} />
              </div>
              {/* 거래처명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">거래처명</label>
                <input type="text" value={editRow.거래처명}
                  onChange={e => setEditRow({ ...editRow, 거래처명: e.target.value })}
                  className={modalInput} />
              </div>
              {/* 식육종류 / 부위 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">식육종류</label>
                  <input type="text" value={editRow.식육종류}
                    onChange={e => setEditRow({ ...editRow, 식육종류: e.target.value })}
                    className={modalInput} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">부위명</label>
                  <input type="text" value={editRow.부위명}
                    onChange={e => setEditRow({ ...editRow, 부위명: e.target.value })}
                    className={modalInput} />
                </div>
              </div>
              {/* 원산지 */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">원산지</label>
                <input type="text" value={editRow.원산지}
                  onChange={e => setEditRow({ ...editRow, 원산지: e.target.value })}
                  className={modalInput} />
              </div>
              {/* 중량 / 단가 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">중량 (kg)</label>
                  <input type="number" step="0.1" value={editRow.중량kg}
                    onChange={e => {
                      const 중량kg = parseFloat(e.target.value) || 0
                      setEditRow({ ...editRow, 중량kg, 금액: Math.round(중량kg * editRow.단가) })
                    }}
                    className={modalInput} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">단가 (원/kg)</label>
                  <input type="number" value={editRow.단가}
                    onChange={e => {
                      const 단가 = parseInt(e.target.value) || 0
                      setEditRow({ ...editRow, 단가, 금액: Math.round(editRow.중량kg * 단가) })
                    }}
                    className={modalInput} />
                </div>
              </div>
              {/* 금액 */}
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl py-3 px-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">금액</p>
                <p className="text-2xl font-bold text-red-600">₩{editRow.금액.toLocaleString()}</p>
              </div>
              {/* 외상 토글 */}
              <button type="button"
                onClick={() => setEditRow({ ...editRow, isCredit: !editRow.isCredit })}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 ${editRow.isCredit ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-200'}`}>
                <span className={`font-bold ${editRow.isCredit ? 'text-orange-600' : 'text-gray-500'}`}>
                  {editRow.isCredit ? '💳 외상 (미수금)' : '💵 외상 없음'}
                </span>
                <div className={`w-12 h-7 rounded-full flex items-center px-1 ${editRow.isCredit ? 'bg-orange-400 justify-end' : 'bg-gray-300 justify-start'}`}>
                  <div className="w-5 h-5 bg-white rounded-full shadow" />
                </div>
              </button>

              <button type="submit"
                className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg">
                수정 완료
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const modalInput = 'w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-green-500'

function downloadCsv(rows: Transaction[]) {
  const headers = ['id', '거래일자', '거래처명', '식육종류', '부위명', '등급', '원산지', '이력번호', '도축장명', '중량kg', '단가', '금액', '외상', '비고']
  const csv = [
    '﻿' + headers.join(','),
    ...rows.map(r => [
      r.id, r.거래일자, r.거래처명, r.식육종류, r.부위명, r.등급,
      r.원산지, r.이력번호, r.도축장명, r.중량kg, r.단가, r.금액,
      r.isCredit ? 'Y' : 'N', r.비고
    ].map(v => `"${v}"`).join(',')),
  ].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  a.download = `거래내역_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
}
