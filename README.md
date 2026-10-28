# 🎱 Bingo en vivo

Bingo 75 (B-I-N-G-O, cartón 5x5) para jugar en vivo desde el celular. Un anfitrión canta los
números desde su pantalla; cada jugador entra con un código de sala y ve su propio cartón
resaltarse en tiempo real.

## Cómo jugar

1. El anfitrión entra al sitio y toca **"Crear sala"** → le aparece un código de 5 letras y un QR.
2. Los jugadores entran a **"Unirme a una sala"**, escriben el código y su nombre, y ven su cartón.
3. El anfitrión toca **"Siguiente número"** cada vez que quiera cantar uno — se sincroniza al
   instante en el celular de todos.
4. Cuando alguien completa una línea o el cartón lleno, toca **"¡BINGO!"** — el anfitrión recibe
   el aviso con el nombre y el cartón de esa persona para validarlo a ojo y anunciar el ganador.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa con tu URL y anon key de Supabase
npm run dev
```

## Backend

Usa [Supabase](https://supabase.com) solo como base de datos en tiempo real (tabla `rooms` +
Realtime). El esquema está en `supabase/migrations/0001_rooms.sql`.

## Despliegue

Cada push a `main` despliega automáticamente a GitHub Pages vía
`.github/workflows/deploy.yml`. Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
están configuradas como secrets del repositorio.
