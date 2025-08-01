import time
import serial
import os
from picamera2 import Picamera2
import piexif

CAPTURE_INTERVAL = 20
SERIAL_PORT = '/dev/serial0'
BAUD_RATE = 9600
PHOTO_DIR = 'photos'

# Helper Functions

def to_deg_min_sec(decimal_degrees):
    degrees = int(decimal_degrees)
    minutes_decimal = (decimal_degrees - degrees) * 60
    minutes = int(minutes_decimal)
    seconds_decimal = (minutes_decimal - minutes) * 60
    return ((degrees, 1), (minutes, 1), (int(seconds_decimal * 1000), 1000))

def get_gps_data(ser, timeout=5):
    start_time = time.time()
    while time.time() - start_time < timeout:
        line = ser.readline().decode('ascii', errors='ignore')
        if line.startswith('$GPGGA'):
            parts = line.split(',')
            # Check for a valid fix (quality > 0)
            if len(parts) > 6 and parts[6] and int(parts[6]) > 0:
                try:
                    # Latitude format: ddmm.mmmm
                    lat_raw = float(parts[2])
                    lat_deg = int(lat_raw / 100)
                    lat_min = lat_raw - (lat_deg * 100)
                    latitude = lat_deg + (lat_min / 60)
                    if parts[3] == 'S':
                        latitude = -latitude

                    # Longitude format: dddmm.mmmm
                    lon_raw = float(parts[4])
                    lon_deg = int(lon_raw / 100)
                    lon_min = lon_raw - (lon_deg * 100)
                    longitude = lon_deg + (lon_min / 60)
                    if parts[5] == 'W':
                        longitude = -longitude

                    return {"latitude": latitude, "longitude": longitude}
                except (ValueError, IndexError):
                    continue # Ignore parsing errors and try again
    return None # Return None if no valid fix is found within the timeout

# --- Main Script ---

if __name__ == "__main__":
    os.makedirs(PHOTO_DIR, exist_ok=True)

    picam2 = Picamera2()
    camera_config = picam2.create_still_configuration()
    picam2.configure(camera_config)
    picam2.start()

    ser = None
    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
        print("GPS Photo Logger Started. Press Ctrl+C to stop.")
        print("Waiting for initial GPS fix...")

        while True:
            gps_data = get_gps_data(ser)

            if gps_data:
                print(f"GPS fix acquired: Lat={gps_data['latitude']:.5f}, Lon={gps_data['longitude']:.5f}")

                # Capture Photo
                filename = f"photo_{int(time.time())}.jpg"
                filepath = os.path.join(PHOTO_DIR, filename)
                picam2.capture_file(filepath)
                print(f"Captured {filepath}")

                # Prepare EXIF Data
                exif_dict = piexif.load(filepath)

                # Date/Time Original
                now = time.localtime()
                date_str = time.strftime("%Y:%m:%d %H:%M:%S", now)
                exif_dict['Exif'][piexif.ExifIFD.DateTimeOriginal] = date_str

                # GPS Info
                lat_dms = to_deg_min_sec(abs(gps_data['latitude']))
                lon_dms = to_deg_min_sec(abs(gps_data['longitude']))

                gps_ifd = {
                    piexif.GPSIFD.GPSLatitudeRef: 'N' if gps_data['latitude'] >= 0 else 'S',
                    piexif.GPSIFD.GPSLatitude: lat_dms,
                    piexif.GPSIFD.GPSLongitudeRef: 'E' if gps_data['longitude'] >= 0 else 'W',
                    piexif.GPSIFD.GPSLongitude: lon_dms,
                }
                exif_dict['GPS'] = gps_ifd

                # Embed EXIF Data into Image
                exif_bytes = piexif.dump(exif_dict)
                piexif.insert(exif_bytes, filepath)
                print(f"-> EXIF data embedded successfully.\n")

            else:
                print("Waiting for GPS fix...")

            time.sleep(CAPTURE_INTERVAL)

    except serial.SerialException as e:
        print(f"Serial Error: {e}")
    except KeyboardInterrupt:
        print("\nProgram stopped by user.")
    finally:
        picam2.stop()
        if ser and ser.is_open:
            ser.close()