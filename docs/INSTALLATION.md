Installation
=====

For general information about the project check out [README.md](https://github.com/bberkay/chess/tree/main).

## Prerequisites

- [Git](https://git-scm.com/)
- **Option 1:** [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- **Option 2:** [Bun](https://bun.sh/) (for local development)

## Quick Start with Docker (Recommended)

1. Clone the repository.
   ```bash
   git clone https://github.com/bberkay/chess.git
   cd chess
   ```

2. Set up environment variables.
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

3. Run with Docker Compose.
   ```bash
   docker-compose up --build
   ```

## Local Development Setup

### Server Setup

1. Navigate to server directory.
   ```bash
   cd server
   ```

2. Copy environment file and configure.
   ```bash
   cp .env.example .env
   ```

3. Install dependencies.
   ```bash
   bun install
   ```

4. Run the server.
   ```bash
   bun run main
   ```

### Client Setup

1. Navigate to client directory (open new terminal).
   ```bash
   cd client
   ```

2. Copy environment file and configure.
   ```bash
   cp .env.example .env
   ```

3. Install dependencies.
   ```bash
   bun install
   ```

4. Run the client.

   Development mode:
   ```bash
   bun run dev
   ```

   Production build and preview:
   ```bash
   bun run build && bun run preview
   ```

## Environment Configuration

### Server Environment Variables

Edit `server/.env` file:

```env
# Connection Limits
MAX_PAYLOAD_LENGTH=25600
MAX_IDLE_TIMEOUT=960

# Server Config
SERVER_PORT=3000
CORS_ORIGIN=*  # For development: *, For production: https://your-frontend-domain.com
```

or you can also create `.env.production` and `.env.development` files:
```env
# .env.development
# Server Config
SERVER_PORT=3000
CORS_ORIGIN=*
```
```env
# .env.production
# Server Config
SERVER_PORT=3000
CORS_ORIGIN=https://your-frontend-domain.com
```


### Client Environment Variables

Edit `client/.env` file:

```env
# Project Info
VITE_REPOSITORY_URL=https://github.com/bberkay/chess

# Server Connections
VITE_SERVER_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```
or like in the server, you can also create `.env.production` and `.env.development` files:
```env
# .env.development
# Server Connections
VITE_SERVER_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```
```env
# .env.production
# Server Connections
VITE_SERVER_URL=https://your-frontend-domain.com
VITE_WS_URL=wss://your-frontend-domain.com
```

## Accessing the Application
> Make sure to check your `docker-compose.yml` and environment files for port configurations.

- **Client (Frontend):** http://localhost:4173
- **Server (Backend API):** http://localhost:3000
