import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import HostNew from './pages/HostNew'
import Host from './pages/Host'
import Join from './pages/Join'
import Play from './pages/Play'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/host/new" element={<HostNew />} />
      <Route path="/host/:code" element={<Host />} />
      <Route path="/join" element={<Join />} />
      <Route path="/play/:code" element={<Play />} />
    </Routes>
  )
}
