from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import re
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "your_groq_api_key_here")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


def call_groq(prompt):
    """Call the Groq API with a given prompt and return the cleaned response."""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GROQ_API_KEY}"
    }
    body = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7
    }
    try:
        response = requests.post(GROQ_URL, json=body, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        result = data["choices"][0]["message"]["content"]
        # Clean asterisks and extra markdown
        result = re.sub(r'[\*\_]{1,3}(.+?)[\*\_]{1,3}', r'\1', result)
        return result
    except requests.exceptions.Timeout:
        return "API Error: Request timed out. Please try again."
    except requests.exceptions.HTTPError as e:
        if response.status_code == 401:
            return "API Error: Invalid API key. Please check your GROQ_API_KEY in the .env file."
        return f"API Error: {str(e)}. Please try again."
    except Exception as e:
        return f"API Error: {str(e)}. Please try again."


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate_campaign", methods=["POST"])
def generate_campaign():
    product = request.form.get("product", "").strip()
    audience = request.form.get("audience", "").strip()
    platform = request.form.get("platform", "").strip()

    if not product or not audience or not platform:
        return jsonify({"result": "Error: Please fill in all fields (Product, Target Audience, and Platform)."})

    prompt = f"""Generate a detailed and comprehensive marketing campaign strategy.

Product: {product}
Target Audience: {audience}
Platform: {platform}

Please include ALL of the following sections, clearly labeled:

1. CAMPAIGN OBJECTIVES
   - State 3 clear, measurable campaign objectives

2. CONTENT IDEAS (provide exactly 5)
   - List 5 specific, creative content ideas tailored to {platform} and the target audience

3. AD COPY VARIATIONS (provide exactly 3)
   - Variation 1 (Problem-Agitate-Solve): Write compelling ad copy using PAS framework
   - Variation 2 (Social Proof): Write compelling ad copy using social proof
   - Variation 3 (Limited-Time Offer): Write compelling ad copy using urgency/scarcity

4. CALL-TO-ACTION SUGGESTIONS (provide exactly 5)
   - List 5 specific, actionable CTAs tailored to {platform}

5. TRACKING & MEASUREMENT
   - Suggest 4 key metrics and tools to measure campaign success

Make each section detailed, practical, and specifically tailored to {platform} audience behavior and the given product/audience combination."""

    output = call_groq(prompt)
    return jsonify({"result": output})


@app.route("/generate_pitch", methods=["POST"])
def generate_pitch():
    product = request.form.get("product", "").strip()
    customer = request.form.get("customer", "").strip()

    if not product or not customer:
        return jsonify({"result": "Error: Please fill in all fields (Product and Customer Persona)."})

    prompt = f"""Create a compelling, personalized B2B sales pitch.

Product/Solution: {product}
Customer Persona: {customer}

Please include ALL of the following sections, clearly labeled:

1. 30-SECOND ELEVATOR PITCH
   - Write a concise, engaging 30-second pitch for initial contact. Make it conversational, memorable, and specific to the customer persona.

2. VALUE PROPOSITION
   - State the clear, quantifiable value this solution delivers to the customer. Include specific business benefits and ROI indicators.

3. KEY DIFFERENTIATORS (list 5)
   - Detail 5 specific competitive advantages that address the customer's pain points

4. OBJECTION HANDLERS (list 3 common objections + responses)
   - Anticipate 3 likely objections and provide persuasive responses

5. CALL-TO-ACTION
   - Provide 2-3 specific next steps to move the deal forward (demo, pilot, meeting, etc.)

Make everything highly specific to the customer persona described. Avoid generic language."""

    output = call_groq(prompt)
    return jsonify({"result": output})


@app.route("/lead_score", methods=["POST"])
def lead_score():
    name = request.form.get("name", "").strip()
    budget = request.form.get("budget", "").strip()
    need = request.form.get("need", "").strip()
    urgency = request.form.get("urgency", "").strip()

    if not name or not budget or not need or not urgency:
        return jsonify({"result": "Error: Please fill in all fields (Lead Name, Budget, Business Need, and Urgency)."})

    prompt = f"""Perform a comprehensive lead qualification analysis and scoring.

Lead Name: {name}
Budget Information: {budget}
Business Need: {need}
Urgency Level: {urgency}

Please provide a detailed analysis with ALL of the following sections, clearly labeled:

1. LEAD QUALIFICATION SCORE
   - Provide a numeric score from 0-100
   - Use this scale: 90-100 = Hot Lead, 75-89 = Warm Lead, 60-74 = Lukewarm Lead, Below 60 = Cold Lead
   - State the lead category clearly

2. SCORING BREAKDOWN
   Score each dimension out of 30 (Budget/30, Need/30, Urgency/40):
   - Budget Score (0-30): Evaluate available budget and spending authority
   - Need Score (0-30): Evaluate business pain points and solution fit
   - Urgency Score (0-40): Evaluate timeline and implementation priority
   - Total Score: Sum of all dimensions

3. DETAILED REASONING
   - Explain why each dimension received its score
   - Highlight the strongest qualifying factors
   - Note any risk factors or concerns

4. PROBABILITY OF CONVERSION
   - State the estimated probability of deal closure as a percentage
   - Explain the key factors driving this probability

5. RECOMMENDED NEXT ACTIONS
   - Provide 4-5 specific, actionable next steps for the sales team
   - Prioritize actions based on the lead's profile and urgency

6. OPTIMAL OUTREACH TIMING
   - Recommend the best timing and channel for initial outreach

Be specific and data-driven in your analysis."""

    output = call_groq(prompt)
    return jsonify({"result": output})


if __name__ == "__main__":
    app.run(debug=True)
