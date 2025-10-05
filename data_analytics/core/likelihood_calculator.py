"""
Weather Likelihood Calculator
--------------------------------
This module trains machine learning models on classified weather conditions
and predicts the likelihood of extreme or notable weather events.
"""

import os
import pickle
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
from dataclasses import dataclass, field


@dataclass
class WeatherPrediction:
    probabilities: dict
    confidence_intervals: dict


class WeatherLikelihoodCalculator:
    def __init__(self, model_dir="models"):
        self.model_dir = model_dir
        os.makedirs(self.model_dir, exist_ok=True)
        self.models = {}

    def _get_features_and_labels(self, df, condition):
        """Extracts input features (X) and labels (y) for a given condition."""
        feature_cols = ['T2M', 'T2M_MAX', 'T2M_MIN', 'RH2M', 'WS2M', 'PRECTOTCORR']
        available = [col for col in feature_cols if col in df.columns]
        X = df[available].copy()
        y = df[condition].astype(int)
        return X, y

    def train_models(self, labeled_data):
        """
        Trains a RandomForest model for each weather condition label
        and returns performance metrics.
        """
        performance = {}

        condition_labels = [
            'is_very_hot', 'is_very_cold', 'is_very_windy',
            'is_very_wet', 'is_very_uncomfortable'
        ]

        for condition in condition_labels:
            if condition not in labeled_data.columns:
                continue

            print(f"   → Training model for: {condition}")
            X, y = self._get_features_and_labels(labeled_data, condition)

            if len(np.unique(y)) < 2:
                print(f"     ⚠️ Skipping {condition}: only one class found.")
                continue

            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )

            model = RandomForestClassifier(
                n_estimators=120, max_depth=8, random_state=42
            )
            model.fit(X_train, y_train)

            y_pred = model.predict_proba(X_test)[:, 1]
            auc_score = roc_auc_score(y_test, y_pred)
            performance[condition] = auc_score

            # Save model
            model_path = os.path.join(self.model_dir, f"{condition}_model.pkl")
            with open(model_path, "wb") as f:
                pickle.dump(model, f)

            self.models[condition] = model

        return performance

    def _load_models(self):
        """Loads all saved models from disk."""
        self.models = {}
        for file in os.listdir(self.model_dir):
            if file.endswith("_model.pkl"):
                condition = file.replace("_model.pkl", "")
                with open(os.path.join(self.model_dir, file), "rb") as f:
                    self.models[condition] = pickle.load(f)

    def predict_probabilities(self, df, target_date=None):
        """
        Predicts the probability of extreme weather conditions
        for a given date using trained models.
        """
        if not self.models:
            self._load_models()

        # Handle target date
        if target_date is not None:
            if isinstance(target_date, str):
                target_date = datetime.strptime(target_date, "%Y-%m-%d")
            if target_date not in df.index:
                raise ValueError(f"Date {target_date} not found in dataset.")

            input_data = df.loc[[target_date]]
        else:
            input_data = df.iloc[[-1]]  # last day

        input_features = ['T2M', 'T2M_MAX', 'T2M_MIN', 'RH2M', 'WS2M', 'PRECTOTCORR']
        available_features = [col for col in input_features if col in df.columns]
        X = input_data[available_features]

        probabilities = {}
        confidence_intervals = {}

        for condition, model in self.models.items():
            prob = model.predict_proba(X)[:, 1][0]
            probabilities[condition] = prob

            # Approximate confidence interval using binomial assumption
            n_trees = len(model.estimators_)
            se = np.sqrt(prob * (1 - prob) / n_trees)
            ci_low = max(0, prob - 1.96 * se)
            ci_high = min(1, prob + 1.96 * se)
            confidence_intervals[condition] = (ci_low, ci_high)

        return WeatherPrediction(probabilities, confidence_intervals)
