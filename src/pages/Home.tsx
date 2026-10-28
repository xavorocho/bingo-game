import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="page page-center">
      <h1>🎱 Bingo en vivo</h1>
      <p className="subtitle">Bingo 75 para jugar desde el celular, con números en vivo.</p>
      <div className="button-stack">
        <Link className="btn btn-primary" to="/host/new">
          Crear sala (soy el anfitrión)
        </Link>
        <Link className="btn" to="/join">
          Unirme a una sala
        </Link>
      </div>
    </div>
  )
}
