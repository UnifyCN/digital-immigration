import type { Metadata, Viewport } from 'next'
import { Inter, Source_Serif_4 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { DisclaimerBanner } from '@/components/disclaimer-banner'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
})

export const metadata: Metadata = {
  title: 'Clarity Assessment - Immigration Pathway Tool',
  description: 'Understand your immigration options and risks with a structured clarity assessment. Not legal advice.',
}

export const viewport: Viewport = {
  themeColor: '#5a8a9a',
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">
        <DisclaimerBanner />
        <main>{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
