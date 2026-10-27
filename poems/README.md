# Poetic Musings — web app

The Angular 21 app behind [poeticmusings.web.app](https://poeticmusings.web.app).
See the [project README](../README.md) for the tour, architecture and credits.

```bash
npm install
npm start          # http://localhost:4202 (generates public/data on first run)
npm test           # unit tests (Vitest)
npm run build      # production build → dist/poems/browser
npm run deploy     # build + firebase deploy --only hosting (project: poeticmusings)

npm run data       # rebuild public/data + public/portraits from ../scripts
npm run bios       # refresh poet biographies from Wikipedia → ../scripts/bios.json
npm run icons      # regenerate home-screen icons from public/logo.svg
```
