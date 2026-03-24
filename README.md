# API Pad

A lightweight, open-source API client for the browser. Test HTTP APIs without installing anything.

**[Try it live](https://apipad-web.vercel.app)** | **[Desktop version](https://github.com/codewprincee/devkit)**

## Features

- **HTTP methods** — GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
- **Request builder** — headers, query params, body (JSON, text, form)
- **Authentication** — Bearer token, Basic auth, API key (header or query)
- **Collections** — organize requests into folders and collections
- **Environments** — variable interpolation with `{{variable}}` syntax
- **History** — automatic request/response history with replay
- **Import** — Postman and Insomnia collection import
- **Server-side proxy** — requests go through a proxy to bypass CORS
- **Responsive** — works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS 4 |
| Storage | localStorage (no account needed) |
| Proxy | Next.js API route (server-side fetch) |

## Development

```sh
git clone https://github.com/codewprincee/apipad.git
cd apipad
npm install
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

## How the CORS proxy works

Browser `fetch()` is blocked by CORS for most APIs. API Pad routes requests through a Next.js API route (`/api/proxy`) that makes the request server-side, bypassing CORS entirely.

Security: requests to `localhost`, private IPs, and cloud metadata endpoints are blocked. Response bodies are capped at 1MB. Requests time out after 30 seconds.

## Part of DevKit

API Pad is one of five tools in [DevKit](https://github.com/codewprincee/devkit), an open-source developer toolbox:

- **PortMan** — port management
- **EnvGuard** — .env file management
- **API Pad** — API testing (this repo)
- **LogLens** — log viewer
- **DevDash** — service dashboard

## License

[AGPL-3.0](https://github.com/codewprincee/devkit/blob/main/LICENSE)
