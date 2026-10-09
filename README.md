# Cluadestrate
AI Fleet in one center.

Cluadestrate is a local dashboard for Claude Code sessions, MCP processes, Git operations, workflows, and remote host agents. This repository contains a Next.js frontend, a Hono and Socket.IO backend, and a separate host agent. It is a prototype: several orchestration and infrastructure screens still use simulated behavior.

## Requirements

- Node.js 22 or later and npm.
- Git for the Git dashboard.
- Claude Code installed and authenticated before starting a real session. `CLAUDE_BINARY_PATH` can select its executable.
- Any MCP executables configured by the operator.

Starting the dashboard does not require starting Claude Code or an MCP server. Provider sessions and integrations need their own credentials and can incur charges.

## Install and run

From the repository root:

```sh
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npm --prefix agent ci
```

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local` if configuration is needed. The backend scripts load `backend/.env`; Next.js loads the frontend environment. A root `.env` is not loaded by these scripts.

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API and browser socket use port 3001. Both the API and agent transport bind to the backend's loopback address. `HOST` accepts only `127.0.0.1`, `localhost`, or `::1`. Browser requests must originate from `http://localhost:3000` or `http://127.0.0.1:3000`.

Production build commands, after resolving the current frontend type errors:

```sh
npm run build
npm start
```

The frontend build downloads the configured Google fonts and requires network access. Build the optional host agent separately with `npm --prefix agent run build`; see [agent instructions](agent/README.md).

The frontend bundles successfully but currently fails TypeScript validation with 76 diagnostics in eight existing pages: auto-update, bots, email, file-sync, mcp-hosts, n8n, supervisors, and workflow-builder. These pages call missing API helpers or pass incompatible payloads. A production frontend server has not been validated. The backend and host agent compile separately, and their isolated regression and backend startup tests pass. The initial full frontend lint check reported 389 errors and 68 warnings in existing source; these findings are not suppressed.

## Local access and remote agents

The dashboard API has no user login or authorization layer and can run processes, edit local files, and store integration credentials. Keep it on a trusted workstation and do not expose the API or Socket.IO service through a public proxy. JSON data under `backend/data` is not encrypted; restrict filesystem access and exclude it from shared backups or commits. Some managers keep state only in memory.

Agents require a nonempty token explicitly configured in `AGENT_AUTH_TOKENS` in `backend/.env`. There is no default development token. Use a random secret and set the same value in the agent's `server.authToken`. Multiple backend tokens may be separated with commas. Do not put agent or provider secrets in `NEXT_PUBLIC_*` variables.

For an agent on another machine, use an authenticated tunnel terminating at the central backend's loopback port and configure the agent with the tunnel's local URL. For example, run this on the agent machine with the central machine's SSH host:

```sh
ssh -N -L 3001:127.0.0.1:3001 central-host
```

The agent then connects to `ws://127.0.0.1:3001` using Socket.IO's `/agent` namespace. Agent commands include shell execution, log reading, screenshots, and reboot; treat the central workstation and authorized operators as fully trusted. Service installation and reboot require separate operator action.

## Current limits

- Terminal endpoints maintain metadata and echo input; they do not create a terminal process.
- Backend screenshots, thumbnails, remote discovery, auto-updates, and supervisor model execution contain placeholder or simulated behavior.
- Agent `update` and `sync_files` responses are placeholders. Its screenshot support is platform dependent.
- Usage costs and token counters are estimates, not provider billing records.
- Git's command endpoint supports the dashboard quick commands: `git status`, `git pull`, `git fetch`, `git add .`, `git stash`, and `git stash pop`. Run other Git operations in a trusted terminal.
- Synced file paths must be relative to their folder. Parent traversal, absolute paths, NTFS stream paths, and symbolic links are rejected.
- Packaged executables and privileged services need validation on their target operating systems. Do not assume a release binary exists.
- The agent's legacy `pkg` packaging tool and its dependency chain have high-severity npm advisories without a compatible fix. Runtime dependencies can be checked separately with `npm --prefix agent audit --omit=dev`; a passing runtime audit does not clear the packaging-tool findings.
- The frontend ESLint toolchain also retains five high-severity advisory entries involving `braces`. npm's suggested downgrade to an older Next.js ESLint configuration is incompatible with the current framework and has not been applied.

## Validation

```sh
npm test
npm --prefix backend run build
npm --prefix backend run test:smoke
npm --prefix agent run build
npm --prefix frontend run build
npm --prefix frontend run lint
npm --prefix backend audit
npm --prefix frontend audit
npm --prefix agent audit
```

The regression tests use temporary Git and file fixtures and a loopback Socket.IO server with a stub host manager. They do not start provider sessions, run remote shell commands, capture the screen, install services, reboot a machine, or contact external integrations.
