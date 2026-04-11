# Smart Emergency Help & Coordination System

Full-stack emergency coordination platform using Flask, SQLite, React, Vite, TailwindCSS, and Flask-SocketIO.

## Local SQLite Setup

1. No database server is required for local development.
2. Set `DATABASE_URL` in `.env`:

```env
DATABASE_URL=sqlite:///smart_emergency.db
```

## Backend Setup

1. Go to backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run backend:

```bash
flask run
```

or

```bash
python app.py
```

Backend default URL: `http://localhost:5000`

If you want PostgreSQL later, change `DATABASE_URL` to a PostgreSQL connection string. SQLite is the default local path now.

Socket.IO runs in threading mode for local development, so you do not need `eventlet` to start the app on Windows/Python 3.14.

## Frontend Setup

1. Go to frontend folder:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Run frontend:

```bash
npm run dev
```

Frontend default URL: `http://localhost:5173`

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

### Emergency

- `POST /api/emergency/create`
- `GET /api/emergency/all`
- `GET /api/emergency/my`
- `GET /api/emergency/<id>`
- `PUT /api/emergency/<id>/accept`
- `PUT /api/emergency/<id>/reject`
- `PUT /api/emergency/<id>/complete`
- `PUT /api/emergency/<id>/cancel`

### Helper

- `GET /api/helper/profile`
- `PUT /api/helper/profile`
- `PUT /api/helper/toggle-availability`
- `GET /api/helper/available`

### Notification

- `GET /api/notification/messages/<request_id>`
- `GET /api/notification/history`

### Utility

- `GET /api/health`

## Socket Events

### Client -> Server

- `join_room` payload: `{ request_id }`
- `send_message` payload: `{ request_id, sender_id, content }`
- `leave_room` payload: `{ request_id }`

### Server -> Client

- `joined`
- `receive_message`
- `new_emergency_request`
- `request_status_updated`
- `helper_availability_updated`

### Connection Lifecycle

- `connect`
- `disconnect`
