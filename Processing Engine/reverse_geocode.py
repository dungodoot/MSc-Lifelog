import sqlite3
import time
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

DB_FILE = "../lifelog.db"

def process_images():
    """
    Connects to the SQLite database, finds images without an address,
    performs reverse geocoding, and updates the records.
    """
    # Initialize the geolocator and the rate limiter
    geolocator = Nominatim(user_agent="image_geocoder_v1.0")
    reverse = RateLimiter(geolocator.reverse, min_delay_seconds=1)

    # Connect to the SQLite database
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Select all rows where latitude and longitude exist but address is empty or NULL
        cursor.execute("""
            SELECT id, latitude, longitude FROM image
            WHERE latitude IS NOT NULL 
            AND longitude IS NOT NULL
            AND (address IS NULL OR address = '')
        """)

        rows_to_process = cursor.fetchall()

        if not rows_to_process:
            print("No images found that need geocoding. ✨")
            return

        print(f"Found {len(rows_to_process)} images to geocode...")

        for row in rows_to_process:
            try:
                coordinates = f"{row['latitude']}, {row['longitude']}"

                location = reverse(coordinates)

                address = location.address if location else "Address not found"
                print(f"ID {row['id']}: Found address -> {address}")

                # Update the table with the new address
                cursor.execute(
                    "UPDATE image SET address = ? WHERE id = ?",
                    (address, row['id'])
                )
                conn.commit()

            except Exception as e:
                print(f"An error occurred for ID {row['id']}: {e}")
                time.sleep(2)

    finally:
        conn.close()
        print("Processing complete.")

if __name__ == "__main__":
    process_images()