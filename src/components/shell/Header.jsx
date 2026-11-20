import HeaderClient from './HeaderClient'
import { getSiteTexts } from '@/lib/queries'

// En-tête du site : les intitulés du menu viennent des textes « Menu du site » du back-office
export default async function Header() {
  const nav = await getSiteTexts('navigation')
  return <HeaderClient nav={nav}/>
}
