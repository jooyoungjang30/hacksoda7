import type { GiftCard } from '../lib/supabase'

/** Every call site sizes itself explicitly — `.sw`'s own CSS carries no
 *  width/height, so a bare GiftMark never inherits a wrong ambient size. */
export function GiftMark({ card, size = 38 }: { card: GiftCard; size?: number }) {
  const box = { width: size, height: size, fontSize: Math.round(size * 0.4) }
  if (card.image_url) {
    return <img className="sw" src={card.image_url} alt="" loading="lazy"
                style={{ ...box, objectFit: 'cover', background: '#fff' }} />
  }
  return <span className="sw" style={{ ...box, background: card.swatch }}>{card.glyph}</span>
}
