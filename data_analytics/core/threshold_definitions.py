
"""
Weather Threshold Definitions
This module defines thresholds for weather conditions like "very hot", "very cold", 
"very windy", "very wet", and "very uncomfortable" based on statistical analysis
of historical weather data and meteorological standards.
"""

import pandas as pd
import numpy as np
from typing import Dict, Tuple, Optional, Union
import logging
from pathlib import Path
from dataclasses import dataclass
from scipy import stats

logger = logging.getLogger(__name__)

@dataclass
class WeatherThreshold:
    """Data class to store weather threshold information"""
    parameter: str
    condition: str
    threshold_value: float
    percentile: Optional[float] = None
    unit: str = ""
    description: str = ""

class ThresholdDefinitions:
    """Class to define and calculate weather thresholds"""

    def __init__(self):
        """Initialize threshold definitions with default values"""

        # Default threshold definitions based on meteorological standards
        self.default_thresholds = {
            'very_hot': {
                'temperature_absolute': 35.0,  # °C (95°F)
                'temperature_percentile': 95,   # 95th percentile of local climate
                'heat_index_threshold': 40.0,   # °C heat index
            },
            'very_cold': {
                'temperature_absolute': 0.0,    # °C (32°F) 
                'temperature_percentile': 5,    # 5th percentile of local climate
                'wind_chill_threshold': -10.0,  # °C wind chill
            },
            'very_windy': {
                'wind_speed_absolute': 15.0,    # m/s (33.6 mph)
                'wind_speed_percentile': 90,    # 90th percentile
                'gust_threshold': 20.0,         # m/s sustained gusts
            },
            'very_wet': {
                'daily_precipitation': 25.0,    # mm/day (heavy rain threshold)
                'precipitation_percentile': 95, # 95th percentile
                'wet_days_threshold': 0.1,      # mm (minimum for wet day)
            },
            'very_uncomfortable': {
                'heat_index_high': 40.0,        # °C
                'wind_chill_low': -10.0,        # °C  
                'humidity_high': 80.0,          # % RH
                'combined_discomfort': True,    # Use combined index
            }
        }

    def calculate_percentile_thresholds(self, 
                                      df: pd.DataFrame,
                                      location_id: str = "default") -> Dict[str, WeatherThreshold]:
        """
        Calculate location-specific thresholds based on historical data percentiles

        Args:
            df: Historical weather DataFrame
            location_id: Identifier for the location

        Returns:
            Dictionary of weather thresholds
        """
        logger.info(f"Calculating percentile thresholds for location: {location_id}")

        thresholds = {}

        # Very Hot Thresholds
        if 'T2M_MAX' in df.columns:
            temp_95th = df['T2M_MAX'].quantile(0.95)
            temp_99th = df['T2M_MAX'].quantile(0.99)

            thresholds['very_hot_95th'] = WeatherThreshold(
                parameter='T2M_MAX',
                condition='very_hot',
                threshold_value=temp_95th,
                percentile=95,
                unit='°C',
                description=f'95th percentile maximum temperature for {location_id}'
            )

            thresholds['very_hot_99th'] = WeatherThreshold(
                parameter='T2M_MAX', 
                condition='very_hot',
                threshold_value=temp_99th,
                percentile=99,
                unit='°C',
                description=f'99th percentile maximum temperature for {location_id}'
            )

        # Very Cold Thresholds  
        if 'T2M_MIN' in df.columns:
            temp_5th = df['T2M_MIN'].quantile(0.05)
            temp_1st = df['T2M_MIN'].quantile(0.01)

            thresholds['very_cold_5th'] = WeatherThreshold(
                parameter='T2M_MIN',
                condition='very_cold', 
                threshold_value=temp_5th,
                percentile=5,
                unit='°C',
                description=f'5th percentile minimum temperature for {location_id}'
            )

            thresholds['very_cold_1st'] = WeatherThreshold(
                parameter='T2M_MIN',
                condition='very_cold',
                threshold_value=temp_1st,
                percentile=1,
                unit='°C',
                description=f'1st percentile minimum temperature for {location_id}'
            )

        # Very Windy Thresholds
        if 'WS2M' in df.columns:
            wind_90th = df['WS2M'].quantile(0.90)
            wind_95th = df['WS2M'].quantile(0.95)

            thresholds['very_windy_90th'] = WeatherThreshold(
                parameter='WS2M',
                condition='very_windy',
                threshold_value=wind_90th,
                percentile=90,
                unit='m/s',
                description=f'90th percentile wind speed for {location_id}'
            )

            thresholds['very_windy_95th'] = WeatherThreshold(
                parameter='WS2M',
                condition='very_windy', 
                threshold_value=wind_95th,
                percentile=95,
                unit='m/s',
                description=f'95th percentile wind speed for {location_id}'
            )

        # Very Wet Thresholds
        if 'PRECTOTCORR' in df.columns:
            # Filter out dry days for precipitation percentiles
            wet_days = df[df['PRECTOTCORR'] > 0.1]['PRECTOTCORR']

            if len(wet_days) > 10:  # Need sufficient wet days for statistics
                precip_90th = wet_days.quantile(0.90)
                precip_95th = wet_days.quantile(0.95)

                thresholds['very_wet_90th'] = WeatherThreshold(
                    parameter='PRECTOTCORR',
                    condition='very_wet',
                    threshold_value=precip_90th,
                    percentile=90,
                    unit='mm/day',
                    description=f'90th percentile precipitation for {location_id} (wet days only)'
                )

                thresholds['very_wet_95th'] = WeatherThreshold(
                    parameter='PRECTOTCORR',
                    condition='very_wet',
                    threshold_value=precip_95th, 
                    percentile=95,
                    unit='mm/day',
                    description=f'95th percentile precipitation for {location_id} (wet days only)'
                )

        return thresholds

    def calculate_seasonal_thresholds(self, 
                                    df: pd.DataFrame,
                                    location_id: str = "default") -> Dict[str, Dict[int, WeatherThreshold]]:
        """
        Calculate seasonal threshold variations

        Args:
            df: Historical weather DataFrame with seasonal data
            location_id: Identifier for the location

        Returns:
            Dictionary with seasonal thresholds by month
        """
        logger.info(f"Calculating seasonal thresholds for location: {location_id}")

        seasonal_thresholds = {}

        # Add month column if not present
        if 'MONTH' not in df.columns:
            df['MONTH'] = df.index.month

        # Calculate thresholds for each month
        for month in range(1, 13):
            month_data = df[df['MONTH'] == month]

            if len(month_data) < 30:  # Need at least 30 observations
                continue

            month_thresholds = {}

            # Monthly temperature thresholds
            if 'T2M_MAX' in month_data.columns:
                hot_95th = month_data['T2M_MAX'].quantile(0.95)
                month_thresholds['very_hot'] = WeatherThreshold(
                    parameter='T2M_MAX',
                    condition='very_hot',
                    threshold_value=hot_95th,
                    percentile=95,
                    unit='°C',
                    description=f'Month {month} very hot threshold for {location_id}'
                )

            if 'T2M_MIN' in month_data.columns:
                cold_5th = month_data['T2M_MIN'].quantile(0.05)
                month_thresholds['very_cold'] = WeatherThreshold(
                    parameter='T2M_MIN',
                    condition='very_cold',
                    threshold_value=cold_5th,
                    percentile=5,
                    unit='°C',
                    description=f'Month {month} very cold threshold for {location_id}'
                )

            # Monthly wind thresholds
            if 'WS2M' in month_data.columns:
                windy_90th = month_data['WS2M'].quantile(0.90)
                month_thresholds['very_windy'] = WeatherThreshold(
                    parameter='WS2M',
                    condition='very_windy',
                    threshold_value=windy_90th,
                    percentile=90,
                    unit='m/s',
                    description=f'Month {month} very windy threshold for {location_id}'
                )

            # Monthly precipitation thresholds
            if 'PRECTOTCORR' in month_data.columns:
                wet_days = month_data[month_data['PRECTOTCORR'] > 0.1]['PRECTOTCORR']
                if len(wet_days) > 5:  # At least 5 wet days in the month
                    wet_95th = wet_days.quantile(0.95)
                    month_thresholds['very_wet'] = WeatherThreshold(
                        parameter='PRECTOTCORR',
                        condition='very_wet',
                        threshold_value=wet_95th,
                        percentile=95,
                        unit='mm/day',
                        description=f'Month {month} very wet threshold for {location_id}'
                    )

            seasonal_thresholds[month] = month_thresholds

        return seasonal_thresholds

    def calculate_comfort_index(self, 
                              temperature: float,
                              humidity: float,
                              wind_speed: float = 0.0,
                              solar_radiation: float = 0.0) -> float:
        """
        Calculate comprehensive comfort index combining multiple weather factors

        Args:
            temperature: Temperature in Celsius
            humidity: Relative humidity (%)
            wind_speed: Wind speed in m/s
            solar_radiation: Solar radiation in W/m²

        Returns:
            Comfort index (0-100, where 50 is comfortable, <30 or >70 is uncomfortable)
        """

        # Base comfort from temperature (optimal around 22°C)
        temp_comfort = 50 - abs(temperature - 22) * 2

        # Humidity comfort (optimal 40-60%)
        if 40 <= humidity <= 60:
            humidity_comfort = 50
        elif humidity < 40:
            humidity_comfort = 50 - (40 - humidity) * 0.5
        else:  # humidity > 60
            humidity_comfort = 50 - (humidity - 60) * 0.3

        # Wind comfort (slight breeze is good, strong winds uncomfortable)
        if wind_speed < 2:
            wind_comfort = 45 + wind_speed * 5  # Light breeze is pleasant
        elif wind_speed < 10:
            wind_comfort = 55 - (wind_speed - 2) * 2  # Moderate wind decreases comfort
        else:
            wind_comfort = 30 - min((wind_speed - 10) * 2, 20)  # Strong wind is uncomfortable

        # Solar radiation effect (for outdoor comfort)
        if solar_radiation > 800:  # High solar radiation
            solar_penalty = min((solar_radiation - 800) / 100, 10)
        else:
            solar_penalty = 0

        # Combine all factors with weights
        comfort_index = (
            temp_comfort * 0.4 +      # Temperature is most important
            humidity_comfort * 0.3 +   # Humidity is second
            wind_comfort * 0.2 +       # Wind effect 
            (50 - solar_penalty) * 0.1 # Solar radiation penalty
        )

        # Ensure bounds [0, 100]
        return max(0, min(100, comfort_index))

    def classify_weather_conditions(self, 
                                  df: pd.DataFrame,
                                  thresholds: Dict[str, WeatherThreshold]) -> pd.DataFrame:
        """
        Classify weather conditions based on defined thresholds

        Args:
            df: Weather DataFrame
            thresholds: Dictionary of weather thresholds

        Returns:
            DataFrame with added classification columns
        """
        logger.info("Classifying weather conditions based on thresholds...")

        df_classified = df.copy()

        # Very Hot Classification
        if 'very_hot_95th' in thresholds and 'T2M_MAX' in df.columns:
            threshold_val = thresholds['very_hot_95th'].threshold_value
            df_classified['is_very_hot'] = df_classified['T2M_MAX'] > threshold_val

        # Very Cold Classification
        if 'very_cold_5th' in thresholds and 'T2M_MIN' in df.columns:
            threshold_val = thresholds['very_cold_5th'].threshold_value
            df_classified['is_very_cold'] = df_classified['T2M_MIN'] < threshold_val

        # Very Windy Classification
        if 'very_windy_90th' in thresholds and 'WS2M' in df.columns:
            threshold_val = thresholds['very_windy_90th'].threshold_value
            df_classified['is_very_windy'] = df_classified['WS2M'] > threshold_val

        # Very Wet Classification
        if 'very_wet_95th' in thresholds and 'PRECTOTCORR' in df.columns:
            threshold_val = thresholds['very_wet_95th'].threshold_value
            df_classified['is_very_wet'] = df_classified['PRECTOTCORR'] > threshold_val

        # Comfort Index and Very Uncomfortable Classification
        if all(col in df.columns for col in ['T2M', 'RH2M']):
            wind_col = 'WS2M' if 'WS2M' in df.columns else None
            solar_col = 'ALLSKY_SFC_SW_DWN' if 'ALLSKY_SFC_SW_DWN' in df.columns else None

            comfort_scores = []
            for idx, row in df.iterrows():
                wind_val = row[wind_col] if wind_col else 0.0
                solar_val = row[solar_col] if solar_col else 0.0

                comfort = self.calculate_comfort_index(
                    temperature=row['T2M'],
                    humidity=row['RH2M'], 
                    wind_speed=wind_val,
                    solar_radiation=solar_val
                )
                comfort_scores.append(comfort)

            df_classified['comfort_index'] = comfort_scores
            df_classified['is_very_uncomfortable'] = df_classified['comfort_index'] < 30

        return df_classified

    def save_thresholds(self, 
                       thresholds: Dict[str, WeatherThreshold],
                       filepath: Union[str, Path],
                       location_id: str = "default"):
        """
        Save threshold definitions to file

        Args:
            thresholds: Dictionary of weather thresholds
            filepath: Path to save thresholds
            location_id: Location identifier
        """
        threshold_data = []

        for key, threshold in thresholds.items():
            threshold_data.append({
                'threshold_key': key,
                'parameter': threshold.parameter,
                'condition': threshold.condition,
                'threshold_value': threshold.threshold_value,
                'percentile': threshold.percentile,
                'unit': threshold.unit,
                'description': threshold.description,
                'location_id': location_id
            })

        df_thresholds = pd.DataFrame(threshold_data)
        df_thresholds.to_csv(filepath, index=False)

        logger.info(f"Saved {len(thresholds)} thresholds to {filepath}")

    def load_thresholds(self, filepath: Union[str, Path]) -> Dict[str, WeatherThreshold]:
        """
        Load threshold definitions from file

        Args:
            filepath: Path to threshold file

        Returns:
            Dictionary of weather thresholds
        """
        df_thresholds = pd.read_csv(filepath)
        thresholds = {}

        for _, row in df_thresholds.iterrows():
            threshold = WeatherThreshold(
                parameter=row['parameter'],
                condition=row['condition'],
                threshold_value=row['threshold_value'],
                percentile=row['percentile'] if pd.notna(row['percentile']) else None,
                unit=row['unit'],
                description=row['description']
            )
            thresholds[row['threshold_key']] = threshold

        logger.info(f"Loaded {len(thresholds)} thresholds from {filepath}")
        return thresholds


# Example usage
def main():
    """Example usage of threshold definitions"""

    # Create sample weather data for demonstration
    np.random.seed(42)
    dates = pd.date_range(start='2010-01-01', end='2023-12-31', freq='D')

    # Generate realistic weather data with seasonal variation
    n_days = len(dates)
    day_of_year = dates.dayofyear

    # Temperature with seasonal cycle
    temp_base = 15 + 10 * np.sin(2 * np.pi * day_of_year / 365.25)
    temp_max = temp_base + 5 + np.random.normal(0, 3, n_days)
    temp_min = temp_base - 5 + np.random.normal(0, 2, n_days)
    temp_avg = (temp_max + temp_min) / 2

    # Other variables
    humidity = np.clip(60 + np.random.normal(0, 15, n_days), 10, 100)
    wind_speed = np.clip(np.random.exponential(3, n_days), 0, 25)
    precipitation = np.random.exponential(2, n_days) * (np.random.random(n_days) < 0.3)

    # Create DataFrame
    sample_df = pd.DataFrame({
        'T2M': temp_avg,
        'T2M_MAX': temp_max,
        'T2M_MIN': temp_min,
        'RH2M': humidity,
        'WS2M': wind_speed,
        'PRECTOTCORR': precipitation
    }, index=dates)

    # Initialize threshold calculator
    threshold_calc = ThresholdDefinitions()

    # Calculate percentile thresholds
    thresholds = threshold_calc.calculate_percentile_thresholds(sample_df, "Sample_Location")

    # Calculate seasonal thresholds
    seasonal_thresholds = threshold_calc.calculate_seasonal_thresholds(sample_df, "Sample_Location")

    # Classify weather conditions
    classified_df = threshold_calc.classify_weather_conditions(sample_df, thresholds)

    # Print results
    print("\nCalculated Weather Thresholds:")
    for key, threshold in thresholds.items():
        print(f"{key}: {threshold.threshold_value:.2f} {threshold.unit} ({threshold.description})")

    print("\nWeather Condition Statistics:")
    condition_cols = [col for col in classified_df.columns if col.startswith('is_')]
    for col in condition_cols:
        pct = classified_df[col].mean() * 100
        print(f"{col}: {pct:.1f}% of days")

    if 'comfort_index' in classified_df.columns:
        print(f"\nMean Comfort Index: {classified_df['comfort_index'].mean():.1f}")
        print(f"Comfortable days (30-70): {((classified_df['comfort_index'] >= 30) & (classified_df['comfort_index'] <= 70)).mean() * 100:.1f}%")

if __name__ == "__main__":
    main()
