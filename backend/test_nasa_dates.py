"""
Test NASA POWER API with different date ranges to find working data
"""

import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def test_nasa_api_dates():
    """Test NASA POWER API with different date ranges"""
    
    base_url = "https://power.larc.nasa.gov/api/temporal/daily/point"
    
    # Test coordinates (New York City)
    lat, lon = 40.7128, -74.0060
    
    # Test different date ranges (older data is more reliable)
    test_ranges = [
        ("20220101", "20220131", "Jan 2022"),
        ("20210701", "20210731", "Jul 2021"), 
        ("20200601", "20200630", "Jun 2020"),
        ("20191201", "20191231", "Dec 2019")
    ]
    
    for start_date, end_date, description in test_ranges:
        print(f"\n🧪 Testing {description} ({start_date} to {end_date})...")
        
        params = {
            'parameters': 'T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR,WS2M',
            'community': 'AG',
            'longitude': lon,
            'latitude': lat,
            'start': start_date,
            'end': end_date,
            'format': 'JSON'
        }
        
        try:
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            
            data = response.json()
            
            if 'properties' in data and 'parameter' in data['properties']:
                weather_data = data['properties']['parameter']
                
                # Create DataFrame
                dates = pd.date_range(
                    start=pd.to_datetime(start_date, format='%Y%m%d'),
                    end=pd.to_datetime(end_date, format='%Y%m%d'),
                    freq='D'
                )
                
                df = pd.DataFrame(weather_data, index=dates)
                df = df.replace(-999, np.nan)  # Replace NASA missing values
                
                # Check data quality
                valid_temp = df['T2M'].dropna()
                valid_precip = df['PRECTOTCORR'].dropna()
                
                print(f"   📊 Data shape: {df.shape}")
                print(f"   🌡️  Valid temperature data: {len(valid_temp)}/{len(df)} days")
                
                if len(valid_temp) > 0:
                    print(f"   📈 Temperature range: {valid_temp.min():.1f}°C to {valid_temp.max():.1f}°C")
                    print(f"   ✅ SUCCESS - Got valid data for {description}")
                    
                    # Save the working data
                    filename = f"working_nasa_data_{start_date}_{end_date}.csv"
                    filepath = f"data/raw/nasa_power/{filename}"
                    df.to_csv(filepath)
                    print(f"   💾 Saved working data to: {filename}")
                    return df, (start_date, end_date)
                else:
                    print(f"   ❌ No valid temperature data for {description}")
            else:
                print(f"   ❌ Invalid API response structure for {description}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ API request failed for {description}: {e}")
        except Exception as e:
            print(f"   ❌ Error processing {description}: {e}")
    
    print("\n❌ No working data found in any test range")
    return None, None

if __name__ == "__main__":
    test_nasa_api_dates()
