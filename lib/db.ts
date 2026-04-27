import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import type { Transaction, Customer, PriceRule, CustomerSummary } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'transactions.db')

let _db: Database.Database | null = null

function getDb(): Database.Database {
  if (_db) return _db
  _db = new Database(DB_PATH)
  _db.pragma('journal_mode = WAL')
  _db.pragma('foreign_keys = ON')

  _db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS price_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      cut_key TEXT NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      UNIQUE(customer_id, cut_key)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      partner TEXT NOT NULL,
      meat_type TEXT NOT NULL DEFAULT '',
      cut TEXT NOT NULL DEFAULT '',
      grade TEXT NOT NULL DEFAULT '-',
      origin TEXT NOT NULL DEFAULT '',
      history_no TEXT NOT NULL DEFAULT '',
      slaughter TEXT NOT NULL DEFAULT '-',
      weight_kg REAL NOT NULL DEFAULT 0,
      unit_price INTEGER NOT NULL DEFAULT 0,
      amount INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      is_credit INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
    );
  `)

  // 기존 DB 마이그레이션 (컬럼 없으면 추가)
  const cols = (_db.prepare("PRAGMA table_info(transactions)").all() as {name: string}[]).map(c => c.name)
  if (!cols.includes('customer_id')) _db.exec("ALTER TABLE transactions ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL")
  if (!cols.includes('is_credit'))   _db.exec("ALTER TABLE transactions ADD COLUMN is_credit INTEGER NOT NULL DEFAULT 0")

  return _db
}

// ── Transactions ──────────────────────────────────────────

function toRow(r: Omit<Transaction, 'id' | '생성일'>) {
  return {
    date: r.거래일자,
    partner: r.거래처명,
    meat_type: r.식육종류,
    cut: r.부위명,
    grade: r.등급,
    origin: r.원산지,
    history_no: r.이력번호,
    slaughter: r.도축장명,
    weight_kg: r.중량kg,
    unit_price: r.단가,
    amount: r.금액,
    note: r.비고,
    customer_id: r.customerId ?? null,
    is_credit: r.isCredit ? 1 : 0,
  }
}

function fromRow(r: Record<string, unknown>): Transaction {
  return {
    id: r.id as number,
    거래일자: r.date as string,
    거래처명: r.partner as string,
    식육종류: r.meat_type as string,
    부위명: r.cut as string,
    등급: r.grade as string,
    원산지: r.origin as string,
    이력번호: r.history_no as string,
    도축장명: r.slaughter as string,
    중량kg: r.weight_kg as number,
    단가: r.unit_price as number,
    금액: r.amount as number,
    비고: r.note as string,
    생성일: r.created_at as string,
    customerId: (r.customer_id as number | null) ?? null,
    isCredit: Boolean(r.is_credit),
  }
}

export function getAll(search?: string, date?: string): Transaction[] {
  const db = getDb()
  let sql = 'SELECT * FROM transactions WHERE 1=1'
  const params: string[] = []
  if (search) { sql += ' AND partner LIKE ?'; params.push(`%${search}%`) }
  if (date)   { sql += ' AND date = ?'; params.push(date) }
  sql += ' ORDER BY date DESC, id DESC'
  return (db.prepare(sql).all(...params) as Record<string, unknown>[]).map(fromRow)
}

export function getById(id: number): Transaction | null {
  const r = getDb().prepare('SELECT * FROM transactions WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return r ? fromRow(r) : null
}

export function insert(row: Omit<Transaction, 'id' | '생성일'>): Transaction {
  const db = getDb()
  const mapped = toRow(row)
  const result = db.prepare(`
    INSERT INTO transactions (date, partner, meat_type, cut, grade, origin, history_no, slaughter, weight_kg, unit_price, amount, note, customer_id, is_credit)
    VALUES (@date, @partner, @meat_type, @cut, @grade, @origin, @history_no, @slaughter, @weight_kg, @unit_price, @amount, @note, @customer_id, @is_credit)
  `).run(mapped)
  return getById(result.lastInsertRowid as number)!
}

export function update(id: number, row: Partial<Transaction>): Transaction {
  const db = getDb()
  const mapped = toRow({ ...row } as Omit<Transaction, 'id' | '생성일'>)
  db.prepare(`
    UPDATE transactions SET
      date=@date, partner=@partner, meat_type=@meat_type, cut=@cut, grade=@grade,
      origin=@origin, history_no=@history_no, slaughter=@slaughter,
      weight_kg=@weight_kg, unit_price=@unit_price, amount=@amount, note=@note,
      customer_id=@customer_id, is_credit=@is_credit
    WHERE id=@id
  `).run({ ...mapped, id })
  return getById(id)!
}

export function remove(id: number): void {
  getDb().prepare('DELETE FROM transactions WHERE id = ?').run(id)
}

// ── Customers ──────────────────────────────────────────────

function customerFromRow(r: Record<string, unknown>): Customer {
  return { id: r.id as number, name: r.name as string, createdAt: r.created_at as string }
}

export function getAllCustomers(): Customer[] {
  return (getDb().prepare('SELECT * FROM customers ORDER BY name ASC').all() as Record<string, unknown>[]).map(customerFromRow)
}

export function getRecentCustomers(limit = 5): Customer[] {
  const sql = `
    SELECT c.* FROM customers c
    JOIN transactions t ON t.customer_id = c.id
    GROUP BY c.id ORDER BY MAX(t.created_at) DESC LIMIT ?
  `
  return (getDb().prepare(sql).all(limit) as Record<string, unknown>[]).map(customerFromRow)
}

export function getCustomerById(id: number): Customer | null {
  const r = getDb().prepare('SELECT * FROM customers WHERE id = ?').get(id) as Record<string, unknown> | undefined
  return r ? customerFromRow(r) : null
}

export function insertCustomer(name: string): Customer {
  const db = getDb()
  const result = db.prepare('INSERT INTO customers (name) VALUES (?)').run(name)
  return getCustomerById(result.lastInsertRowid as number)!
}

export function updateCustomer(id: number, name: string): Customer {
  getDb().prepare('UPDATE customers SET name=? WHERE id=?').run(name, id)
  return getCustomerById(id)!
}

export function removeCustomer(id: number): void {
  getDb().prepare('DELETE FROM customers WHERE id=?').run(id)
}

export function getCustomerSummary(id: number): CustomerSummary | null {
  const customer = getCustomerById(id)
  if (!customer) return null
  const db = getDb()
  const row = db.prepare(`
    SELECT COALESCE(SUM(amount),0) as total, COALESCE(SUM(CASE WHEN is_credit=1 THEN amount ELSE 0 END),0) as credit
    FROM transactions WHERE customer_id=?
  `).get(id) as { total: number; credit: number }
  const recent = (db.prepare('SELECT * FROM transactions WHERE customer_id=? ORDER BY date DESC, id DESC LIMIT 10').all(id) as Record<string, unknown>[]).map(fromRow)
  return { ...customer, totalAmount: row.total, totalCredit: row.credit, recentTransactions: recent }
}

// ── Price Rules ─────────────────────────────────────────────

function priceFromRow(r: Record<string, unknown>): PriceRule {
  return { id: r.id as number, customerId: r.customer_id as number, cutKey: r.cut_key as string, price: r.price as number, updatedAt: r.updated_at as string }
}

export function getPriceRules(customerId: number): PriceRule[] {
  return (getDb().prepare('SELECT * FROM price_rules WHERE customer_id=? ORDER BY cut_key ASC').all(customerId) as Record<string, unknown>[]).map(priceFromRow)
}

export function upsertPriceRule(customerId: number, cutKey: string, price: number): PriceRule {
  const db = getDb()
  db.prepare(`
    INSERT INTO price_rules (customer_id, cut_key, price, updated_at)
    VALUES (?, ?, ?, datetime('now','localtime'))
    ON CONFLICT(customer_id, cut_key) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at
  `).run(customerId, cutKey, price)
  const r = db.prepare('SELECT * FROM price_rules WHERE customer_id=? AND cut_key=?').get(customerId, cutKey) as Record<string, unknown>
  return priceFromRow(r)
}

export function removePriceRule(id: number): void {
  getDb().prepare('DELETE FROM price_rules WHERE id=?').run(id)
}

export function lookupPrice(customerId: number, cutKey: string): number | null {
  const r = getDb().prepare('SELECT price FROM price_rules WHERE customer_id=? AND cut_key=?').get(customerId, cutKey) as { price: number } | undefined
  return r ? r.price : null
}

// 거래처 외상 전액 수금 처리 (is_credit → 0)
export function settleCustomerCredits(customerId: number): void {
  getDb().prepare('UPDATE transactions SET is_credit=0 WHERE customer_id=? AND is_credit=1').run(customerId)
}
