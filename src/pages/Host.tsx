import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, type Room } from '../lib/supabase'
import { COLUMN_LETTERS, COLUMN_RANGES, drawNextNumber, type Card } from '../lib/card'
import { loadHostToken } from '../lib/storage'

type Claim = {
  name: string
  card: Card
  claimedAt: number
}

export default function Host() {
  const { code } = useParams<{ code: string }>()
  const [room, setRoom] = useState<Room | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [claims, setClaims] = useState<Claim[]>([])
  const [drawing, setDrawing] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const claimsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const hostToken = code ? loadHostToken(code) : null
  const isHost = !!room && room.host_token === hostToken

  const joinUrl = useMemo(() => {
    if (!code) return ''
    return `${window.location.origin}${import.meta.env.BASE_URL}join?code=${code}`
  }, [code])

  useEffect(() => {
    if (!code) return

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
      .on('broadcast', { event: 'bingo_claim' }, ({ payload }) => {
        setClaims((prev) => [{ ...(payload as Omit<Claim, 'claimedAt'>), claimedAt: Date.now() }, ...prev])
      })
      .subscribe()
    claimsChannelRef.current = claimsChannel

    return () => {
      active = false
      supabase.removeChannel(roomChannel)
      supabase.removeChannel(claimsChannel)
      claimsChannelRef.current = null
    }
  }, [code])

  async function handleNextNumber() {
    if (!room || drawing) return
    const next = drawNextNumber(room.called_numbers)
    if (next === null) return

    setDrawing(true)
    const updated = [...room.called_numbers, next]
    const { error } = await supabase
      .from('rooms')
      .update({ called_numbers: updated, status: 'playing' })
      .eq('code', room.code)
    if (error) {
      console.error('No se pudo cantar el número:', error.message)
    } else {
      // Actualiza de inmediato en vez de esperar al evento de Realtime (que puede tardar un poco).
      setRoom((prev) => (prev ? { ...prev, called_numbers: updated, status: 'playing' } : prev))
    }
    setDrawing(false)
  }

  async function handleFinish() {
    if (!room || finishing) return
    setFinishing(true)
    const { error } = await supabase.from('rooms').update({ status: 'finished' }).eq('code', room.code)
    if (error) {
      console.error('No se pudo finalizar la partida:', error.message)
      setFinishing(false)
      return
    }
    setRoom((prev) => (prev ? { ...prev, status: 'finished' } : prev))
    // Reusa el canal ya conectado (suscribirse de nuevo aquí se queda esperando indefinidamente).
    claimsChannelRef.current?.send({
      type: 'broadcast',
      event: 'game_over',
      payload: {},
    })
    setFinishing(false)
  }

  if (notFound) {
    return (
      <div className="page page-center">
        <p>No existe la sala "{code}".</p>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="page page-center">
        <p>Cargando sala…</p>
      </div>
    )
  }

  if (!isHost) {
    return (
      <div className="page page-center">
        <p>
          Esta pantalla es solo para el anfitrión de la sala <strong>{room.code}</strong>. Si eres
          jugador, ve a <code>/join</code>.
        </p>
      </div>
    )
  }

  const lastNumber = room.called_numbers[room.called_numbers.length - 1]

  return (
    <div className="page">
      <header className="host-header">
        <div>
          <p className="eyebrow">Sala</p>
          <h1>{room.code}</h1>
        </div>
        {joinUrl && (
          <div className="qr-box">
            <QRCodeSVG value={joinUrl} size={96} />
            <small>{joinUrl.replace('https://', '')}</small>
          </div>
        )}
      </header>

      <div className="button-row">
        <button
          className="btn btn-primary btn-lg"
          onClick={handleNextNumber}
          disabled={drawing || room.status === 'finished' || room.called_numbers.length >= 75}
        >
          {room.called_numbers.length >= 75 ? 'Se cantaron todos los números' : 'Siguiente número'}
        </button>
        <button className="btn" onClick={handleFinish} disabled={finishing}>
          {finishing ? 'Finalizando…' : room.status === 'finished' ? 'Avisar de nuevo' : 'Finalizar partida'}
        </button>
      </div>

      {room.status === 'finished' && (
        <div className="banner">
          La partida terminó. Si algún jugador no vio el aviso, toca "Avisar de nuevo".
        </div>
      )}

      {lastNumber !== undefined && (
        <div className="last-number">
          <span>{COLUMN_LETTERS[COLUMN_RANGES.findIndex(([min, max]) => lastNumber >= min && lastNumber <= max)]}</span>
          <strong>{lastNumber}</strong>
        </div>
      )}

      <section>
        <h2>Números cantados ({room.called_numbers.length}/75)</h2>
        <div className="called-grid">
          {COLUMN_LETTERS.map((letter, colIdx) => {
            const [min, max] = COLUMN_RANGES[colIdx]
            const nums = []
            for (let n = min; n <= max; n++) nums.push(n)
            return (
              <div key={letter} className="called-column">
                <strong>{letter}</strong>
                {nums.map((n) => (
                  <span key={n} className={room.called_numbers.includes(n) ? 'num called' : 'num'}>
                    {n}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h2>Reclamos de ¡BINGO! ({claims.length})</h2>
        {claims.length === 0 && <p className="muted">Nadie ha cantado bingo todavía.</p>}
        <ul className="claims-list">
          {claims.map((claim, i) => (
            <li key={i} className="claim-card">
              <strong>{claim.name}</strong>
              <MiniCard card={claim.card} calledNumbers={room.called_numbers} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

function MiniCard({ card, calledNumbers }: { card: Card; calledNumbers: number[] }) {
  return (
    <table className="mini-card">
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
              const called = cell === 'FREE' || calledNumbers.includes(cell as number)
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
  )
}
