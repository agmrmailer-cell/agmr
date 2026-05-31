import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

async function getActiveBanner() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
  const now = new Date().toISOString()
  const { data } = await supabase
    .from('site_banners')
    .select('*')
    .eq('active', true)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data
}

const STYLES = {
  info:    { bg: 'var(--green)',   text: '#fff', accent: 'rgba(255,255,255,0.25)' },
  warning: { bg: '#d97706',        text: '#fff', accent: 'rgba(255,255,255,0.25)' },
  urgent:  { bg: '#dc2626',        text: '#fff', accent: 'rgba(255,255,255,0.3)'  },
}

export default async function Banner() {
  const banner = await getActiveBanner()
  if (!banner) return null

  const style = STYLES[banner.type] ?? STYLES.info
  const label = banner.type === 'warning' ? '⚠ ATTENTION' : banner.type === 'urgent' ? '🔴 URGENT' : 'ℹ INFO'

  // Repeat message for seamless loop
  const content = banner.lien
    ? `${banner.message}${banner.lien_texte ? ` — ${banner.lien_texte}` : ''}`
    : banner.message
  const repeated = Array(3).fill(content).join('            ')

  return (
    <div style={{
      background: style.bg,
      color: style.text,
      fontSize: '0.85rem',
      fontWeight: 500,
      fontFamily: 'var(--sans)',
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      height: 38,
      position: 'relative',
      zIndex: 50,
    }}>
      {/* Label fixe */}
      <div style={{
        flexShrink: 0,
        padding: '0 16px',
        fontSize: '0.72rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        background: style.accent,
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        borderRight: `1px solid ${style.accent}`,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </div>

      {/* Texte défilant */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <div className="banner-ticker">
          <span>{repeated}</span>
          {banner.lien && (
            <Link
              href={banner.lien}
              style={{ color: style.text, textDecoration: 'underline', marginLeft: 8, whiteSpace: 'nowrap' }}
            >
              {banner.lien_texte ?? 'En savoir plus'} →
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
