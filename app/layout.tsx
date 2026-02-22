import type { Metadata, Viewport } from 'next'
import { Anek_Latin, Funnel_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const anekLatin = Anek_Latin({
  subsets: ["latin"],
  variable: "--font-anek",
})

const funnelSans = Funnel_Sans({
  subsets: ["latin"],
  variable: "--font-funnel",
})

export const metadata: Metadata = {
  title: 'Unify Social - Immigration Snapshot',
  description:
    'A warm, supportive immigration snapshot to help newcomers plan next steps with confidence.',
}

export const viewport: Viewport = {
  themeColor: '#D8492C',
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      data-brand-theme="events"
      className={`${anekLatin.variable} ${funnelSans.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground">
        <DisclaimerBanner />
        <main>{children}</main>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
