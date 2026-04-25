# 🚛 Trip Planner — FMCSA HOS Compliant ELD Log Generator

A full-stack web application that generates **FMCSA-compliant Driver's Daily Logs (ELD)** based on trip routes, automatically calculating Hours of Service (HOS) regulations for interstate truck drivers.

**Live Demo:** [darshan439.github.io/Trip-Planner](https://darshan439.github.io/Trip-Planner/)  
**Backend API:** [trip-planner-ormo.onrender.com](https://trip-planner-ormo.onrender.com)

---

## 📸 Preview

![Driver Daily Log](frontend/preview.png)

---

## ✨ Features

- 🗺️ **Route Planning** — Enter start and end locations to calculate distance and estimated drive time
- ⏱️ **HOS Engine** — Automatically simulates trip plan following FMCSA Hours of Service regulations:
  - 11-hour driving limit
  - 14-hour duty window
  - 30-minute rest break after 8 hours of driving
  - 10-hour off-duty rest period
  - 60/70-hour weekly limit
- 📋 **FMCSA ELD Grid** — Renders a proper Driver's Daily Log graph with:
  - Off Duty, Sleeper Berth, Driving, On Duty rows
  - Hour labels (Midnight to Midnight)
  - 15-minute tick marks
  - Total hours per row
- 📝 **Remarks Section** — Auto-generates duty status change log
- 📅 **Multi-Day Support** — Navigate between days for long trips
- 📱 **Responsive** — Works on desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML, CSS, Vanilla JavaScript, Canvas API |
| Backend | Python, Django, Django REST Framework |
| Route Service | OpenRouteService API |
| Deployment (Frontend) | GitHub Pages |
| Deployment (Backend) | Render |

---

## 🏗️ Project Structure

```
Trip-Planner/
├── backend/                  # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── trip/                     # Main Django app
│   ├── views.py              # API endpoint
│   ├── hos_engine.py         # HOS simulation logic
│   ├── route_service.py      # Route calculation
│   └── urls.py
├── frontend/                 # Frontend source files
│   ├── index.html
│   ├── script.js             # ELD drawing + API calls
│   └── style.css
├── index.html                # Root (GitHub Pages)
├── script.js                 # Root (GitHub Pages)
├── style.css                 # Root (GitHub Pages)
├── Procfile                  # Render deployment
├── requirements.txt          # Python dependencies
└── manage.py
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Python 3.10+
- pip

### 1. Clone the repository
```bash
git clone https://github.com/Darshan439/Trip-Planner.git
cd Trip-Planner
```

### 2. Create virtual environment
```bash
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Mac/Linux
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the backend
```bash
python manage.py runserver
```
Backend runs at `http://127.0.0.1:8000`

### 5. Run the frontend
```bash
cd frontend
python -m http.server 5500
```
Open `http://localhost:5500` in your browser.

---

## 📡 API Reference

### POST `/api/plan/`

Generate a trip plan with HOS-compliant daily logs.

**Request Body:**
```json
{
  "start": "Bangalore",
  "end": "Delhi",
  "cycle_used": 0
}
```

**Response:**
```json
{
  "trip_plan": [
    {
      "day": 1,
      "events": [
        { "type": "on_duty", "start": 0, "end": 1, "location": "Pickup" },
        { "type": "driving", "start": 1, "end": 9, "location": "Route" },
        { "type": "off_duty", "start": 9, "end": 24, "location": "Rest" }
      ]
    }
  ],
  "distance_km": 2083.69,
  "distance_miles": 1294.75,
  "duration_hr": 25.14
}
```

**Event Types:**
| Type | Description |
|------|-------------|
| `off_duty` | Driver is off duty |
| `sleeper` | Driver in sleeper berth |
| `driving` | Actively driving |
| `on_duty` | On duty but not driving |

---

## 📜 FMCSA HOS Rules Implemented

- ✅ **11-Hour Driving Limit** — Max 11 hours driving after 10 hours off
- ✅ **14-Hour Window** — No driving after 14th consecutive hour on duty
- ✅ **30-Minute Break** — Required after 8 cumulative hours of driving
- ✅ **10-Hour Off Duty** — Required rest between shifts
- ✅ **Automatic Day Splitting** — Multi-day trips handled automatically

---

## 🌐 Deployment

### Frontend — GitHub Pages
Deployed automatically from the `main` branch root folder.

### Backend — Render
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn backend.wsgi:application`
- **Instance:** Free tier (may have cold start delay of ~50 seconds)

---

## 👨‍💻 Author

**Darshan** — [github.com/Darshan439](https://github.com/Darshan439
