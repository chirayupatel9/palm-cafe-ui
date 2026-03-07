# Palm Cafe UI (TypeScript)

Full TypeScript port of `palm-cafe-ui`. All source under `src/` is TypeScript/TSX; original JS project is unchanged.

## Setup

```bash
npm install
```

Create `.env` with `REACT_APP_API_URL` (e.g. `http://localhost:5000`) if needed.

## Run

```bash
npm start
```

## Build

```bash
npm run build
```

Build uses `react-scripts` with an override for `fork-ts-checker-webpack-plugin@8.0.0` so the build completes on current Node. The production bundle is output to `build/`.

## Structure

- **Entry:** `src/index.tsx`, `src/App.tsx`, `src/react-app-env.d.ts`
- **Components:** All under `src/components/` and `src/components/ui/` as `.tsx`
- **Contexts:** `src/contexts/` as `.tsx`
- **Hooks:** `src/hooks/` as `.ts`
- **Utils:** `src/utils/`, `src/lib/`, `src/theme/` as `.ts`/`.tsx`
- **Styles:** `src/index.css`, `src/theme/theme.css` unchanged

Type-check only: `npx tsc --noEmit`
