# Regalium — independent Vercel + Neon migration

This branch removes the AppDeploy runtime and replaces it with Vercel serverless API routes and Neon PostgreSQL. The production AppDeploy deployment and `main` branch are intentionally left untouched while this migration is tested.

## Architecture

- **Frontend:** existing React + Vite application, deployed to Vercel.
- **API:** Vercel Node.js functions under `api/`.
- **Database:** Neon PostgreSQL, accessed server-side with `@neondatabase/serverless`.
- **Blockchain:** Polygon Amoy (chain ID 80002); wallet signing remains in the user's wallet.
- **Persistence:** only a successfully verified presale transaction and its public on-chain purchase details are stored.

## Local setup

1. Install dependencies once after pulling this branch:

   ```bash
   npm install
   ```

2. Create a Neon PostgreSQL project/database at [neon.com](https://neon.com/).
3. In the Neon SQL Editor, run the complete contents of `database/schema.sql`.
4. Copy `.env.example` to `.env.local` and set `DATABASE_URL` to the Neon connection string. Keep this variable server-side; do not use a `VITE_` prefix.
5. Optionally set `POLYGON_AMOY_RPC_URL` to a reliable Amoy RPC endpoint. The public Polygon Amoy endpoint is the default.
6. Run `npm run dev` for the frontend. To exercise Vercel API functions locally, use the Vercel CLI with the project's environment variables.

## Vercel configuration

Import this repository/branch into Vercel using the Vite framework preset. Add these environment variables to the Vercel project:

- `DATABASE_URL` — Neon PostgreSQL connection string (Production, Preview and Development as appropriate).
- `POLYGON_AMOY_RPC_URL` — optional Polygon Amoy JSON-RPC URL.

Vercel builds the frontend with `npm run build`; its Node.js functions are discovered automatically from `api/`. No service-role key or database credential belongs in browser code.

## API routes retained

- `GET /api/_healthcheck` — checks Neon connectivity.
- `GET /api/config` — public Polygon Amoy and contract configuration.
- `GET /api/presale/quote?pol=1` — reads the live `rate()` value from the deployed presale contract.
- `GET /api/transactions/:hash` — reads transaction and receipt status from Polygon Amoy.
- `POST /api/presale/verify` — verifies sender, presale destination, successful receipt and RGLM Transfer event before persisting the purchase.
- `GET /api/presale/history/:wallet` — returns up to 50 verified purchase records for the requested wallet address.

## Database and security notes

- `tx_hash` is the primary key, preventing duplicate purchase records.
- The server validates wallet and transaction formats and independently verifies the transaction against Polygon Amoy before writing.
- Only the Neon connection string is secret; it is never exposed to the Vite client.
- Purchase history contains public blockchain transaction details and is scoped to the wallet address in the route. Do not add personal information to this table.
- The API does not request, receive or store wallet private keys or seed phrases.
- The frontend service worker explicitly bypasses `/api/` so live quotes, health checks and transaction responses are never cached as static assets.

## Migration acceptance checks

1. `npm run build` succeeds.
2. Health endpoint reports database online after Neon schema and environment variables are configured.
3. Quote endpoint returns the on-chain presale rate on Amoy.
4. Wallet discovery, chain switching, purchase submission and receipt polling still work.
5. Verification rejects wrong sender, wrong destination, failed receipts and missing RGLM Transfer events.
6. Repeated verification of the same transaction does not create duplicate rows.
7. Purchase history returns only records for the requested wallet.
8. Confirmed on-chain purchases remain shown as confirmed if API/database verification is temporarily unavailable.
9. Test desktop and mobile wallet browsers before switching production traffic.

Do not retire the old AppDeploy deployment or merge this branch into `main` until the independent Vercel + Neon deployment passes these checks.
