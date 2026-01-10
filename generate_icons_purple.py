#!/usr/bin/env python3
"""Generate extension icons with purple wellness theme and upward arrow"""

from PIL import Image, ImageDraw
import os

def create_icon_with_arrow(size):
    """Create icon with purple background and white upward arrow"""
    # Create image with purple wellness background
    img = Image.new('RGBA', (size, size), color=(102, 126, 234, 255))  # #667eea
    draw = ImageDraw.Draw(img)

    # Apply rounded corners
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = int(size * 0.1875)  # 24/128 = 0.1875
    mask_draw.rounded_rectangle([(0, 0), (size, size)], corner_radius, fill=255)

    # Create rounded background
    rounded_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    rounded_img.paste(img, (0, 0), mask)

    draw = ImageDraw.Draw(rounded_img)

    # Scale factor for the arrow based on icon size
    scale = size / 128.0

    # Center point
    cx = size / 2
    cy = size / 2

    # Arrow dimensions (scaled from original SVG)
    # Original arrow: from y=-42 to y=42, width at base = 20, arrowhead = 48 wide
    arrow_height = 84 * scale
    arrow_width = 20 * scale
    arrowhead_width = 48 * scale
    arrowhead_height = 24 * scale

    # Define arrow points (upward pointing)
    arrow_points = [
        # Arrow tip (top)
        (cx, cy - arrow_height/2),
        # Right side of arrowhead
        (cx + arrowhead_width/2, cy - arrow_height/2 + arrowhead_height),
        # Right side of shaft (top)
        (cx + arrow_width/2, cy - arrow_height/2 + arrowhead_height),
        # Right side of shaft (bottom)
        (cx + arrow_width/2, cy + arrow_height/2),
        # Left side of shaft (bottom)
        (cx - arrow_width/2, cy + arrow_height/2),
        # Left side of shaft (top)
        (cx - arrow_width/2, cy - arrow_height/2 + arrowhead_height),
        # Left side of arrowhead
        (cx - arrowhead_width/2, cy - arrow_height/2 + arrowhead_height),
    ]

    # Draw white arrow
    draw.polygon(arrow_points, fill='white')

    return rounded_img

# Create output directory
output_dir = 'extension/assets/icons'
os.makedirs(output_dir, exist_ok=True)

# Generate icons at different sizes
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon_with_arrow(size)
    icon.save(f'{output_dir}/icon{size}.png')
    print(f'Created icon{size}.png with purple wellness theme')

print('\n✓ All icons generated successfully with purple color (#667eea)!')
