# Simple Backend Task

A simple Flask backend with a basic users API.

## Setup

```bash
pip install -r requirements.txt
python app.py
```

The server will start at `http://127.0.0.1:5000`.

## Endpoints

- `GET /` — returns a hello message
- `GET /users` — returns the list of users
- `POST /users` — adds a new user (JSON body: `{"name": "Alice"}`)

## Your Task

Add a new endpoint:

- `DELETE /users/<id>` — deletes a user by their `id`

Return `{"message": "deleted"}` if successful, or `{"error": "not found"}` with status `404` if the user doesn't exist.
