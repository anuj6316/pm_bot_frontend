# PM Bot Frontend

A React frontend application for the PM Bot, built with Vite and Tailwind CSS.

## Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

## Setup & Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Environment Variables:
   Create a `.env.local` file in the root directory. You can set the following variables if you need to override the defaults:
   ```env
   VITE_API_BASE_URL=http://localhost:8002
   VITE_WS_BASE_URL=ws://localhost:8002
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000` (or `http://localhost:5173`).

## Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production to the `dist` folder.
- `npm run preview`: Locally preview the production build.
- `npm run lint`: Run TypeScript type-checking.

## Tech Stack
- React 19
- React Router DOM
- Vite
- Tailwind CSS
