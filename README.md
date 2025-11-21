# Here are your Instructions

SETUP:
Backend:
pip install -r requirements.txt

Frontend:
yarn install

LOCAL RUN:
1. duplicate .env.copy
2. run in terminal:
Terminal 1 — Backend:
cd backend
. .venv/bin/activate
uvicorn server:app --reload --host 127.0.0.1 --port 8000

Terminal 2 — Frontend:
cd frontend
yarn start


PUBLISH FRONTEND BUILD:
yarn build


HOST CONFIG:
1. Backend:
Language: Python 3
Root Directory: ./backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn server:app --host 0.0.0.0 --port $PORT
2. Frontend:
Root Directory: ./frontend
Build Command: yarn build or npm run build
Publish Directory: build/



verify frontend .env points to localhost:
REACT_APP_BACKEND_URL=http://127.0.0.1:8000