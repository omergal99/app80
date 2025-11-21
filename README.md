# Here are your Instructions
Terminal 1 — Backend:
cd backend
. .venv/bin/activate
uvicorn server:app --reload --host 127.0.0.1 --port 8000

Terminal 2 — Frontend:
cd frontend
# First, verify frontend .env points to localhost:
# REACT_APP_BACKEND_URL=http://127.0.0.1:8000
yarn start

