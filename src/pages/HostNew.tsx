import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { generateHostToken, generateRoomCode } from '../lib/card'
import { saveHostToken } from '../lib/storage'

export default function HostNew() {
  const navigate = useNavigate()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    async function createRoom() {
      const hostToken = generateHostToken()

      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateRoomCode()
        const { error } = await supabase.from('rooms').insert({
          code,
          host_token: hostToken,
          called_numbers: [],
          status: 'waiting',
        })

        if (!error) {
          saveHostToken(code, hostToken)
          navigate(`/host/${code}`, { replace: true })
          return
        }

        // Unique violation on `code` -> try another code. Any other error -> stop retrying.
        if (error.code !== '23505') {
          console.error('No se pudo crear la sala:', error.message)
          return
        }
      }
    }

    createRoom()
  }, [navigate])

  return (
    <div className="page page-center">
      <p>Creando tu sala…</p>
    </div>
  )
}
