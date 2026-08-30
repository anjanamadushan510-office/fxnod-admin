import sys
import cv2
import numpy as np

img = cv2.imread(sys.argv[1])
if img is None:
    print("Could not read image")
    sys.exit(1)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

rects = []
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    if 10 < w < 30 and 10 < h < 30 and abs(w - h) < 5:
        rects.append((x, y, w, h))

if not rects:
    print("No rects found")
    sys.exit(0)

rects.sort(key=lambda b: (b[1] // 10, b[0]))
rows = {}
for r in rects:
    x, y, w, h = r
    bucket = y // 15
    if bucket not in rows:
        rows[bucket] = []
    rows[bucket].append(r)

grid = []
for k in sorted(rows.keys()):
    row = sorted(rows[k], key=lambda b: b[0])
    if 15 <= len(row) <= 17:
        grid.append(row)

if len(grid) >= 4:
    grid = grid[-4:]
    colors = []
    for row in grid:
        row_colors = []
        for (x, y, w, h) in row:
            cx = x + w // 2
            cy = y + h // 2
            b, g, r = img[cy, cx]
            row_colors.append(f"#{r:02x}{g:02x}{b:02x}")
        colors.append(row_colors)
    
    for row in colors:
        print(row)
else:
    print(f"Found {len(grid)} rows matching 16 columns.")
