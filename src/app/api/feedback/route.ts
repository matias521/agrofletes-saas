import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
  }

  // 1. Save to Supabase as reliable backup
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.from('feedback').insert({ text: text.trim(), created_at: new Date().toISOString() })
  } catch {
    // Non-fatal: continue to email attempt
  }

  // 2. Send email via Gmail SMTP
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD

  if (!gmailUser || !gmailPass) {
    console.error('GMAIL_USER or GMAIL_APP_PASSWORD not set')
    return NextResponse.json({ ok: true, warn: 'email_not_configured' })
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    await transporter.sendMail({
      from: `"AgroFletes Feedback" <${gmailUser}>`,
      to: 'agrofletes123@gmail.com',
      subject: '💬 Nueva sugerencia — AgroFletes',
      text: text.trim(),
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2 style="color:#2D6A2F">Nueva sugerencia de AgroFletes</h2>
          <div style="background:#f5f7f2;border-radius:8px;padding:16px 20px;font-size:15px;line-height:1.6;color:#222">
            ${text.trim().replace(/\n/g, '<br>')}
          </div>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Email send error:', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
