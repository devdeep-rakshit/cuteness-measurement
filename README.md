# Cuteness Measurement 🎀

A mobile-first React + TypeScript + Vite camera app using MediaPipe Face Detector and Canvas.

## Run locally
1. Install Node.js 20+
2. Run `npm install`
3. Run `npm run dev`
4. Open the localhost URL. Camera access requires localhost or HTTPS.

## Build
`npm run build`

## Deploy to GitHub Pages
The project is configured for Vite. For a repository project page, set Vite `base` to `/cuteness-measurement/`, build, then publish `dist` with GitHub Pages or add a Pages workflow.

Features: front/rear camera switching, MediaPipe face detection, 15 seconds of accumulated face-visible time, filters, Canvas photo capture/download, mobile-first pink UI. MediaPipe model loads from public CDNs and requires internet on first load. The score is entertainment only, not an objective attractiveness measurement.