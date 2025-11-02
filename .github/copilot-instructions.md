# MoneyLens AI Coding Guidelines

## Architecture Overview

MoneyLens is a full-stack expense tracking application with a 3-tier architecture:

- **Frontend**: React with React Router v7 for SSR, using Vite and TailwindCSS for styling.
- **Backend**: Node.js/Express with TypeScript, serving REST APIs.
- **Database**: MongoDB with Mongoose ODM for data persistence.

Key data flows: Frontend components fetch data via API calls to Express routes, which query MongoDB models. See `backend/server.ts` for server setup and `frontend/app/routes.ts` for client routing.

## Development Workflows

- **Backend**: Run `cd backend && npm run dev` for hot-reload development (uses `tsx` with watch mode). Ensure MongoDB is running locally or set `MONGO_URI` env var.
- **Frontend**: Run `cd frontend && npm run dev` for SSR development server. Build with `npm run build`.
- **Full app**: Start backend first (port 3000), then frontend (port 5173). No integrated dev script.
- **Type checking**: Frontend uses `npm run typecheck` (includes React Router typegen).

## Project Conventions

- **`DOCUMENTATIONS.md`**: Always refer to `documentations.md` file for project features, requirements, guidelines and best practices.
- **TypeScript**: Strict mode enabled in both `backend/tsconfig.json` and `frontend/tsconfig.json`. Use interfaces for Mongoose models (e.g., `IUser` in `backend/models/user.ts`).
- **Path aliases**: Frontend uses `~/*` for `./app/*` imports (configured in `vite.config.ts` and `tsconfig.json`).
- **Backend structure**: Organize by `routes/` (Express routers), `controllers/` (business logic), `models/` (Mongoose schemas). Example: `routes/user.ts` defines `/users` endpoints, handled by `controllers/userController.ts`.
- **Frontend structure**: Routes in `app/routes/`, components in `app/`. Use React Router's file-based routing (e.g., `routes.ts` exports route config).
- **Styling**: TailwindCSS classes directly in JSX (e.g., `className="flex items-center"` in `welcome/welcome.tsx`).
- **API patterns**: Controllers use async/await for Mongoose queries, return JSON responses. Example: `getUsers` in `userController.ts` fetches all users.
- **No auth yet**: Planned JWT-based auth (per docs), but current code lacks implementation.
- **Database**: Schemas with required fields and defaults (e.g., `createdAt` in `user.ts`). Use `mongoose.connect` in `server.ts`.

## Integration Points

- **MongoDB connection**: Established in `backend/server.ts` on app start.
- **Cross-component comms**: Frontend fetches from backend APIs (e.g., planned expense endpoints). No WebSockets yet.
- **External deps**: Minimal - only Mongoose, Express. No external APIs integrated.

## Key Files

- `backend/server.ts`: Main server entry, routes mounting.
- `backend/models/user.ts`: Example Mongoose model with schema.
- `frontend/app/root.tsx`: Root layout with error boundary.
- `frontend/app/routes.ts`: Route definitions.
- `DOCUMENTATIONS.md`: Detailed project specs (note: some features like expenses/charts not yet implemented in code).</content>
  <parameter name="filePath">/Users/mac/Documents/Sem3/MoneyLens/.github/copilot-instructions.md
