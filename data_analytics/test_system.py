"""Test the complete NASA weather analytics system"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core import WeatherLikelihoodCalculator, ThresholdDefinitions, ComfortIndexCalculator
from scripts import NASADataIngestion
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def test_complete_system():
    print("🌦️ Testing NASA Weather Analytics System on Windows...")
    
    try:
        # 1. Test comfort index
        comfort_calc = ComfortIndexCalculator()
        comfort_score = comfort_calc.calculate_comprehensive_comfort(22, 50, 2.0)
        print(f"✓ Comfort Index Test: {comfort_score:.1f}/100")
        
        # 2. Test data structures
        dates = pd.date_range(start='2020-01-01', end='2023-12-31', freq='D')
        n_days = len(dates)
        
        test_data = pd.DataFrame({
            'T2M': 20 + 10 * np.sin(2 * np.pi * dates.dayofyear / 365) + np.random.normal(0, 3, n_days),
            'T2M_MAX': 25 + 10 * np.sin(2 * np.pi * dates.dayofyear / 365) + np.random.normal(0, 3, n_days),
            'T2M_MIN': 15 + 10 * np.sin(2 * np.pi * dates.dayofyear / 365) + np.random.normal(0, 3, n_days),
            'RH2M': np.clip(60 + np.random.normal(0, 15, n_days), 20, 95),
            'WS2M': np.clip(np.random.exponential(3, n_days), 0, 25),
            'PRECTOTCORR': np.random.exponential(2, n_days) * (np.random.random(n_days) < 0.3)
        }, index=dates)
        print(f"✓ Generated test data: {len(test_data)} days")
        
        # 3. Test threshold calculation
        threshold_calc = ThresholdDefinitions()
        thresholds = threshold_calc.calculate_percentile_thresholds(test_data, "Test_Location")
        print(f"✓ Calculated {len(thresholds)} weather thresholds")
        
        # 4. Test weather condition labeling
        labeled_data = threshold_calc.classify_weather_conditions(test_data, thresholds)
        print("✓ Labeled weather conditions")
        
        # 5. Test model training
        calc = WeatherLikelihoodCalculator("models")
        
        # Create models directory if it doesn't exist
        import os
        if not os.path.exists("models"):
            os.makedirs("models")
        
        performance = calc.train_models(labeled_data)
        print(f"✓ Trained {len(performance)} ML models")
        
        print("\nModel Performance (ROC-AUC):")
        for condition, score in performance.items():
            print(f"  {condition}: {score:.3f}")
        
        # 6. Test predictions
        target_date = dates[-100]
        prediction = calc.predict_probabilities(labeled_data, target_date)
        
        print(f"\n🔮 Weather Predictions for {target_date.date()}:")
        for condition, prob in prediction.probabilities.items():
            ci_low, ci_high = prediction.confidence_intervals[condition]
            condition_name = condition.replace('is_', '').replace('_', ' ').title()
            print(f"  {condition_name}: {prob:.1%} (95% CI: {ci_low:.1%}-{ci_high:.1%})")
        
        print("\n✅ Complete system test successful on Windows!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_complete_system()
