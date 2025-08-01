import face_recognition
import os
import shutil
from PIL import Image
import sqlite3
import pickle
import base64
import imagehash
from datetime import datetime
from PIL.ExifTags import TAGS

PHOTO_DIR = '../photos'
DB_FILE = '../lifelog.db'

# Set up the database connection
con = sqlite3.connect(DB_FILE)
cur = con.cursor()

def encoding_to_base64(encoding):
    # Convert a numpy encoding to a base64 string
    return base64.b64encode(pickle.dumps(encoding)).decode('utf-8')

def base64_to_encoding(base64_str):
    # Convert a base64 string back to a numpy encoding
    return pickle.loads(base64.b64decode(base64_str.encode('utf-8')))

def base64_arr_to_encoding(base64_arr):
    # Convert a list of base64 strings to a list of numpy encodings
    return [base64_to_encoding(base64_str) for base64_str in base64_arr]

def get_face_encodings_from_db():
    # Retrieve all face encodings from the database
    cur.execute("SELECT id, encoding FROM face")
    rows = cur.fetchall()
    return [row[0] for row in rows],[base64_to_encoding(row[1]) for row in rows]

def save_face_encoding_to_db(encoding):
    # Save a face encoding to the database
    base64_encoding = encoding_to_base64(encoding)
    cur.execute("INSERT INTO face (encoding) VALUES (?)", (base64_encoding,))
    con.commit()

    # Get id of the face encoding
    cur.execute("SELECT id FROM face WHERE encoding = ?", (base64_encoding,))
    row = cur.fetchone()
    if row:
        face_id = row[0]
        print(f'Face encoding {base64_encoding} saved with ID {face_id}')
        return face_id
    else:
        return None

def get_decimal_from_dms(dms, ref):
    degrees = dms[0]
    minutes = dms[1] / 60.0
    seconds = dms[2] / 3600.0

    if ref in ['S', 'W']:
        degrees = -degrees
        minutes = -minutes
        seconds = -seconds

    return degrees + minutes + seconds

def get_exif_ifd(exif):
    for key, value in TAGS.items():
        if value == "ExifOffset":
            break
    info = exif.get_ifd(key)
    return {
        TAGS.get(key, key): value
        for key, value in info.items()
    }

def save_image_to_db(path):
    dest_dir = '../User Interface/public/photos/'
    try:
        image = Image.open(path)
    except FileNotFoundError:
        print(f"Error: Image not found at {path}")
        return None

    timestamp = None
    latitude = 0
    longitude = 0

    # Get EXIF data
    exif_data = image.getexif()
    if exif_data:
        try:
            exif_ifd = get_exif_ifd(exif_data)
            if 'DateTimeOriginal' in exif_ifd:
                timestamp = int(datetime.strptime(exif_ifd['DateTimeOriginal'], '%Y:%m:%d %H:%M:%S').timestamp())

            gps_ifd = exif_data.get_ifd(0x8825) # GPS IFD tag
            if gps_ifd.get(2) and gps_ifd.get(4):
                latitude = get_decimal_from_dms(gps_ifd[2], gps_ifd.get(1))
                longitude = get_decimal_from_dms(gps_ifd[4], gps_ifd.get(3))
        except (KeyError, TypeError, AttributeError):
            # Handle cases with incomplete or malformed EXIF data
            pass

    if not timestamp:
        print(f'No EXIF timestamp found for {path}, using current time.')
        timestamp = int(datetime.now().timestamp())

    dt_object = datetime.fromtimestamp(timestamp)
    time_of_day = dt_object.hour * 3600 + dt_object.minute * 60 + dt_object.second

    phash = imagehash.phash(image)
    width, height = image.size
    db_path = path
    if db_path.startswith('..'):
        db_path = db_path[2:]

    try:
        cur.execute("""
        INSERT INTO image (phash, path, timestamp, width, height, latitude, longitude, time_of_day)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
            phash=excluded.phash,
            timestamp=excluded.timestamp,
            width=excluded.width,
            height=excluded.height,
            latitude=excluded.latitude,
            longitude=excluded.longitude,
            time_of_day=excluded.time_of_day
        RETURNING id;
        """, (str(phash), db_path, timestamp, width, height, latitude, longitude, time_of_day))

        # Fetch the returned ID
        row = cur.fetchone()
        if row:
            image_id = row[0]
            con.commit()
            print(f'Image {path} processed with ID {image_id}')

            try:
                shutil.copy2(path, dest_dir)
                print(f'Image {path} copied to {dest_dir}')
            except Exception as e:
                print(f'Error copying file {path}: {e}')

            return image_id
        else:
            con.rollback()
            return None

    except Exception as e:
        print(f'Error saving image {path} to database: {e}')
        con.rollback()
        return None

def save_image_face_to_db(image_id, face_id, location_top, location_right, location_bottom, location_left):
    try:
        cur.execute("INSERT OR IGNORE INTO image_face (image_id, face_id, location_top, location_right, location_bottom, location_left) VALUES (?, ?, ?, ?, ?, ?)", (image_id, face_id, location_top, location_right, location_bottom, location_left,))
        con.commit()
    except Exception as e:
        print(f'Error saving image-face relationship to database: {e}')

def process_faces():
    photos_path = PHOTO_DIR
    try:
        # Get the list of files and directories
        files = os.listdir(photos_path)

        # Sort the list of files alphabetically
        sorted_files = sorted(files)

        for filename in sorted_files:
            file_path = os.path.join(photos_path, filename)

            if os.path.isfile(file_path):
                print(f'Processing {filename}...')
                try:
                    image_id = save_image_to_db(file_path,)
                    img = face_recognition.load_image_file(file_path)
                    unknown_encodings = face_recognition.face_encodings(img)
                    face_locations = face_recognition.face_locations(img)

                    for idx, unknown_encoding in enumerate(unknown_encodings):
                        # Check if the face is known
                        face_ids, stored_encodings = get_face_encodings_from_db()
                        result = face_recognition.compare_faces(stored_encodings, unknown_encoding, tolerance=0.48)
                        if any(result):
                            print(f'Face in {filename} is known.')
                            face_index = result.index(True)
                            face_id = face_ids[face_index]
                        else:
                            print(f'Face in {filename} is unknown.')
                            face_id = save_face_encoding_to_db(unknown_encoding)
                        save_image_face_to_db(image_id, face_id, face_locations[idx][0], face_locations[idx][1], face_locations[idx][2], face_locations[idx][3])

                except Exception as e:
                    print(f'Error processing {filename}: {e}')
            else:
                print(f'{filename} is not a file.')

    except FileNotFoundError:
        print(f'The folder at "{photos_path}" was not found.')
    except Exception as e:
        print(f'An error occurred: {e}')

if __name__ == "__main__":
    process_faces()
    con.close()