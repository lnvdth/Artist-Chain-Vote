# Artist Chain Vote

A simple artist voting app built with React, Vite, and TypeScript, using Firebase Auth and Firestore. Each vote stores a `previousHash` and `hash` to simulate a lightweight blockchain-style vote chain.

<p align="center"> 
<img src="https://raw.githubusercontent.com/lnvdth/Artist-Chain-Vote/refs/heads/main/preview.png"></img>
</p>

## Features
- Firebase authentication
- One vote per user
- Realtime vote updates
- Leaderboard and vote history
- Admin / user roles
- Auto-seeded artist list

## Tech Stack
- React 19
- TypeScript
- Vite
- Firebase Auth
- Firestore
- CryptoJS

## Run locally

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

## Configuration
The project loads Firebase settings from `firebase-applet-config.json`.

Notes:
- configure `firestore.rules` before running
- the admin email is currently hard-coded in `src/App.tsx`
- if you change the admin account, update both `src/App.tsx` and `firestore.rules`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Main structure

```bash
src/
  components/
  services/blockchain.ts
  App.tsx
  firebase.ts
  types.ts
```

## Note
This is a demo project that simulates blockchain behavior with a hash chain stored in Firestore. It is not a real decentralized blockchain.
