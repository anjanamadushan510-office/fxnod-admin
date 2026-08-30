import sys
import cv2
import json

img = cv2.imread(sys.argv[1])
if img is None:
    print("Could not read image")
    sys.exit(1)

# Convert to grayscale
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
# The color picker boxes usually have a distinct border or color.
# Let's find contours.
_, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)
contours, _ = cv2.findContours(thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

rects = []
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    # The boxes in Deriv are small squares, approx 15x15 to 25x25
    if 10 < w < 30 and 10 < h < 30 and abs(w - h) < 5:
        rects.append((x, y, w, h))

if not rects:
    print("No rects found")
    sys.exit(0)

# Sort all rects top-to-bottom, left-to-right
rects.sort(key=lambda b: (b[1] // 10, b[0]))
rows = {}
for r in rects:
    x, y, w, h = r
    # Cluster by y-coordinate
    bucket = None
    for k in rows.keys():
        if abs(k - y) < 10:
            bucket = k
            break
    if bucket is None:
        bucket = y
        rows[bucket] = []
    rows[bucket].append(r)

# Find the 4 rows with the most items
sorted_rows = sorted(rows.values(), key=lambda r: len(r), reverse=True)
if len(sorted_rows) < 4:
    print("Could not find 4 rows")
    sys.exit(0)

best_4 = sorted(sorted_rows[:4], key=lambda r: r[0][1]) # Sort the top 4 rows top-to-bottom

colors = []
for row in best_4:
    row_colors = []
    # Sort left-to-right
    row = sorted(row, key=lambda b: b[0])
    for (x, y, w, h) in row:
        cx = x + w // 2
        cy = y + h // 2
        b, g, r = img[cy, cx]
        row_colors.append(f"#{r:02x}{g:02x}{b:02x}")
    colors.append(row_colors)

# Flatten colors row by row
flat = []
for row in colors:
    flat.extend(row)
print("ROWS: 4")
print(f"COLS: {len(best_4[0])}")
print("TOTAL:", len(flat))
print(json.dumps(flat))
