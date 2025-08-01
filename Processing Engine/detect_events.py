import sqlite3
import dataclasses
from datetime import datetime
from haversine import haversine, Unit
from typing import List, Tuple

DB_FILE = '../lifelog.db'

@dataclasses.dataclass
class Point:
    id: int
    timestamp: datetime
    geolocation: Tuple[float, float]  # latitude, longitude

def calculate_centroid(points: List[Point]) -> Tuple[float, float]:
    avg_lat = sum(p.geolocation[0] for p in points) / len(points)
    avg_lon = sum(p.geolocation[1] for p in points) / len(points)
    return (avg_lat, avg_lon)

def detect_stay_clusters(points: List[Point], radius_m: float, duration_s: int) -> List[List[Point]]:
    if not points:
        return []

    stay_clusters = []
    current_cluster = [points[0]]



    for i in range(1, len(points)):
        current_point = points[i]
        anchor_point = current_cluster[0]

        distance = haversine(
            current_point.geolocation,
            anchor_point.geolocation,
            unit=Unit.METERS
        )

        print('distance:', distance)
        if distance <= radius_m:
            current_cluster.append(current_point)
        else:
            print('New cluster detected, processing current cluster...')
            duration = (current_cluster[-1].timestamp - current_cluster[0].timestamp).total_seconds()
            print('duration:', duration)
            if duration >= duration_s:
                stay_clusters.append(current_cluster)
            current_cluster = [current_point]

    if current_cluster:
        duration = (current_cluster[-1].timestamp - current_cluster[0].timestamp).total_seconds()
        if duration >= duration_s:
            stay_clusters.append(current_cluster)

    return stay_clusters

def main():
    db_file = DB_FILE

    # Define parameters
    RADIUS_METERS = 50
    MIN_DURATION_SECONDS = 300

    print(f"Connecting to database '{db_file}'...")
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()

    try:
        cursor.execute("SELECT id, timestamp, latitude, longitude FROM image ORDER BY timestamp ASC")
        rows = cursor.fetchall()
    except sqlite3.OperationalError as e:
        print(f"Error fetching data: {e}")
        print("Please ensure 'lifelog.db' exists and contains an 'image' table with the correct columns.")
        conn.close()
        return

    points = [
        Point(
            id=row[0],
            timestamp=datetime.fromtimestamp(row[1]),
            geolocation=(row[2], row[3])
        ) for row in rows
    ]
    print(f"Loaded {len(points)} data points.")

    print("Detecting stays...")
    stay_clusters = detect_stay_clusters(points, RADIUS_METERS, MIN_DURATION_SECONDS)
    print(f"Detected {len(stay_clusters)} potential stay events.")

    if not stay_clusters:
        print("No new stays detected. Exiting.")
        conn.close()
        return

    print("Writing new albums to database...")
    for cluster in stay_clusters:
        start_time = cluster[0].timestamp
        centroid = calculate_centroid(cluster)

        album_name = f"Stay at ({centroid[0]:.4f}, {centroid[1]:.4f}) on {start_time.strftime('%Y-%m-%d')}"
        album_timestamp_ms = int(start_time.timestamp())

        cursor.execute(
            "INSERT INTO album (name, timestamp, thumbnail_image_id) VALUES (?, ?, ?)",
            (album_name, album_timestamp_ms, cluster[0].id if cluster else 1)
        )
        album_id = cursor.lastrowid

        image_links = [(album_id, point.id) for point in cluster]

        cursor.executemany(
            "INSERT INTO album_image (album_id, image_id) VALUES (?, ?)",
            image_links
        )
        print(f"  - Created album '{album_name}' (ID: {album_id}) with {len(cluster)} images.")

    conn.commit()
    conn.close()
    print("\nDatabase updated successfully.")

if __name__ == "__main__":
    main()