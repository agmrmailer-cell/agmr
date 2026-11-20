import { Cormorant_Garamond, Source_Sans_3, Inter } from 'next/font/google'
import './globals.css'
import { getEditMode } from '@/lib/edit-mode'
import EditModeBar from '@/components/editable/EditModeBar'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['800'],
  variable: '--font-display',
})

export const metadata = {
  title: 'AGMR — Gym Marche Rambouillet',
  description: 'Association Gym Marche Rambouillet — Gymnastique, randonnée et marche nordique depuis 1970.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
}

export default async function RootLayout({ children }) {
  const editMode = await getEditMode()
  return (
    <html lang="fr">
      <body className={`${cormorant.variable} ${sourceSans.variable} ${inter.variable}`}>
        {editMode && <EditModeBar/>}
        {children}
      </body>
    </html>
  )
}
