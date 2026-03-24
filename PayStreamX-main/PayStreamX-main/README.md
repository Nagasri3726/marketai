# PayStreamX

Decentralized payroll streaming platform built on Algorand blockchain.

## Tech Stack

- **Frontend:** React.js + Tailwind CSS (Vite)
- **Backend:** Django REST Framework
- **Blockchain:** Algorand Smart Contracts (PyTeal)
- **Database:** SQLite (dev) / PostgreSQL (production)
- **Auth:** JWT (SimpleJWT)
- **Real-time:** WebSockets (Django Channels)

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Features

- Employer/Employee role-based authentication
- Real-time salary streaming with live earnings counter
- Milestone-based payments
- Algorand wallet creation and management
- WebSocket-powered notifications
- Full payment history and audit logs
- Dark fintech UI with glassmorphism design
