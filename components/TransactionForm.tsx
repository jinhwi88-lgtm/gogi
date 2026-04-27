'use client'

import { useEffect, useRef, useState } from 'react'
import type { Customer, PriceRule, TransactionInput } from '@/lib/types'

interface Props {
  initial?: Partial<TransactionInput>
  onSave: (data: TransactionInput) => Promise<void>
  submitLabel?: string
  resetOnSave?: boolean
}

const QUICK_식육 = ['돼지고기', '소고기', '닭고기', '오리고기']
const QUICK_부위: Record<string, string[]> = {
  돼지고기: ['삼겹살', '목살', '앞다리', '뒷다리', '등심', '갈비'],
  소고기: ['등심', '채끝', '안심', '갈비', '불고기', '국거리'],
  닭고기: ['닭가슴살', '닭다리', '닭날개', '통닭'],
  오리고기: ['오리통살', '오리훈제', '오리가슴'],
}
const QUICK_원산지 = ['국내산', '미국산', '호주산', '캐나다산']

const EMPTY: TransactionInput = {
  거래일자: new Date().toISOString().split('T')[0],
  거래처명: '',
  식육종류: '',
  부위명: '',
  등급: '-',
  원산지: '국내산',
  이력번호: '',
  도축장명: '-',
  중량kg: 0,
  단가: 0,
  금액: 0,
  비고: '',
  customerId: null,
  isCredit: false,
}

export default function TransactionForm({ initial, onSave, submitLabel = '저장', resetOnSave = false }: Props) {
  const [form, setForm] = useState<TransactionInput>({ ...EMPTY, ...initial })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  // 거래처 자동완성
  const [customers, setCustomers] = useState<Customer[]>([])
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([])
  const [customerQuery, setCustomerQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [priceRules, setPriceRules] = useState<PriceRule[]>([])

  async function loadCustomers() {
    const [all, recent] = await Promise.all([
      fetch('/api/customers').then(r => r.json()),
      fetch('/api/customers?recent=1').then(r => r.json()),
    ])
    setCustomers(all)
    setRecentCustomers(recent)
  }

  useEffect(() => { loadCustomers() }, [])

  async function selectCustomer(c: Customer) {
    setForm(prev => ({ ...prev, 거래처명: c.name, customerId: c.id }))
    setCustomerQuery(c.name)
    setShowSuggestions(false)
    const rules: PriceRule[] = await fetch(`/api/customers/${c.id}/price-rules`).then(r => r.json())
    setPriceRules(rules)
    // 부위 이미 선택됐으면 단가 자동 적용
    setForm(prev => {
      if (!prev.식육종류 || !prev.부위명) return { ...prev, customerId: c.id, 거래처명: c.name }
      const rule = rules.find(r => r.cutKey === `${prev.식육종류}/${prev.부위명}`)
      if (!rule) return { ...prev, customerId: c.id, 거래처명: c.name }
      const 단가 = rule.price
      return { ...prev, customerId: c.id, 거래처명: c.name, 단가, 금액: Math.round(prev.중량kg * 단가) }
    })
  }

  function set(key: keyof TransactionInput, value: string | number | boolean | null) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      if ((key === '부위명' || key === '식육종류') && next.customerId) {
        const rule = priceRules.find(r => r.cutKey === `${next.식육종류}/${next.부위명}`)
        if (rule) next.단가 = rule.price
      }
      if (key === '중량kg' || key === '단가') {
        next.금액 = Math.round(Number(next.중량kg) * Number(next.단가))
      }
      if ((key === '부위명' || key === '식육종류') && next.단가 && next.중량kg) {
        next.금액 = Math.round(next.중량kg * next.단가)
      }
      return next
    })
  }

  const filteredCustomers = customerQuery.trim()
    ? customers.filter(c => c.name.includes(customerQuery.trim()))
    : []

  async function registerAndSelect(name: string) {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })
    if (res.ok) {
      const newC = await res.json()
      setCustomers(prev => [...prev, newC])
      await selectCustomer(newC)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(form)
      if (resetOnSave) {
        setForm({ ...EMPTY })
        setCustomerQuery('')
        setPriceRules([])
        setShowDetail(false)
        setSaved(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        setTimeout(() => setSaved(false), 3000)
        loadCustomers() // 저장 후 최근 거래처 즉시 업데이트
      }
    } finally {
      setLoading(false)
    }
  }

  const quickParts = QUICK_부위[form.식육종류] ?? []
  const canSave = !!form.거래처명 && form.중량kg > 0 && form.단가 > 0

  return (
    <>
      {/* 저장 완료 토스트 */}
      {saved && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white font-bold text-center py-4 text-lg shadow-lg">
          ✅ 저장 완료! 다음 거래를 입력하세요
        </div>
      )}

      <form onSubmit={handleSubmit} className="pb-28">

        {/* ━━ 거래일자 ━━ */}
        <div className="px-4 pt-4 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">✓</div>
            <span className="font-bold text-gray-800">거래일자</span>
          </div>
          <div className="flex gap-2">
            {[
              { label: '오늘', value: new Date().toISOString().split('T')[0] },
              { label: '어제', value: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
            ].map(({ label, value }) => (
              <button key={label} type="button" onClick={() => set('거래일자', value)}
                className={`px-5 py-3.5 rounded-xl text-base font-bold border-2 transition-colors ${
                  form.거래일자 === value ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'
                }`}>
                {label}
              </button>
            ))}
            <input type="date" value={form.거래일자} onChange={e => set('거래일자', e.target.value)}
              className="flex-1 border-2 border-gray-300 rounded-xl px-3 text-sm focus:outline-none focus:border-green-500" />
          </div>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ① 거래처
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section label="① 거래처" done={!!form.거래처명} value={form.거래처명}>
          {/* 등록된 거래처 없을 때 온보딩 안내 */}
          {customers.length === 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-3 text-center">
              <p className="text-sm text-blue-700 font-medium">거래처를 먼저 등록하면 단가가 자동으로 채워져요!</p>
              <a href="/customers" className="mt-2 inline-block text-sm text-blue-600 underline">거래처 등록하러 가기 →</a>
            </div>
          )}
          {/* 최근 거래처 큰 버튼 */}
          {recentCustomers.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {recentCustomers.map(c => (
                <button key={c.id} type="button" onClick={() => selectCustomer(c)}
                  className={`py-4 rounded-2xl text-base font-bold border-2 transition-colors ${
                    form.customerId === c.id
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-800 border-gray-300 active:bg-gray-50'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* 자동완성 검색 */}
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 거래처 검색 또는 새로 입력..."
              value={customerQuery}
              onChange={e => {
                setCustomerQuery(e.target.value)
                setForm(prev => ({ ...prev, 거래처명: e.target.value, customerId: null }))
                setPriceRules([])
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full border-2 border-gray-300 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-green-500"
            />
            {showSuggestions && (filteredCustomers.length > 0 || customerQuery.trim()) && (
              <ul className="absolute z-40 w-full bg-white border-2 border-green-400 rounded-2xl mt-1 shadow-xl overflow-hidden">
                {filteredCustomers.map(c => (
                  <li key={c.id} onMouseDown={() => selectCustomer(c)}
                    className="px-4 py-4 text-lg cursor-pointer hover:bg-green-50 border-b last:border-0 font-medium">
                    {c.name}
                  </li>
                ))}
                {customerQuery.trim() && !filteredCustomers.some(c => c.name === customerQuery.trim()) && (
                  <li onMouseDown={() => registerAndSelect(customerQuery.trim())}
                    className="px-4 py-4 text-lg cursor-pointer bg-purple-50 text-purple-700 font-bold flex items-center gap-2">
                    <span className="text-2xl">+</span> &ldquo;{customerQuery.trim()}&rdquo; 새로 등록
                  </li>
                )}
              </ul>
            )}
          </div>
          {form.customerId && priceRules.length > 0 && (
            <p className="text-sm text-green-600 mt-2 font-medium">✓ 계약단가 {priceRules.length}개 자동 적용 준비됨</p>
          )}
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ② 식육종류
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section label="② 종류" done={!!form.식육종류} value={form.식육종류}>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_식육.map(v => (
              <BigSelectBtn key={v} label={v} active={form.식육종류 === v} onClick={() => set('식육종류', v)} />
            ))}
          </div>
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ③ 부위명 (계약단가 표시)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section label="③ 부위" done={!!form.부위명} value={form.부위명}>
          {quickParts.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {quickParts.map(v => {
                const rule = priceRules.find(r => r.cutKey === `${form.식육종류}/${v}`)
                return (
                  <button key={v} type="button" onClick={() => set('부위명', v)}
                    className={`py-4 rounded-2xl text-sm font-bold border-2 flex flex-col items-center gap-0.5 transition-colors ${
                      form.부위명 === v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-800 border-gray-300 active:bg-gray-50'
                    }`}
                  >
                    <span className="text-base">{v}</span>
                    {rule && <span className={`text-xs ${form.부위명 === v ? 'text-green-100' : 'text-green-600'}`}>₩{rule.price.toLocaleString()}</span>}
                  </button>
                )
              })}
            </div>
          ) : (
            <input type="text" placeholder="예) 삼겹살" value={form.부위명}
              onChange={e => set('부위명', e.target.value)}
              className="w-full border-2 border-gray-300 rounded-2xl px-4 py-4 text-lg focus:outline-none focus:border-green-500" />
          )}
          {quickParts.length > 0 && (
            <input type="text" placeholder="직접 입력..." value={form.부위명}
              onChange={e => set('부위명', e.target.value)}
              className="mt-2 w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-green-400 text-gray-600" />
          )}
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ④ 중량 × 단가 = 금액
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <Section label="④ 중량 · 단가" done={form.중량kg > 0 && form.단가 > 0}
          value={form.중량kg > 0 && form.단가 > 0 ? `${form.중량kg}kg × ₩${form.단가.toLocaleString()}` : ''}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-medium">중량 (kg)</label>
              <input type="number" step="0.1" min="0" inputMode="decimal"
                value={form.중량kg || ''}
                onChange={e => set('중량kg', parseFloat(e.target.value) || 0)}
                placeholder="0.0"
                className="w-full border-2 border-gray-300 rounded-2xl px-4 py-5 text-2xl font-bold text-center focus:outline-none focus:border-green-500" />
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1 font-medium">단가 (원/kg)</label>
              <input type="number" min="0" inputMode="numeric"
                value={form.단가 || ''}
                onChange={e => set('단가', parseInt(e.target.value) || 0)}
                placeholder="0"
                className="w-full border-2 border-gray-300 rounded-2xl px-4 py-5 text-2xl font-bold text-center focus:outline-none focus:border-green-500" />
            </div>
          </div>

          {/* 금액 */}
          <div className={`rounded-2xl py-4 px-4 text-center border-2 ${form.금액 > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-sm text-gray-500 mb-0.5">자동 계산 금액</p>
            <p className={`text-3xl font-bold ${form.금액 > 0 ? 'text-red-600' : 'text-gray-300'}`}>
              ₩ {form.금액.toLocaleString()}
            </p>
          </div>

          {/* 단가 저장 */}
          {form.customerId && form.식육종류 && form.부위명 && form.단가 > 0 && (
            <button type="button" onClick={async () => {
              const cutKey = `${form.식육종류}/${form.부위명}`
              await fetch(`/api/customers/${form.customerId}/price-rules`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cutKey, price: form.단가 }),
              })
              const rules = await fetch(`/api/customers/${form.customerId}/price-rules`).then(r => r.json())
              setPriceRules(rules)
            }} className="mt-2 w-full text-sm text-blue-600 border border-blue-200 rounded-xl py-2.5 active:bg-blue-50 font-medium">
              💾 이 단가를 {form.거래처명} · {form.부위명} 계약단가로 저장
            </button>
          )}
        </Section>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ⑤ 외상 여부
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="px-4 mb-4">
          <button type="button" onClick={() => set('isCredit', !form.isCredit)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-colors ${
              form.isCredit ? 'bg-orange-50 border-orange-400' : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="text-left">
              <p className={`text-lg font-bold ${form.isCredit ? 'text-orange-600' : 'text-gray-500'}`}>
                {form.isCredit ? '💳 외상 (미수금)' : '💵 외상 없음'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {form.isCredit ? '거래처 미수금에 자동 누적' : '현금 · 계좌이체 완료'}
              </p>
            </div>
            <div className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${form.isCredit ? 'bg-orange-400 justify-end' : 'bg-gray-300 justify-start'}`}>
              <div className="w-6 h-6 bg-white rounded-full shadow" />
            </div>
          </button>
        </div>

        {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            ⑥ 상세 입력 (접기/펼치기)
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <div className="px-4 mb-4">
          <button type="button" onClick={() => setShowDetail(v => !v)}
            className="w-full flex items-center justify-between py-3 px-4 bg-gray-100 rounded-2xl text-gray-600 font-medium">
            <span>상세 입력 (이력번호 · 원산지 · 등급)</span>
            <span className="text-lg">{showDetail ? '▲' : '▼'}</span>
          </button>

          {showDetail && (
            <div className="mt-3 space-y-3 bg-gray-50 rounded-2xl p-4">
              {/* 원산지 */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">원산지</label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_원산지.map(v => (
                    <button key={v} type="button" onClick={() => set('원산지', v)}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium border-2 ${
                        form.원산지 === v ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-700 border-gray-300'
                      }`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">이력번호</label>
                  <input type="text" inputMode="numeric" placeholder="12자리" value={form.이력번호}
                    onChange={e => set('이력번호', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">등급</label>
                  <input type="text" placeholder="1+, 1, 2..." value={form.등급}
                    onChange={e => set('등급', e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">도축장명</label>
                <input type="text" placeholder="-" value={form.도축장명}
                  onChange={e => set('도축장명', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">비고</label>
                <input type="text" placeholder="메모 (선택)" value={form.비고}
                  onChange={e => set('비고', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-3 text-base focus:outline-none focus:border-green-400" />
              </div>
            </div>
          )}
        </div>
      </form>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          저장 버튼 — 항상 화면 하단 고정
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg z-30">
        {!canSave && (
          <p className="text-center text-xs text-gray-400 mb-2">
            {!form.거래처명 ? '거래처를 선택하세요' : form.중량kg === 0 ? '중량을 입력하세요' : '단가를 입력하세요'}
          </p>
        )}
        <button type="submit" form="" disabled={loading || !canSave}
          onClick={async e => {
            e.preventDefault()
            if (!canSave || loading) return
            setLoading(true)
            try {
              await onSave(form)
              if (resetOnSave) {
                setForm({ ...EMPTY })
                setCustomerQuery('')
                setPriceRules([])
                setShowDetail(false)
                setSaved(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
                setTimeout(() => setSaved(false), 3000)
              }
            } finally {
              setLoading(false)
            }
          }}
          className={`w-full py-5 text-white text-xl font-bold rounded-2xl transition-colors ${
            canSave ? 'bg-green-600 active:bg-green-700' : 'bg-gray-300'
          } disabled:opacity-50`}
        >
          {loading ? '저장 중...' : canSave ? `💾 ${submitLabel} — ₩${form.금액.toLocaleString()}` : submitLabel}
        </button>
      </div>
    </>
  )
}

/* ── 섹션 컴포넌트 ──────────────────────────────── */
function Section({ label, done, value, children }: {
  label: string; done: boolean; value?: string; children: React.ReactNode
}) {
  return (
    <div className="px-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
          {done ? '✓' : label[0]}
        </div>
        <span className="font-bold text-gray-800">{label}</span>
        {done && value && <span className="text-green-600 text-sm font-medium ml-1">{value}</span>}
      </div>
      {children}
    </div>
  )
}

/* ── 큰 선택 버튼 ──────────────────────────────── */
function BigSelectBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`py-5 rounded-2xl text-lg font-bold border-2 transition-colors ${
        active ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-800 border-gray-300 active:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )
}
