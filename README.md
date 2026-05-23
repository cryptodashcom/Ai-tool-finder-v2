# AI Tool Finder v2

A Next.js application for discovering and managing AI tools.

## Prerequisites

- Node.js 18+
- npm or yarn
- A [Zernio](https://zernio.com) API key

## Setup

### 1. Clone and install dependencies

```bash
git clone https://github.com/cryptodashcom/ai-tool-finder-v2.git
cd ai-tool-finder-v2
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set your `ZERNIO_API_KEY` along with the other required variables.

#### Setting the API key temporarily (without editing .env)

**Windows PowerShell:**
```powershell
$env:ZERNIO_API_KEY="your_api_key_here"
```

**Windows Command Prompt:**
```cmd
set ZERNIO_API_KEY=your_api_key_here
```

**macOS / Linux (bash/zsh):**
```bash
export ZERNIO_API_KEY="your_api_key_here"
```

> **Note:** These commands set the variable only for the current terminal session. For a permanent setup, add the variable to your `.env` file.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

## Environment Variables

See [`.env.example`](./.env.example) for all required environment variables and descriptions.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history.
