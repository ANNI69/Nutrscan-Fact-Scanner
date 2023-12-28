import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NutriScan: Nutrition Facts Scanner',
  description: 'Generated by Next.js, MongoDB, Browser Barcode Detection API, USDA and OpenFoodFacts APIs, Tailwind and hosted on Vercel',
  icons: '/nutrition-facts-scanner-logo.png',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
