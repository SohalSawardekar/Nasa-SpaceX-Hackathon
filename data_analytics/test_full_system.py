"""
NASA Weather Analytics Backend (Flask API)
Full system integration with Gemini AI and NASA data pipeline.
"""

import sys
import os
import pandas as pd
import numpy as np
from datetime import datetime
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

# Local imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from core.likelihood_calculator import WeatherLikelihoodCalculator
from core.threshold_definitions import ThresholdDefinitions
from core.comfort_index import ComfortIndexCalculator
from scripts.ingest_data import NASADataIngestion

# Google Gemini
import google.generativeai as genai

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])


# -------------------------------------------------------------------------
# Gemini AI Weather Verdict
# -------------------------------------------------------------------------
def get_weather_verdict(weather_data, location, date, time, future_predictions=None):
    genai.configure(api_key=GEMINI_API_KEY)

    prompt = (
        f"The user requested a weather verdict for {location} on {date} at {time}. "
        "If the provided weather data is older or missing, use your search engine to fetch and analyze the latest available data. "
        "Predict the weather for the next 2-3 days using full terms: Temperature, Relative Humidity, Wind Speed, Precipitation. "
        "Provide a short, clear verdict (maximum two sentences) stating the likelihood of very hot, very cold, very windy, very wet, or very uncomfortable conditions, "
        "and whether the location is comfortable, moderately comfortable, or highly uncomfortable. "
        "Do not use abbreviations or long lists.\n"
        f"Weather data:\n{weather_data}\n"
    )

    if future_predictions is not None:
        prompt += f"\nPredicted weather for next 2-3 days:\n{future_predictions}\n"

    prompt += "\nStrictly output only two sentences as the final verdict."

    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content(prompt)
    return response.text.strip()


# -------------------------------------------------------------------------
# Simple Future Weather Predictor
# -------------------------------------------------------------------------
def predict_future_weather(weather_data, days=3):
    future_dates = pd.date_range(
        start=weather_data.index[-1] + pd.Timedelta(days=1), periods=days
    )
    last_row = weather_data.iloc[-1]
    predictions = []
    for d in future_dates:
        pred = {col: last_row[col] for col in weather_data.columns}
        pred["date"] = d.strftime("%Y-%m-%d")
        predictions.append(pred)
    return pd.DataFrame(predictions)


# -------------------------------------------------------------------------
# API Endpoint
# -------------------------------------------------------------------------
@app.route("/api/weather-verdict", methods=["POST"])
def weather_verdict_api():
    try:
        data = request.get_json()
        country = data.get("country")
        city = data.get("city")
        date = data.get("date")
        time = data.get("time")

        if not all([country, city, date, time]):
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Missing required fields (country, city, date, time).",
                    }
                ),
                400,
            )

        location = f"{city}, {country}"

        # Simulate real data (replace this with real NASA API ingestion later)
        dates = pd.date_range(start="2023-10-01", periods=5)
        weather_data = pd.DataFrame(
            {
                "T2M": [22.5, 23.0, 21.0, 24.0, 22.0],
                "T2M_MAX": [25.0, 26.0, 24.0, 27.0, 25.0],
                "T2M_MIN": [20.0, 21.0, 19.0, 22.0, 20.0],
                "RH2M": [60, 62, 59, 61, 60],
                "WS2M": [5, 6, 4, 7, 5],
                "PRECTOTCORR": [0, 0.2, 0, 0.1, 0],
            },
            index=dates,
        )

        # Predict next few days
        future_weather = predict_future_weather(weather_data, days=3)

        # Get Gemini AI verdict
        verdict = get_weather_verdict(
            weather_data, location, date, time, future_predictions=future_weather
        )

        return (
            jsonify(
                {
                    "status": "success",
                    "location": location,
                    "date": date,
                    "time": time,
                    "verdict": verdict,
                    "predicted_weather": future_weather.to_dict(orient="records"),
                }
            ),
            200,
        )

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


# -------------------------------------------------------------------------
# Optional: Keep your original system test
# -------------------------------------------------------------------------
@app.route("/api/test-system")
def test_system():
    try:
        from test_system import test_complete_system

        result = test_complete_system()
        return jsonify({"status": "success" if result else "failed"})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# -------------------------------------------------------------------------
# Entry Point
# -------------------------------------------------------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
