# Transcript Shield — Peridot prototype

Interactive transcript demo for embedding on a Framer landing page.

## Local development

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Deploy — Vercel auto-detects Vite

Your embed URL will be `https://your-project.vercel.app`

## Embed in Framer

1. Add an **Embed** component to your page
2. Paste your deployed URL (e.g. `https://transcript-shield.vercel.app`)
3. Set the frame size to roughly **1200 × 720** (or full width × 720 height)

The prototype fills the iframe with `100vh` height, so match the embed height to your design.

Alternatively, use an iframe directly:

```html
<iframe
  src="https://your-project.vercel.app"
  width="100%"
  height="720"
  style="border:0;border-radius:12px;"
  allow="clipboard-write"
  loading="lazy"
></iframe>
```
