export const COLUMN_LETTERS = ['B', 'I', 'N', 'G', 'O'] as const

export const COLUMN_RANGES: [number, number][] = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
]

export const FREE_SPACE = 'FREE'

export type CardCell = number | typeof FREE_SPACE

/** 5x5 card stored column-major: card[column][row], matching the B-I-N-G-O layout. */
export type Card = CardCell[][]

function pickUnique(min: number, max: number, count: number): number[] {
  const pool: number[] = []
  for (let n = min; n <= max; n++) pool.push(n)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export function generateCard(): Card {
  return COLUMN_RANGES.map(([min, max], columnIndex) => {
    const isCenterColumn = columnIndex === 2
    const numbers = pickUnique(min, max, isCenterColumn ? 4 : 5)
    if (!isCenterColumn) return numbers
    // N column: 4 real numbers + free space in the middle row (row index 2)
    return [numbers[0], numbers[1], FREE_SPACE, numbers[2], numbers[3]]
  })
}

export function columnLetterForNumber(n: number): (typeof COLUMN_LETTERS)[number] {
  const idx = COLUMN_RANGES.findIndex(([min, max]) => n >= min && n <= max)
  return COLUMN_LETTERS[idx] ?? 'B'
}

export function isCardNumberCalled(cell: CardCell, calledNumbers: number[]): boolean {
  return cell === FREE_SPACE || calledNumbers.includes(cell)
}

/** True if every number on the card has been called (full-card bingo). */
export function isFullCard(card: Card, calledNumbers: number[]): boolean {
  return card.every((column) => column.every((cell) => isCardNumberCalled(cell, calledNumbers)))
}

export function generateRoomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O/0/I/1 ambiguity
  let code = ''
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return code
}

export function generateHostToken(): string {
  return crypto.randomUUID()
}

export function drawNextNumber(alreadyCalled: number[]): number | null {
  const remaining: number[] = []
  for (let n = 1; n <= 75; n++) {
    if (!alreadyCalled.includes(n)) remaining.push(n)
  }
  if (remaining.length === 0) return null
  return remaining[Math.floor(Math.random() * remaining.length)]
}
