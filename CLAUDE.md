# Ai.J Labs – sitio web (aijlabs.ar)

Sitio estático (HTML/CSS/JS, sin build). Dominio: aijlabs.ar → www.aijlabs.ar.
Repo: github.com/aijlabs/aijlabs-website (rama `main`). Hosting: Vercel, proyecto `aijlabs-website` (`prj_mgMjqHOHvkKfNlHJxrYkODolEEvp`).

## Reglas de trabajo (Gaby)
- Si hay dudas, consultar. No decidir por su cuenta.
- Lo que no está indicado, no se cambia.
- Si queda algo por cambiar, avisar.
- Respuestas en español, concisas, resultado primero.

## Estructura y deploy (IMPORTANTE)
- **Vercel publica la carpeta `public/`** (no `V2/`). Push a `main` = deploy automático.
- `V2/` es la carpeta de trabajo del rediseño (index, servicios, contacto, desarrollos, styles.css, main.js, img/, video/).
- **Para publicar un cambio hecho en `V2/`: copiarlo al mismo path en `public/`**, commit y push. Si no se copia, el deploy sale OK pero el sitio no cambia.
- Archivos solo de `public/` (no existen en V2, no borrar): `guias/whatsapp-ia.html`, `tutoriales/**` (index + videos/portadas de los tutoriales).
- No se publican: `V2/.vercelignore`, `V2/.gitignore`, `V2/vercel.json`, `serve.py`, `index.backup.html`, mp4 fuente sueltos en `V2/`, `plans/`.
- `vercel.json` (raíz): `{"cleanUrls": true}` → `/servicios`, no `.html`.
- Protección SSO de Vercel activa en las URLs `*.vercel.app` (devuelven 302); probar siempre en www.aijlabs.ar.

## Local
- `python serve.py` en `V2/` (puerto 8124). Soporta HTTP Range, necesario para el scrub del video.
- El panel Browser de Claude no dispara rAF/scroll: el scrub del hero no se puede verificar ahí; usar Chrome real.

## Hero con video atado al scroll
- `<video id="heroScrub">` en `index.html`, lógica en el último IIFE de `main.js` (rAF, suavizado exponencial `1 - exp(-dt/55)`, cuantizado a 24 fps).
- CSS: `.hero__video` necesita `height:auto` (los atributos width/height del tag pisan el aspect-ratio).
- Spec del video: `video/hero-scrub.mp4`, 1600x900, 24 fps, 10 s, sin audio, **todos keyframes** (`-g 1`, imprescindible para scrub por `currentTime`), faststart. Poster: `video/hero-scrub-poster.jpg`.
- Regenerar desde el mp4 fuente:
  `ffmpeg -y -i <fuente>.mp4 -an -vf "scale=1600:900:flags=lanczos,unsharp=5:5:0.6:5:5:0.0" -c:v libx264 -g 1 -crf 21 -preset slow -pix_fmt yuv420p -movflags +faststart video/hero-scrub.mp4`
- Logo animado del header: `video/logo-anim.mp4` (muted, loop) + `logo-anim-poster.png`.

## Intro (video sobre la home, solo desktop)
- `video/intro-tunel.mp4` (+ `intro-tunel-poster.jpg`), overlay `#intro` en `index.html`, lógica en el último IIFE de `main.js`, CSS al final de `styles.css`.
- Máscara radial `--intro-r` atada a `video.currentTime` (tabla del radio del agujero): la home se ve por el agujero mientras se abre. `playbackRate` 1.5.
- Se reproduce 1 vez por sesión (`sessionStorage.introVista`). Se saltea con `?jaia=`, reduced-motion, ancho <=820px o pointer coarse. Botón "Saltar intro", Esc, watchdog 4 s.
- Siempre abre con scroll en el Hero (`scrollRestoration="manual"` + `scrollTo(0,0)`). El título del Hero espera el evento `intro-open`.
- Para probar sin el límite de 1 vez: sacar `!sessionStorage.getItem("introVista")` del head script y RESTAURARLO antes de publicar.

## Jaia (chatbot)
- Link para el mensaje automático de ausencia de WhatsApp: `https://www.aijlabs.ar/?jaia=ausencia` (abre Jaia sabiendo que viene de WA fuera de horario).

## Pendientes conocidos
- Hero: el movimiento va y viene (vaivén) y el texto del video es chico; viene del video fuente. Opción: regenerarlo con movimiento lineal y texto más grande.
- Errores 404 en consola sin investigar.
- mp4/png fuente sin trackear en `V2/` y carpeta padre.
