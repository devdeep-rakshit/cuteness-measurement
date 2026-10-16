# Cuteness Measurement 🎀

A mobile-first React camera app with cute filters, a 15-second cuteness meter, photo capture, and PNG saving.

## Face detection

The app uses the browser-based Tiny Face Detector from [@vladmandic/face-api](https://github.com/vladmandic/face-api), adapted from the face-api.js ecosystem and the MIT-licensed [Benson Ruan Face-Detection project](https://github.com/bensonruan/Face-Detection).

The GitHub Pages workflow downloads the model weights at build time into the site's own `public/models` folder. The deployed app loads the model from the same website, not from a runtime CDN. Face detection runs in the browser; camera frames are not uploaded by this app.

## Development

```bash
npm install
npm run dev
```

For local development, download these two files into `public/models/` before opening the camera:
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`

The GitHub Pages workflow fetches them automatically before building.
