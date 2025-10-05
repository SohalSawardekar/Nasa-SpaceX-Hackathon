"""
NASA Weather Data Ingestion Script
This script downloads and processes weather data from NASA APIs including:
1. NASA POWER API for meteorological data
2. GPM IMERG for precipitation data
3. MODIS for atmospheric moisture data
"""

import os
import requests
import pandas as pd
import numpy as np
import xarray as xr
from datetime import datetime, timedelta
import json
import logging
from pathlib import Path
import time
from typing import Dict, List, Tuple, Optional

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class NASADataIngestion:
    """Class to handle NASA weather data ingestion from multiple sources"""
    
    def __init__(self, base_data_dir: str = "data"):
        """
        Initialize NASA Data Ingestion
        
        Args:
            base_data_dir: Base directory for storing data
        """
        self.base_data_dir = Path(base_data_dir)
        self.setup_directories()
        
        # NASA POWER API base URL
        self.power_api_base = "https://power.larc.nasa.gov/api/temporal/"
        
        # Default parameters for weather data
        self.weather_parameters = {
            'temperature': ['T2M', 'T2M_MAX', 'T2M_MIN'],  # Temperature at 2m
            'humidity': ['RH2M', 'QV2M'],  # Relative humidity, specific humidity
            'precipitation': ['PRECTOTCORR'],  # Precipitation
            'wind': ['WS2M', 'WD2M'],  # Wind speed and direction
            'pressure': ['PS'],  # Surface pressure
            'solar': ['ALLSKY_SFC_SW_DWN']  # Solar radiation
        }
    
    def setup_directories(self):
        """Create necessary directory structure"""
        directories = [
            'raw/nasa_power',
            'raw/gpm_imerg', 
            'raw/modis',
            'processed/climate_normals',
            'processed/historical_weather',
            'processed/threshold_data'
        ]
        
        for dir_path in directories:
            full_path = self.base_data_dir / dir_path
            full_path.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {full_path}")
    
    def download_nasa_power_data(self, 
                                 latitude: float, 
                                 longitude: float,
                                 start_date: str,
                                 end_date: str,
                                 parameters: List[str] = None,
                                 community: str = "AG") -> pd.DataFrame:
        """
        Download meteorological data from NASA POWER API
        
        Args:
            latitude: Latitude coordinate
            longitude: Longitude coordinate
            start_date: Start date in YYYYMMDD format
            end_date: End date in YYYYMMDD format
            parameters: List of parameters to download
            community: Data community (AG=Agroclimatology, RE=Renewable Energy)
            
        Returns:
            DataFrame with weather data
        """
        if parameters is None:
            # Flatten all parameters into single list
            parameters = []
            for param_list in self.weather_parameters.values():
                parameters.extend(param_list)
        
        # Construct API URL
        param_string = ','.join(parameters)
        url = f"{self.power_api_base}daily/point"
        
        params = {
            'parameters': param_string,
            'community': community,
            'longitude': longitude,
            'latitude': latitude,
            'start': start_date,
            'end': end_date,
            'format': 'JSON'
        }
        
        logger.info(f"Downloading NASA POWER data for coordinates ({latitude}, {longitude})")
        logger.info(f"Date range: {start_date} to {end_date}")
        
        try:
            response = requests.get(url, params=params, timeout=60)
            response.raise_for_status()
            
            data = response.json()
            
            # Create date index for reindexing
            dates = pd.date_range(
                start=pd.to_datetime(start_date, format='%Y%m%d'),
                end=pd.to_datetime(end_date, format='%Y%m%d'),
                freq='D'
            )
            
            # --- START OF FIX ---
            weather_data = data['properties']['parameter']
            
            # Create DataFrame using from_dict with orient='index' to transpose 
            # the structure so dates become the index and parameters become columns.
            df = pd.DataFrame.from_dict(weather_data)

            # The index is currently YYYYMMDD strings. Convert to datetime objects.
            df.index = pd.to_datetime(df.index, format='%Y%m%d')
            
            # Reindex to ensure all dates in the requested range are present
            df = df.reindex(dates)
            
            # --- END OF FIX ---
            
            # Add metadata
            df.attrs['latitude'] = latitude
            df.attrs['longitude'] = longitude
            df.attrs['source'] = 'NASA POWER API'
            df.attrs['download_date'] = datetime.now().isoformat()
            
            # Save raw data
            filename = f"nasa_power_{latitude}_{longitude}_{start_date}_{end_date}.csv"
            filepath = self.base_data_dir / 'raw' / 'nasa_power' / filename
            df.to_csv(filepath)
            
            logger.info(f"Successfully downloaded and saved NASA POWER data: {filename}")
            return df
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Error downloading NASA POWER data: {e}")
            return None
        except Exception as e:
            logger.error(f"Error processing NASA POWER data: {e}")
            return None
    
    def process_weather_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Process raw weather data with quality control and feature engineering
        
        Args:
            df: Raw weather DataFrame
            
        Returns:
            Processed DataFrame
        """
        logger.info("Processing weather data...")
        
        # Create copy for processing
        processed_df = df.copy()
        
        # Handle missing values
        processed_df = self.handle_missing_values(processed_df)
        
        # Add derived features
        processed_df = self.add_derived_features(processed_df)
        
        # Quality control checks
        processed_df = self.quality_control(processed_df)
        
        return processed_df
    
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values in weather data"""
        
        # Replace -999 (NASA POWER missing value indicator) with NaN
        df = df.replace(-999, np.nan)
        
        # Forward fill for short gaps (up to 3 days)
        # Using ffill() instead of method='ffill' to silence the FutureWarning
        df = df.ffill(limit=3) 
        
        # Backward fill for remaining gaps
        # Using bfill() instead of method='bfill' to silence the FutureWarning
        df = df.bfill(limit=3) 
        
        # Interpolate remaining missing values
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        df[numeric_cols] = df[numeric_cols].interpolate(method='linear')
        
        return df
    
    def add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add derived meteorological features"""
        
        # Temperature features
        if 'T2M_MAX' in df.columns and 'T2M_MIN' in df.columns:
            df['TEMP_RANGE'] = df['T2M_MAX'] - df['T2M_MIN']
            df['TEMP_MEAN'] = (df['T2M_MAX'] + df['T2M_MIN']) / 2
        
        # Heat index (simplified approximation)
        if 'T2M' in df.columns and 'RH2M' in df.columns:
            df['HEAT_INDEX'] = self.calculate_heat_index(df['T2M'], df['RH2M'])
        
        # Date-based features
        df['DAY_OF_YEAR'] = df.index.dayofyear
        df['MONTH'] = df.index.month
        df['SEASON'] = df.index.month%12 // 3 + 1  # 1=Winter, 2=Spring, 3=Summer, 4=Fall
        
        # Rolling statistics (7-day and 30-day windows)
        if 'T2M' in df.columns:
            # We use .shift(int) before the rolling window to align the calculated
            # mean/sum *before* the center date, making it non-future-looking.
            # Here we use center=False (default) and shift to get a *trailing* window.
            df['TEMP_7DAY_MEAN'] = df['T2M'].rolling(window=7).mean()
            df['TEMP_30DAY_MEAN'] = df['T2M'].rolling(window=30).mean()
        
        if 'PRECTOTCORR' in df.columns:
            df['PRECIP_7DAY_SUM'] = df['PRECTOTCORR'].rolling(window=7).sum()
            df['PRECIP_30DAY_SUM'] = df['PRECTOTCORR'].rolling(window=30).sum()
        
        return df
    
    def calculate_heat_index(self, temp_celsius: pd.Series, humidity: pd.Series) -> pd.Series:
        """Calculate heat index from temperature and humidity"""
        
        # Convert Celsius to Fahrenheit for heat index calculation
        temp_f = temp_celsius * 9/5 + 32
        
        # Simplified heat index formula (Rothfusz equation)
        # Note: This formula is complex and requires T_F >= 80 and RH >= 40 
        # for maximum accuracy, but it's used here as a robust approximation.
        hi = (-42.379 + 
              2.04901523 * temp_f + 
              10.14333127 * humidity/100 -  # humidity must be fraction (0 to 1) for the true HI formula
              0.22475541 * temp_f * humidity/100 - 
              6.83783e-3 * temp_f**2 - 
              5.481717e-2 * (humidity/100)**2 + 
              1.22874e-3 * temp_f**2 * humidity/100 + 
              8.5282e-4 * temp_f * (humidity/100)**2 - 
              1.99e-6 * temp_f**2 * (humidity/100)**2)
        
        # Convert back to Celsius
        hi_celsius = (hi - 32) * 5/9
        
        return hi_celsius
    
    def quality_control(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply quality control checks to weather data"""
        
        # Temperature bounds checking
        if 'T2M' in df.columns:
            # Flag unrealistic temperatures (< -70°C or > 60°C)
            temp_mask = (df['T2M'] < -70) | (df['T2M'] > 60)
            if temp_mask.any():
                logger.warning(f"Found {temp_mask.sum()} unrealistic temperature values")
                # Replace with NaN for further imputation if needed
                df.loc[temp_mask, 'T2M'] = np.nan 
        
        # Humidity bounds checking  
        if 'RH2M' in df.columns:
            # Relative humidity should be 0-100%
            humidity_mask = (df['RH2M'] < 0) | (df['RH2M'] > 100)
            if humidity_mask.any():
                logger.warning(f"Found {humidity_mask.sum()} invalid humidity values")
                # Clamp values to the valid range (0-100)
                df['RH2M'] = df['RH2M'].clip(0, 100)
        
        # Precipitation bounds checking
        if 'PRECTOTCORR' in df.columns:
            # Precipitation should be non-negative
            precip_mask = df['PRECTOTCORR'] < 0
            if precip_mask.any():
                logger.warning(f"Found {precip_mask.sum()} negative precipitation values. Setting to 0.")
                df.loc[precip_mask, 'PRECTOTCORR'] = 0
        
        return df


# Example usage function
def main():
    """Example usage of NASA data ingestion"""
    
    # Initialize data ingestion
    ingestion = NASADataIngestion("data")
    
    # Example coordinates (New York City)
    latitude = 40.7128
    longitude = -74.0060
    
    # Date range (last 2 years for example)
    end_date = datetime.now()
    start_date = end_date - timedelta(days=2*365)
    
    start_date_str = start_date.strftime('%Y%m%d')
    end_date_str = end_date.strftime('%Y%m%d')
    
    print(f"Testing NASA POWER API data download...")
    print(f"Location: {latitude}, {longitude}")
    print(f"Date range: {start_date_str} to {end_date_str}")
    
    # Download NASA POWER data
    df = ingestion.download_nasa_power_data(
        latitude=latitude,
        longitude=longitude,
        start_date=start_date_str,
        end_date=end_date_str
    )
    
    if df is not None:
        # Process the data
        processed_df = ingestion.process_weather_data(df)
        
        print(f"✓ Data processing complete. Processed data shape: {processed_df.shape}")
        print("Sample of processed data:")
        print(processed_df[['T2M', 'PRECTOTCORR', 'TEMP_7DAY_MEAN']].head())
        
        # Display some statistics
        print("\nData Statistics:")
        print(f"Temperature range: {processed_df['T2M'].min():.1f}°C to {processed_df['T2M'].max():.1f}°C")
        print(f"Humidity range: {processed_df['RH2M'].min():.1f}% to {processed_df['RH2M'].max():.1f}%")
        print(f"Max wind speed: {processed_df['WS2M'].max():.1f} m/s")
        print(f"Total precipitation: {processed_df['PRECTOTCORR'].sum():.1f} mm")
        
    else:
        print("❌ Failed to download data")

if __name__ == "__main__":
    main()