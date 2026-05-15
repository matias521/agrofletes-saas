import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  const { text } = await req.json()
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Mensaje vacío' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })

  await transporter.sendMail({
    from: process.env.GMAIL_USER,
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
}
