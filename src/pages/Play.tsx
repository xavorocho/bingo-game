import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase, type Room } from '../lib/supabase'
import { COLUMN_LETTERS, generateCard, isCardNumberCalled, isFullCard, type Card } from '../lib/card'
import { loadPlayerState, savePlayerState } from '../lib/storage'

export default function Play() {
  const { code: rawCode } = useParams<{ code: string }>()
  const code = rawCode?.toUpperCase() ?? ''
  const [params] = useSearchParams()

  const [room, setRoom] = useState<Room | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [card, setCard] = useState<Card | null>(null)
  const [name, setName] = useState('')
  const [claimed, setClaimed] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const claimsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!code) return

    const existing = loadPlayerState(code)
    const nameFromUrl = params.get('name')?.trim()
    const resolvedName = existing?.name || nameFromUrl || 'Jugador'
    const resolvedCard = existing?.card || generateCard()
    setName(resolvedName)
    setCard(resolvedCard)
    savePlayerState(code, { name: resolvedName, card: resolvedCard })

    let active = true

    supabase
      .from('rooms')
      .select('*')
      .eq('code', code)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error || !data) {
          setNotFound(true)
          return
        }
        setRoom(data as Room)
      })

    const roomChannel = supabase
      .channel(`room-db-${code}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` },
        (payload) => setRoom(payload.new as Room),
      )
      .subscribe()

    const claimsChannel = supabase
      .channel(`room-claims-${code}`)
      .on('broadcast', { event: 'game_over' }, () => setGameOver(true))
      .subscribe()
    claimsChannelRef.current = claimsChannel

    return () => {
      active = false
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(claimsChannel)
    }
  }, [code, params])

  async function handleBingo() {
    if (!card || !claimsChannelRef.current || claimed) return
    setClaimed(true)
    await claimsChannelRef.current.send({
      type: 'broadcast',
      event: 'bingo_claim',
      payload: { name, card },
    })
  }

  if (notFound) {
    return (
      <div className="page page-center">
        <p>No existe la sala "{code}".</p>
        <Link className="btn" to="/join">
          Volver
        </Link>
      </div>
    )
  }

  if (!room || !card) {
    return (
      <div className="page page-center">
        <p>Cargando…</p>
      </div>
    )
  }

  const calledNumbers = room.called_numbers
  const full = isFullCard(card, calledNumbers)

  return (
    <div className="page page-center">
      {(gameOver || room.status === 'finished') && (
        <div className="banner">¡La partida terminó! Gracias por jugar, {name}.</div>
      )}

      <p className="eyebrow">Sala {room.code}</p>
      <h1>{name}</h1>
      <p className="muted">Último número: {calledNumbers[calledNumbers.length - 1] ?? '—'}</p>

      <table className="card-table">
        <thead>
          <tr>
            {COLUMN_LETTERS.map((l) => (
              <th key={l}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4].map((row) => (
            <tr key={row}>
              {card.map((column, colIdx) => {
                const cell = column[row]
                const called = isCardNumberCalled(cell, calledNumbers)
                return (
                  <td key={colIdx} className={called ? 'called' : ''}>
                    {cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <button className="btn btn-primary btn-lg" onClick={handleBingo} disabled={claimed || gameOver}>
        {claimed ? '¡Reclamo enviado! Esperando al anfitrión…' : full ? '¡BINGO! 🎉' : '¡BINGO!'}
      </button>
    </div>
  )
}
