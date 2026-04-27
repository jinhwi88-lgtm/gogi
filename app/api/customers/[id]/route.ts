import { NextRequest, NextResponse } from 'next/server'
import { updateCustomer, removeCustomer, getCustomerById } from '@/lib/db'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = getCustomerById(Number(id))
  if (!customer) return NextResponse.json({ error: '없음' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  const customer = updateCustomer(Number(id), name)
  return NextResponse.json(customer)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  removeCustomer(Number(id))
  return NextResponse.json({ ok: true })
}
