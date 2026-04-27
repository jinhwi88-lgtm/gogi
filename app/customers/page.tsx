'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Customer } from '@/lib/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const data = await fetch('/api/customers').then(r => r.json())
    setCustomers(data)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setAdding(true)
    setError('')
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    })
    setAdding(false)
    if (res.status === 409) { setError('이미 존재하는 거래처명입니다'); return }
    setNewName('')
    load()
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`"${name}" 거래처를 삭제하시겠습니까?\n(관련 거래 기록은 유지됩니다)`)) return
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    load()
  }

  async function handleEdit(id: number) {
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim() }),
    })
    setEditId(null)
    load()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-purple-700 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/" className="text-3xl leading-none font-bold">←</Link>
        <h1 className="text-xl font-bold">거래처 관리</h1>
        <span className="ml-auto text-purple-200 text-sm">{customers.length}개</span>
      </header>

      {/* 거래처 추가 */}
      <div className="bg-white border-b px-4 py-4">
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder="새 거래처명 입력..."
            value={newName}
            onChange={e => { setNewName(e.target.value); setError('') }}
            className="flex-1 border-2 border-gray-300 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-purple-500"
          />
          <button type="submit" disabled={adding || !newName.trim()}
            className="bg-purple-600 text-white px-5 py-3 rounded-xl font-bold text-lg disabled:opacity-40 active:bg-purple-700"
          >
            추가
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* 거래처 목록 */}
      <div className="divide-y">
        {customers.length === 0 ? (
          <p className="text-center py-16 text-gray-400 text-lg">등록된 거래처가 없습니다</p>
        ) : customers.map(c => (
          <div key={c.id} className="bg-white px-4 py-3">
            {editId === c.id ? (
              <div className="flex gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(c.id); if (e.key === 'Escape') setEditId(null) }}
                  className="flex-1 border-2 border-purple-400 rounded-xl px-3 py-2 text-lg focus:outline-none"
                />
                <button onClick={() => handleEdit(c.id)} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold">확인</button>
                <button onClick={() => setEditId(null)} className="text-gray-400 px-3 py-2 rounded-xl border">취소</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Link href={`/customers/${c.id}`} className="flex-1">
                  <p className="text-xl font-bold text-gray-900">{c.name}</p>
                  <p className="text-sm text-gray-400">탭하여 상세 보기</p>
                </Link>
                <div className="flex gap-2">
                  <button onClick={() => { setEditId(c.id); setEditName(c.name) }}
                    className="text-blue-600 border border-blue-200 rounded-lg px-3 py-2 text-sm">수정</button>
                  <button onClick={() => handleDelete(c.id, c.name)}
                    className="text-red-600 border border-red-200 rounded-lg px-3 py-2 text-sm">삭제</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
