"""
Comfort Index Calculator
This module calculates weather comfort indices combining multiple meteorological factors
to determine overall human comfort levels for outdoor activities.
"""

import numpy as np
import pandas as pd
from typing import Union, Optional
import logging

logger = logging.getLogger(__name__)

class ComfortIndexCalculator:
    """Calculate comprehensive weather comfort indices"""

    def __init__(self):
        """Initialize comfort index calculator with standard parameters"""

        # Optimal comfort ranges
        self.optimal_temp_range = (18, 26)  # °C
        self.optimal_humidity_range = (40, 60)  # %
        self.optimal_wind_range = (0.5, 3.0)  # m/s

        # Comfort weights for different factors
        self.weights = {
            'temperature': 0.4,
            'humidity': 0.25, 
            'wind': 0.20,
            'solar': 0.10,
            'precipitation': 0.05
        }

    def calculate_temperature_comfort(self, temperature: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate temperature comfort score (0-100)

        Args:
            temperature: Temperature in Celsius

        Returns:
            Comfort score where 100 = perfect, 0 = extremely uncomfortable
        """
        optimal_temp = 22  # °C - ideal temperature

        # Distance from optimal temperature
        temp_diff = np.abs(temperature - optimal_temp)

        # Comfort decreases exponentially with distance from optimal
        comfort_score = 100 * np.exp(-temp_diff / 8)

        # Additional penalties for extreme temperatures
        if isinstance(temperature, (int, float)):
            if temperature < 0:
                comfort_score *= 0.3  # Very cold penalty
            elif temperature > 40:
                comfort_score *= 0.2  # Very hot penalty
        else:  # numpy array
            cold_mask = temperature < 0
            hot_mask = temperature > 40
            comfort_score = np.where(cold_mask, comfort_score * 0.3, comfort_score)
            comfort_score = np.where(hot_mask, comfort_score * 0.2, comfort_score)

        return np.clip(comfort_score, 0, 100)

    def calculate_humidity_comfort(self, humidity: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate humidity comfort score (0-100)

        Args:
            humidity: Relative humidity percentage (0-100)

        Returns:
            Comfort score
        """
        optimal_humidity = 50  # % - ideal humidity

        if isinstance(humidity, (int, float)):
            if 40 <= humidity <= 60:
                return 100  # Optimal range
            elif humidity < 40:
                return max(0, 100 - (40 - humidity) * 2)
            else:  # humidity > 60
                return max(0, 100 - (humidity - 60) * 1.5)
        else:  # numpy array
            comfort_score = np.full_like(humidity, 100.0)

            low_mask = humidity < 40
            high_mask = humidity > 60
            optimal_mask = (humidity >= 40) & (humidity <= 60)

            comfort_score = np.where(low_mask, np.maximum(0, 100 - (40 - humidity) * 2), comfort_score)
            comfort_score = np.where(high_mask, np.maximum(0, 100 - (humidity - 60) * 1.5), comfort_score)

            return comfort_score

    def calculate_wind_comfort(self, wind_speed: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate wind comfort score (0-100)

        Args:
            wind_speed: Wind speed in m/s

        Returns:
            Comfort score
        """
        if isinstance(wind_speed, (int, float)):
            if wind_speed < 0.5:
                return 70  # Too still
            elif wind_speed <= 3.0:
                return 100  # Pleasant breeze
            elif wind_speed <= 8.0:
                return max(20, 100 - (wind_speed - 3) * 15)
            else:
                return max(0, 20 - (wind_speed - 8) * 2)
        else:  # numpy array
            comfort_score = np.full_like(wind_speed, 100.0)

            still_mask = wind_speed < 0.5
            optimal_mask = (wind_speed >= 0.5) & (wind_speed <= 3.0)
            moderate_mask = (wind_speed > 3.0) & (wind_speed <= 8.0)
            strong_mask = wind_speed > 8.0

            comfort_score = np.where(still_mask, 70, comfort_score)
            comfort_score = np.where(moderate_mask, np.maximum(20, 100 - (wind_speed - 3) * 15), comfort_score)
            comfort_score = np.where(strong_mask, np.maximum(0, 20 - (wind_speed - 8) * 2), comfort_score)

            return comfort_score

    def calculate_solar_comfort(self, solar_radiation: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate solar radiation comfort score (0-100)

        Args:
            solar_radiation: Solar radiation in W/m²

        Returns:
            Comfort score
        """
        if isinstance(solar_radiation, (int, float)):
            if solar_radiation < 100:
                return 60  # Too dark/cloudy
            elif solar_radiation <= 400:
                return 100  # Pleasant sunshine
            elif solar_radiation <= 800:
                return max(30, 100 - (solar_radiation - 400) / 10)
            else:
                return max(0, 30 - (solar_radiation - 800) / 20)
        else:  # numpy array
            comfort_score = np.full_like(solar_radiation, 100.0)

            dark_mask = solar_radiation < 100
            optimal_mask = (solar_radiation >= 100) & (solar_radiation <= 400)
            moderate_mask = (solar_radiation > 400) & (solar_radiation <= 800)
            intense_mask = solar_radiation > 800

            comfort_score = np.where(dark_mask, 60, comfort_score)
            comfort_score = np.where(moderate_mask, np.maximum(30, 100 - (solar_radiation - 400) / 10), comfort_score)
            comfort_score = np.where(intense_mask, np.maximum(0, 30 - (solar_radiation - 800) / 20), comfort_score)

            return comfort_score

    def calculate_precipitation_comfort(self, precipitation: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate precipitation comfort score (0-100)

        Args:
            precipitation: Precipitation in mm/day

        Returns:
            Comfort score
        """
        if isinstance(precipitation, (int, float)):
            if precipitation <= 0.1:
                return 100  # Dry
            elif precipitation <= 2.0:
                return 80   # Light rain
            elif precipitation <= 10.0:
                return max(20, 80 - (precipitation - 2) * 7.5)
            else:
                return 0    # Heavy rain
        else:  # numpy array
            comfort_score = np.full_like(precipitation, 100.0)

            dry_mask = precipitation <= 0.1
            light_mask = (precipitation > 0.1) & (precipitation <= 2.0)
            moderate_mask = (precipitation > 2.0) & (precipitation <= 10.0)
            heavy_mask = precipitation > 10.0

            comfort_score = np.where(light_mask, 80, comfort_score)
            comfort_score = np.where(moderate_mask, np.maximum(20, 80 - (precipitation - 2) * 7.5), comfort_score)
            comfort_score = np.where(heavy_mask, 0, comfort_score)

            return comfort_score

    def calculate_heat_index(self, temperature: Union[float, np.ndarray], 
                           humidity: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate heat index (apparent temperature) using the Rothfusz equation

        Args:
            temperature: Temperature in Celsius
            humidity: Relative humidity (%)

        Returns:
            Heat index in Celsius
        """
        # Convert Celsius to Fahrenheit for calculation
        temp_f = temperature * 9/5 + 32

        # Rothfusz equation coefficients
        c1 = -42.379
        c2 = 2.04901523
        c3 = 10.14333127
        c4 = -0.22475541
        c5 = -6.83783e-3
        c6 = -5.481717e-2
        c7 = 1.22874e-3
        c8 = 8.5282e-4
        c9 = -1.99e-6

        # Calculate heat index in Fahrenheit
        hi_f = (c1 + c2 * temp_f + c3 * humidity + 
                c4 * temp_f * humidity + c5 * temp_f**2 + 
                c6 * humidity**2 + c7 * temp_f**2 * humidity + 
                c8 * temp_f * humidity**2 + c9 * temp_f**2 * humidity**2)

        # Convert back to Celsius
        heat_index = (hi_f - 32) * 5/9

        return heat_index

    def calculate_wind_chill(self, temperature: Union[float, np.ndarray], 
                           wind_speed: Union[float, np.ndarray]) -> Union[float, np.ndarray]:
        """
        Calculate wind chill temperature

        Args:
            temperature: Temperature in Celsius
            wind_speed: Wind speed in m/s

        Returns:
            Wind chill temperature in Celsius
        """
        # Convert m/s to km/h
        wind_kmh = wind_speed * 3.6

        # Wind chill formula (valid for T ≤ 10°C and wind ≥ 4.8 km/h)
        wind_chill = (13.12 + 0.6215 * temperature - 
                     11.37 * wind_kmh**0.16 + 
                     0.3965 * temperature * wind_kmh**0.16)

        # Only apply wind chill when conditions are appropriate
        if isinstance(temperature, (int, float)):
            if temperature > 10 or wind_kmh < 4.8:
                return temperature
        else:  # numpy array
            mask = (temperature > 10) | (wind_kmh < 4.8)
            wind_chill = np.where(mask, temperature, wind_chill)

        return wind_chill

    def calculate_comprehensive_comfort(self, 
                                      temperature: Union[float, np.ndarray],
                                      humidity: Union[float, np.ndarray],
                                      wind_speed: Union[float, np.ndarray] = 0,
                                      solar_radiation: Union[float, np.ndarray] = 200,
                                      precipitation: Union[float, np.ndarray] = 0) -> Union[float, np.ndarray]:
        """
        Calculate comprehensive comfort index combining all weather factors

        Args:
            temperature: Temperature in Celsius
            humidity: Relative humidity (%)
            wind_speed: Wind speed in m/s
            solar_radiation: Solar radiation in W/m²
            precipitation: Precipitation in mm/day

        Returns:
            Comprehensive comfort index (0-100)
        """

        # Calculate individual comfort scores
        temp_comfort = self.calculate_temperature_comfort(temperature)
        humidity_comfort = self.calculate_humidity_comfort(humidity)
        wind_comfort = self.calculate_wind_comfort(wind_speed)
        solar_comfort = self.calculate_solar_comfort(solar_radiation)
        precip_comfort = self.calculate_precipitation_comfort(precipitation)

        # Weighted combination
        total_comfort = (
            temp_comfort * self.weights['temperature'] +
            humidity_comfort * self.weights['humidity'] +
            wind_comfort * self.weights['wind'] +
            solar_comfort * self.weights['solar'] +
            precip_comfort * self.weights['precipitation']
        )

        return np.clip(total_comfort, 0, 100)

    def classify_comfort_level(self, comfort_score: Union[float, np.ndarray]) -> Union[str, np.ndarray]:
        """
        Classify comfort score into descriptive categories

        Args:
            comfort_score: Comfort score (0-100)

        Returns:
            Comfort level description
        """
        if isinstance(comfort_score, (int, float)):
            if comfort_score >= 80:
                return "Very Comfortable"
            elif comfort_score >= 60:
                return "Comfortable"
            elif comfort_score >= 40:
                return "Somewhat Uncomfortable"
            elif comfort_score >= 20:
                return "Uncomfortable"
            else:
                return "Very Uncomfortable"
        else:  # numpy array
            conditions = [
                comfort_score >= 80,
                comfort_score >= 60,
                comfort_score >= 40,
                comfort_score >= 20
            ]
            choices = [
                "Very Comfortable",
                "Comfortable", 
                "Somewhat Uncomfortable",
                "Uncomfortable"
            ]
            return np.select(conditions, choices, default="Very Uncomfortable")


# Example usage and testing
def main():
    """Test the comfort index calculator"""

    # Initialize calculator
    comfort_calc = ComfortIndexCalculator()

    # Test with single values
    print("Single Value Tests:")
    print("-" * 50)

    # Perfect day
    temp, humidity, wind = 22, 50, 2.0
    comfort = comfort_calc.calculate_comprehensive_comfort(temp, humidity, wind)
    level = comfort_calc.classify_comfort_level(comfort)
    print(f"Perfect day (22°C, 50% RH, 2 m/s wind): {comfort:.1f} - {level}")

    # Hot and humid
    temp, humidity, wind = 35, 80, 1.0
    comfort = comfort_calc.calculate_comprehensive_comfort(temp, humidity, wind)
    level = comfort_calc.classify_comfort_level(comfort)
    print(f"Hot and humid (35°C, 80% RH, 1 m/s wind): {comfort:.1f} - {level}")

    # Cold and windy
    temp, humidity, wind = -5, 30, 12.0
    comfort = comfort_calc.calculate_comprehensive_comfort(temp, humidity, wind)
    level = comfort_calc.classify_comfort_level(comfort)
    print(f"Cold and windy (-5°C, 30% RH, 12 m/s wind): {comfort:.1f} - {level}")

    # Test with arrays
    print("\nArray Tests:")
    print("-" * 50)

    # Create sample data
    temps = np.array([15, 22, 28, 35, 5])
    humidities = np.array([45, 50, 70, 85, 30])
    winds = np.array([1.5, 2.0, 8.0, 0.5, 15.0])

    comfort_scores = comfort_calc.calculate_comprehensive_comfort(temps, humidities, winds)
    comfort_levels = comfort_calc.classify_comfort_level(comfort_scores)

    for i, (t, h, w, score, level) in enumerate(zip(temps, humidities, winds, comfort_scores, comfort_levels)):
        print(f"Condition {i+1}: {t}°C, {h}% RH, {w} m/s → {score:.1f} ({level})")


if __name__ == "__main__":
    main()
