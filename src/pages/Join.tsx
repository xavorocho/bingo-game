import { useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Join() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [code, setCode] = useState(params.get('code')?.toUpperCase() ?? '')
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmedName = name.trim()
    const normalizedCode = code.trim().toUpperCase()
    if (!trimmedName || !normalizedCode) {
      setError('Completa tu nombre y el código de la sala.')
      return
    }

    setChecking(true)
    const { data, error: fetchError } = await supabase
      .from('rooms')
      .select('code')
      .eq('code', normalizedCode)
      .maybeSingle()
    setChecking(false)

    if (fetchError || !data) {
      setError('No encontramos esa sala. Revisa el código con el anfitrión.')
      return
    }

    navigate(`/play/${normalizedCode}?name=${encodeURIComponent(trimmedName)}`)
  }

  return (
    <div className="page page-center">
      <h1>Unirme a una sala</h1>
      <form className="join-form" onSubmit={handleSubmit}>
        <label>
          Código de la sala
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCDE"
            maxLength={5}
            autoCapitalize="characters"
          />
        </label>
        <label>
          Tu nombre
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={checking}>
          {checking ? 'Buscando sala…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
