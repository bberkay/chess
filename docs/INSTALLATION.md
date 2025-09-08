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
   cp server/.env.development.example server/.env.development
   cp client/.env.development.example client/.env.development
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
   cp .env.development.example .env.development
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
   cp .env.development.example .env.development
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

## Accessing the Application
> Make sure to check your `docker-compose.yml` and environment files for port configurations.

- **Client (Frontend):** http://localhost:4173
- **Server (Backend API):** http://localhost:3000
