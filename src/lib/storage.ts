import type { Card } from './card'

type PlayerState = {
  name: string
  card: Card
}

const playerKey = (code: string) => `bingo:player:${code}`
const hostKey = (code: string) => `bingo:host:${code}`

export function savePlayerState(code: string, state: PlayerState) {
  localStorage.setItem(playerKey(code), JSON.stringify(state))
}

export function loadPlayerState(code: string): PlayerState | null {
  const raw = localStorage.getItem(playerKey(code))
  return raw ? (JSON.parse(raw) as PlayerState) : null
}

export function saveHostToken(code: string, token: string) {
  localStorage.setItem(hostKey(code), token)
}

export function loadHostToken(code: string): string | null {
  return localStorage.getItem(hostKey(code))
}
