This is Cluadestrate's Next.js dashboard. Application routes are in `src/app`, API helpers in `src/lib/api.ts`, and the browser Socket.IO connection in `src/lib/socket.ts`.

## Getting Started

Install and start the backend using the [root instructions](../README.md). From this directory, install the dashboard and start it on port 3000:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Copy `.env.example` to `.env.local` to configure API or socket URLs. Both default to `http://localhost:3001`; the socket also falls back to `NEXT_PUBLIC_API_URL`. Public environment variables are embedded in browser code, so they must not contain secrets.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Build and checks

```sh
npm run build
npm start
npm run lint
npm audit
```

The build downloads the Google fonts configured in `src/app/layout.tsx`. Serve the dashboard locally: the backend supports only loopback access and the two default port-3000 browser origins. A frontend deployment by itself does not provide an authenticated public orchestration service.

The production build passes, and lint reports no errors and 76 warnings. The API helpers use shared backend model types and map serialized dates to strings. The backend smoke suite calls these helpers against a real compiled loopback backend to exercise CRUD and payload contracts. The five remaining dependency advisories are in the development ESLint toolchain; npm's suggested downgrade to an older framework configuration is incompatible with the current Next.js version.

Several screens expose prototype features. The workflow builder supports stored canvases, node creation and deletion, graph validation, and export; dragging, connection editing, and zoom controls remain previews. The n8n screen has webhook counters, but no per-request history or individual webhook test endpoint. Agent installation uses source-build instructions because generated binary download scripts are unavailable. See the root README for the full limits.
