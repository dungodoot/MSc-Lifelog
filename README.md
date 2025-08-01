# MSc Project - Lifelog

## Prerequisites

### Software

- Python 3.11
- Node.js

### Hardware

- Raspberry Pi 4 / Raspberry Pi 5 / CM4 / CM5
- Raspberry Pi Camera Module 3
- Any UART GPS module

## Deploying

### Raspbery Pi

Clone the repository onto the Raspberry Pi and run the Python script inside the `Raspberry Pi` folder.

```bash
git clone https://github.com/dungodoot/MSc-Lifelog.git
cd MSc-Lifelog/Raspberry\ Pi
sudo python photo.py
```

### Processing Engine

The processing engine and user interface should be run on your computer. First, clone the repository to your device.

```bash
git clone https://github.com/dungodoot/MSc-Lifelog.git
cd Processing\ Engine
```

Once the photos from the Raspberry Pi has been captured, transfer them into the `photos` folder in your device. To ingest the photos, run:

```bash
python ingest_images.py
```

To reverse geocode the images, run:

```bash
python reverse_geocode.py
```

To run the event detection algorithm, run:

```bash
python detect_events.py
```

### User Interface

```bash
cd User\ Interface
npm run build
npm run start
```
