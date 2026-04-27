'use client'

import TransactionForm from '@/components/TransactionForm'
import type { TransactionInput } from '@/lib/types'
import Link from 'next/link'

export default function InputPage() {
  async function handleSave(data: TransactionInput) {
    const res = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('저장 실패')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-3xl leading-none font-bold">←</Link>
        <h1 className="text-xl font-bold">거래 입력</h1>
        <Link href="/list" className="ml-auto text-sm bg-white/20 px-3 py-1.5 rounded-lg">목록 보기</Link>
      </header>
      <div className="px-4 py-5 pb-10">
        <TransactionForm onSave={handleSave} submitLabel="💾 저장하기" resetOnSave />
      </div>
    </div>
  )
}
