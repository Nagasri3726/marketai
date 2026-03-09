# MarketAI Suite 🚀

An AI-powered Sales & Marketing platform built with Flask and Groq's LLaMA 3.3 70B model.

## Features

- **Campaign Generator** — Generate full marketing campaigns with objectives, content ideas, ad copy, CTAs, and tracking metrics
- **Sales Pitch Creator** — Create personalized B2B sales pitches with elevator pitch, value proposition, differentiators, and objection handlers
- **Lead Qualifier** — Score leads 0–100 with detailed BANT-framework analysis and conversion probability

## Project Structure

```
marketai/
├── app.py                  # Flask backend — routes + Groq API calls
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── static/
│   └── style.css           # Full UI stylesheet (dark premium theme)
└── templates/
    └── index.html          # Single-page app with all 3 tools
```

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Groq API Key

Create a `.env` file in the project root:

```
GROQ_API_KEY=your_actual_groq_api_key_here
```

Get your API key at: https://console.groq.com

### 3. Run the Application

```bash
python app.py
```

Visit `http://localhost:5000` in your browser.

## Usage

### Campaign Generator
1. Navigate to **Campaign** tab
2. Enter your product name, target audience, and marketing platform
3. Click **Generate Campaign**
4. Receive: Campaign objectives, 5 content ideas, 3 ad copy variations, 5 CTAs, and tracking metrics

### Sales Pitch Creator
1. Navigate to **Pitch** tab
2. Enter your product/solution and describe the customer persona
3. Click **Generate Pitch**
4. Receive: 30-second elevator pitch, value proposition, 5 differentiators, objection handlers, and CTAs

### Lead Qualifier
1. Navigate to **Lead Score** tab
2. Enter lead name, budget info, business need, and urgency level
3. Click **Score Lead**
4. Receive: Score (0–100), BANT breakdown, conversion probability, and recommended next actions

## Lead Score Tiers

| Score  | Category     | Action             |
|--------|--------------|--------------------|
| 90–100 | 🔥 Hot Lead  | Immediate follow-up |
| 75–89  | ♨️ Warm Lead | Priority outreach  |
| 60–74  | 🌡️ Lukewarm  | Nurture sequence   |
| < 60   | ❄️ Cold Lead | Defer or disqualify |

## Tech Stack

- **Backend**: Python 3.8+, Flask, Flask-CORS
- **AI Model**: Groq API — LLaMA 3.3 70B Versatile
- **Frontend**: Vanilla HTML/CSS/JS (single-page app, no framework needed)
- **Fonts**: Syne (display) + DM Sans (body) via Google Fonts

## Configuration

Edit `app.py` to change:

```python
GROQ_MODEL = "llama-3.3-70b-versatile"   # AI model
GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
```

## Deployment

For production, use a WSGI server:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## License

MIT — SmartBridge / Skill Wallet
