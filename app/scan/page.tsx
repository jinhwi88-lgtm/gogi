'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { Customer, TransactionInput } from '@/lib/types'

type OcrRow = TransactionInput & { _checked: boolean }

export default function ScanPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [rows, setRows] = useState<OcrRow[]>([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  const [customers, setCustomers] = useState<Customer[]>([])

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  // 거래처명으로 customerId 매칭
  function matchCustomerId(name: string): number | null {
    if (!name) return null
    const matched = customers.find(c => c.name === name.trim())
    return matched ? matched.id : null
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setRows([])
    setError('')
    setSavedCount(0)
    setScanning(true)

    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await fetch('/api/ocr', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '인식 실패')
      // 거래처명으로 customerId 자동 연결
      setRows((data.rows as TransactionInput[]).map(r => ({
        ...r,
        customerId: matchCustomerId(r.거래처명),
        _checked: true,
      })))
    } catch (err) {
      setError(String(err))
    } finally {
      setScanning(false)
    }
  }

  function toggle(i: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, _checked: !r._checked } : r))
  }

  function updateCell(i: number, key: keyof TransactionInput, value: string | number) {
    setRows(prev => prev.map((r, idx) => {
      if (idx !== i) return r
      const next = { ...r, [key]: value }
      // 거래처명 변경 시 customerId 재매칭
      if (key === '거래처명') next.customerId = matchCustomerId(String(value))
      if (key === '중량kg' || key === '단가') {
        next.금액 = Math.round(Number(next.중량kg) * Number(next.단가))
      }
      return next
    }))
  }

  async function handleSaveAll() {
    const selected = rows.filter(r => r._checked)
    if (selected.length === 0) return
    setSaving(true)
    let count = 0
    for (const row of selected) {
      const { _checked, ...data } = row
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) count++
    }
    setSavedCount(count)
    setRows([])
    setPreview(null)
    setSaving(false)
  }

  const selectedCount = rows.filter(r => r._checked).length

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-3xl leading-none font-bold">←</Link>
        <h1 className="text-xl font-bold">사진 스캔 (AI 자동인식)</h1>
      </header>

      <div className="px-4 py-5 space-y-5">
        {savedCount > 0 && (
          <div className="bg-green-100 border-2 border-green-400 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">✅ {savedCount}건 저장 완료!</p>
            <button onClick={() => setSavedCount(0)} className="mt-2 text-green-600 text-sm underline">다시 스캔하기</button>
          </div>
        )}

        {rows.length === 0 && savedCount === 0 && (
          <>
            {preview ? (
              <div className="relative rounded-2xl overflow-hidden bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="업로드 이미지" className="w-full object-contain max-h-72" />
                {scanning && (
                  <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white gap-3">
                    <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    <p className="text-lg font-bold">Claude AI 분석 중...</p>
                    <p className="text-sm opacity-70">거래 내역을 읽고 있습니다</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* 카메라로 찍기 */}
                <button onClick={() => cameraRef.current?.click()}
                  className="w-full h-36 border-2 border-blue-400 rounded-2xl flex flex-col items-center justify-center text-blue-600 bg-blue-50 active:bg-blue-100 gap-2">
                  <span className="text-5xl">📷</span>
                  <span className="text-lg font-bold">카메라로 찍기</span>
                  <span className="text-xs text-gray-400">지금 바로 촬영</span>
                </button>
                {/* 갤러리에서 선택 */}
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-28 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-500 bg-gray-50 active:bg-gray-100 gap-2">
                  <span className="text-4xl">🖼️</span>
                  <span className="text-base font-bold">갤러리에서 선택</span>
                  <span className="text-xs text-gray-400">기존에 찍어둔 사진</span>
                </button>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-300 rounded-xl p-4 text-red-700">
                <p className="font-bold">인식 실패</p>
                <p className="text-sm mt-1">{error}</p>
                <button onClick={() => { setError(''); setPreview(null) }} className="mt-2 text-sm underline">다시 시도</button>
              </div>
            )}
            {/* 카메라 전용 */}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
            {/* 갤러리 전용 */}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </>
        )}

        {rows.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-900">인식 결과 {rows.length}건</p>
                <p className="text-sm text-gray-500">내용 확인 후 저장하세요</p>
              </div>
              <button onClick={() => { setRows([]); setPreview(null) }} className="text-sm text-gray-400 border rounded-lg px-3 py-1.5">다시 스캔</button>
            </div>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="원본" className="w-full h-28 object-cover rounded-xl" />
            )}

            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className={`bg-white rounded-2xl border-2 ${row._checked ? 'border-green-400' : 'border-gray-200'} overflow-hidden`}>
                  <div className={`flex items-center justify-between px-4 py-3 ${row._checked ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <button type="button" onClick={() => toggle(i)} className="flex items-center gap-2 flex-1">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${row._checked ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}>
                        {row._checked && '✓'}
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-gray-900">
                          {row.거래처명 || '(거래처 없음)'} · {row.부위명 || row.식육종류 || '(품목 없음)'}
                        </p>
                        {/* 거래처 연결 상태 */}
                        {row.customerId ? (
                          <p className="text-xs text-green-600">✓ 등록된 거래처 연결됨</p>
                        ) : row.거래처명 ? (
                          <p className="text-xs text-orange-500">미등록 거래처 (저장 후 수동 연결 필요)</p>
                        ) : null}
                      </div>
                    </button>
                    <span className={`text-lg font-bold ${row._checked ? 'text-red-600' : 'text-gray-400'}`}>
                      ₩{(row.금액 || 0).toLocaleString()}
                    </span>
                  </div>

                  {row._checked && (
                    <div className="px-4 py-3 grid grid-cols-2 gap-3">
                      {([['거래일자', 'date'], ['거래처명', 'text'], ['식육종류', 'text'], ['부위명', 'text'], ['원산지', 'text'], ['이력번호', 'text']] as [keyof TransactionInput, string][]).map(([field, type]) => (
                        <div key={field}>
                          <label className="text-xs text-gray-500 block mb-0.5">{field}</label>
                          <input type={type} value={String(row[field] ?? '')}
                            onChange={e => updateCell(i, field, e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                        </div>
                      ))}
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">중량 (kg)</label>
                        <input type="number" step="0.1" value={row.중량kg || ''}
                          onChange={e => updateCell(i, '중량kg', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 block mb-0.5">단가 (원/kg)</label>
                        <input type="number" value={row.단가 || ''}
                          onChange={e => updateCell(i, '단가', parseInt(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-400" />
                      </div>
                      <div className="col-span-2 bg-red-50 rounded-xl px-3 py-2 text-right">
                        <span className="text-xl font-bold text-red-600">₩{(row.금액 || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button onClick={handleSaveAll} disabled={saving || selectedCount === 0}
              className="w-full py-5 bg-green-600 text-white text-xl font-bold rounded-2xl disabled:opacity-40 active:bg-green-700">
              {saving ? '저장 중...' : `💾 선택한 ${selectedCount}건 저장하기`}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
