# BoardRoom API

BoardRoom is a REST API for small group collaboration. Users create rooms, invite others with a link, approve join requests in a lobby, and work together on shared boards (strokes, shapes, text and sticky notes) and a room chat.

Built with NestJS, TypeORM and PostgreSQL for CSC4161 Advance Programming in Web Technology, Section E.

## Requirements

- Node.js 22 or later
- pnpm
- PostgreSQL (and pgAdmin to look at the tables)

## Setup

1. Clone the repository and install packages

   ```bash
   git clone https://github.com/iftiabrar/Boardroom.git
   cd Boardroom
   pnpm install
   ```

2. Copy `.env.example` to `.env` and fill in your own values (database password, JWT secret, Mailtrap login)

   ```bash
   cp .env.example .env
   ```

3. In pgAdmin create an empty database named `boardroom`

4. Build the tables and create the admin account

   ```bash
   pnpm migration:run
   pnpm seed:admin
   ```

5. Start the server

   ```bash
   pnpm start:dev
   ```

## API docs

- Base URL: `http://localhost:5001/api/v1`
- Swagger UI: `http://localhost:5001/api/docs`

Click **Authorize** in Swagger and paste the `access_token` from the login response.

## Demo admin login

Taken from `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`. The defaults in `.env.example` are:

- Email: `admin@boardroom.test`
- Password: `Admin@12345`

## Response format

Success:

```json
{ "success": true, "message": "Logged in", "data": { }, "meta": null }
```

Error:

```json
{ "success": false, "statusCode": 409, "error": "Conflict", "message": "Email is already registered", "path": "/api/v1/auth/register", "timestamp": "..." }
```

## Team

| Member | Part |
| --- | --- |
| Abrar Faiaz Siddiquy | Auth, Users, Audit log, common layer |
| Syeda Faiza Nawar | Rooms and Members |
| Abyed Rahman Rokon | Boards, Board elements, Messages |
| MD. Sadman Islam Shams | Invites, Lobby, Mail |
