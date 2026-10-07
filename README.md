# authn-authz

Ett API för autentisering och auktorisering, byggt med Express, Prisma (PostgreSQL), bcrypt och JWT.

## Innehåll

- [Kom igång](#kom-igång)
- [Miljövariabler](#miljövariabler)
- [Endpoints](#endpoints)
  - [GET /](#get-)
  - [POST /auth/register](#post-authregister)
  - [POST /auth/login](#post-authlogin)
- [Använda JWT-token](#använda-jwt-token)
- [Datamodell](#datamodell)
- [CORS](#cors)

## Kom igång

### Med Docker

```bash
docker compose up --build
```

API:t blir tillgängligt på `http://localhost:3001` (port 3001 på värden mappas till port 3000 i containern).

Sätt `MODE=development` för att köra med `nodemon` (automatisk omstart vid ändringar).

### Lokalt

```bash
npm install
npx prisma generate
npm run dev     # utveckling (nodemon)
npm start       # produktion
```

API:t körs då på `http://localhost:3000` (eller den port som anges i `PORT`).

## Miljövariabler

Skapa en `.env`-fil i projektets rot:

| Variabel       | Beskrivning                                                   | Standard |
| -------------- | ------------------------------------------------------------- | -------- |
| `PORT`         | Porten servern lyssnar på                                     | `3000`   |
| `DATABASE_URL` | Anslutningssträng till PostgreSQL                             | –        |
| `JWT_SECRET`   | Hemlig nyckel som används för att signera JWT-token           | –        |
| `MODE`         | `development` startar med `nodemon`, annars `npm start` (Docker) | –     |

Exempel:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/authdb
JWT_SECRET=byt-ut-mot-en-lang-slumpmassig-strang
MODE=development
```

## Endpoints

Alla request- och response-kroppar är JSON. Skicka `Content-Type: application/json` i anrop med body.

### GET /

Enkel hälsokontroll.

**Response `200 OK`**

```json
{ "msg": "Auth-API" }
```

---

### POST /auth/register

Skapar en ny användare. Lösenordet hashas med bcrypt innan det sparas.

**Request body**

| Fält       | Typ    | Krav                                            |
| ---------- | ------ | ----------------------------------------------- |
| `username` | string | Obligatoriskt, minst 1 tecken (trimmas), unikt  |
| `password` | string | Obligatoriskt, minst 1 tecken                   |

```json
{
  "username": "John Doe",
  "password": "Password123"
}
```

**Responses**

`201 Created` – användaren skapades

```json
{
  "message": "User created successfully",
  "user": {
    "id": 1,
    "username": "John Doe"
  }
}
```

`400 Bad Request` – `username` eller `password` saknas/är tomt

```json
{ "message": "Username and password are required" }
```

`400 Bad Request` – användarnamnet är redan taget eller annat fel vid skapandet

```json
{ "message": "Invalid request" }
```

---

### POST /auth/login

Loggar in en användare och returnerar en JWT.

**Request body**

| Fält       | Typ    | Krav                          |
| ---------- | ------ | ----------------------------- |
| `username` | string | Obligatoriskt, minst 1 tecken |
| `password` | string | Obligatoriskt, minst 1 tecken |

```json
{
  "username": "John Doe",
  "password": "Password123"
}
```

**Responses**

`200 OK` – inloggningen lyckades

```json
{
  "message": "Login succesfull",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

`400 Bad Request` – `username` eller `password` saknas/är tomt

```json
{ "message": "Username and password are required" }
```

`401 Unauthorized` – fel användarnamn eller lösenord

```json
{ "message": "Invalid credentials" }
```

`500 Internal Server Error`

```json
{ "message": "Internal server error" }
```

## Använda JWT-token

Token signeras med `JWT_SECRET` (HS256) och är giltig i **30 dagar**. Payload:

```json
{
  "sub": 1,
  "username": "John Doe",
  "iat": 1700000000,
  "exp": 1702592000
}
```

Klienter skickar normalt token i `Authorization`-headern:

```
Authorization: Bearer <token>
```

## Datamodell

Tabellen `users` (PostgreSQL, via Prisma):

| Kolumn       | Typ       | Beskrivning                      |
| ------------ | --------- | -------------------------------- |
| `id`         | Int       | Primärnyckel, autoincrement      |
| `username`   | VarChar   | Unikt                            |
| `password`   | VarChar   | bcrypt-hash (10 salt rounds)     |
| `created_at` | Timestamp | Sätts vid skapande               |
| `updated_at` | Timestamp | Uppdateras automatiskt           |

## CORS

Anrop tillåts från följande origins:

- `http://localhost:5173`
- `https://people.arcada.fi`
- `http://people.arcada.fi`

## Testa API:t

`src/test/authentication.http` innehåller färdiga anrop för VS Code-tillägget REST Client.

Med curl:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"John Doe","password":"Password123"}'

curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"John Doe","password":"Password123"}'
```
