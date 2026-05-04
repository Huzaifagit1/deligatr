import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// One-time route to create the admin user with email pre-confirmed.
// Hit GET /api/auth/setup once, then you can delete this file.
export async function GET() {
  const db = supabaseAdmin()

  const { data, error } = await db.auth.admin.createUser({
    email: 'admin@deligatr.ai',
    password: 'jody123@$',
    email_confirm: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, user_id: data.user.id })
}
