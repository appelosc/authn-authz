# authn-authz

An API for authentication and authorization, built with Express, Prisma (PostgreSQL), bcrypt and JWT.

It issues the JWTs used by the Notes Board App ([REST-api-notes](https://github.com/appelosc/REST-api-notes), [notes-frontend](https://github.com/appelosc/notes-frontend)). The `project2` branch adds refresh tokens (`POST /auth/refresh` and `POST /auth/logout`), which the Clipboard Sync App ([websocket](https://github.com/appelosc/websocket), [websocket-frontend](https://github.com/appelosc/websocket-frontend), [electron-websocket](https://github.com/appelosc/electron-websocket)) uses. This README describes the `main` branch.

## Contents

- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Endpoints](#endpoints)
  - [GET /](#get-)
  - [POST /auth/register](#post-authregister)
  - [POST /auth/login](#post-authlogin)
- [Using the JWT](#using-the-jwt)
- [Data model](#data-model)
- [CORS](#cors)
- [Testing the API](#testing-the-api)

## Getting started

### With Docker

```bash
docker compose up --build
```

The API is available at `http://localhost:3001` (port 3001 on the host maps to port 3000 in the container).

Set `MODE=development` to run with `nodemon` (automatic restart on changes).

### Locally

```bash
npm install
npx prisma generate
npm run dev     # development (nodemon)
npm start       # production
```

The API then runs at `http://localhost:3000` (or the port set in `PORT`).

## Environment variables

Create a `.env` file in the project root:

| Variable       | Description                                                         | Default |
| -------------- | ------------------------------------------------------------------- | ------- |
| `PORT`         | Port the server listens on                                          | `3000`  |
| `DATABASE_URL` | PostgreSQL connection string                                        | –       |
| `JWT_SECRET`   | Secret key used to sign JWTs                                        | –       |
| `MODE`         | `development` starts with `nodemon`, otherwise `npm start` (Docker) | –       |

Example:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/authdb
JWT_SECRET=replace-with-a-long-random-string
MODE=development
```

## Endpoints

All request and response bodies are JSON. Send `Content-Type: application/json` in requests with a body.

### GET /

Simple health check.

**Response `200 OK`**

```json
{ "msg": "Auth-API" }
```

---

### POST /auth/register

Creates a new user. The password is hashed with bcrypt before it is stored.

**Request body**

| Field      | Type   | Requirements                                     |
| ---------- | ------ | ------------------------------------------------ |
| `username` | string | Required, at least 1 character (trimmed), unique |
| `password` | string | Required, at least 1 character                   |

```json
{
  "username": "John Doe",
  "password": "Password123"
}
```

**Responses**

`201 Created`: the user was created

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "John Doe"
  }
}
```

`400 Bad Request`: `username` or `password` is missing or empty

```json
{ "message": "Username and password are required" }
```

`400 Bad Request`: the username is already taken, or another error occurred during creation

```json
{ "message": "Invalid request" }
```

---

### POST /auth/login

Logs a user in and returns a JWT.

**Request body**

| Field      | Type   | Requirements                   |
| ---------- | ------ | ------------------------------ |
| `username` | string | Required, at least 1 character |
| `password` | string | Required, at least 1 character |

```json
{
  "username": "John Doe",
  "password": "Password123"
}
```

**Responses**

`200 OK`: the login succeeded

```json
{
  "message": "Login succesfull",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

`400 Bad Request`: `username` or `password` is missing or empty

```json
{ "message": "Username and password are required" }
```

`401 Unauthorized`: wrong username or password

```json
{ "message": "Invalid credentials" }
```

`500 Internal Server Error`

```json
{ "message": "Internal server error" }
```

## Using the JWT

The token is signed with `JWT_SECRET` (HS256) and is valid for **30 days**. Payload:

```json
{
  "sub": 1,
  "username": "John Doe",
  "iat": 1700000000,
  "exp": 1702592000
}
```

Clients normally send the token in the `Authorization` header:

```
Authorization: Bearer <token>
```

## Data model

The `users` table (PostgreSQL, via Prisma):

| Column       | Type      | Description                  |
| ------------ | --------- | ---------------------------- |
| `id`         | Int       | Primary key, autoincrement   |
| `username`   | VarChar   | Unique                       |
| `password`   | VarChar   | bcrypt hash (10 salt rounds) |
| `created_at` | Timestamp | Set on creation              |
| `updated_at` | Timestamp | Updated automatically        |

## CORS

Requests are allowed from the following origins:

- `http://localhost:5173`
- `https://people.arcada.fi`
- `http://people.arcada.fi`

## Testing the API

`src/test/authentication.http` contains ready-made requests for the VS Code extension REST Client.

With curl:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"John Doe","password":"Password123"}'

curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"John Doe","password":"Password123"}'
```
