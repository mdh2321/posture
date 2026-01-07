#!/usr/bin/env python3
"""Generate extension icons programmatically"""

from PIL import Image, ImageDraw
import os

def create_icon(size):
    """Create a single icon of the specified size"""
    # Create image with gradient-like background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # Draw gradient effect (purple theme)
    for i in range(size):
        # Create gradient from #667eea to #764ba2
        r = int(102 + (118 - 102) * i / size)
        g = int(126 + (75 - 126) * i / size)
        b = int(234 + (162 - 234) * i / size)
        draw.line([(0, i), (size, i)], fill=(r, g, b))

    # Draw simple person/posture icon in white
    if size >= 48:
        # Head (circle)
        head_radius = int(size * 0.12)
        head_x = size // 2
        head_y = int(size * 0.35)
        draw.ellipse(
            [head_x - head_radius, head_y - head_radius,
             head_x + head_radius, head_y + head_radius],
            fill='white'
        )

        # Body/spine (rectangle)
        body_width = int(size * 0.08)
        body_x = size // 2 - body_width // 2
        body_y = int(size * 0.45)
        body_height = int(size * 0.35)
        draw.rectangle(
            [body_x, body_y, body_x + body_width, body_y + body_height],
            fill='white'
        )

        # Shoulders (thick line)
        shoulder_y = int(size * 0.5)
        shoulder_width = int(size * 0.08)
        draw.rectangle(
            [int(size * 0.3), shoulder_y - shoulder_width // 2,
             int(size * 0.7), shoulder_y + shoulder_width // 2],
            fill='white'
        )
    else:
        # Simplified for 16x16
        # Head
        head_radius = int(size * 0.2)
        head_x = size // 2
        head_y = int(size * 0.4)
        draw.ellipse(
            [head_x - head_radius, head_y - head_radius,
             head_x + head_radius, head_y + head_radius],
            fill='white'
        )

        # Body
        body_width = int(size * 0.2)
        body_x = size // 2 - body_width // 2
        body_y = int(size * 0.55)
        body_height = int(size * 0.3)
        draw.rectangle(
            [body_x, body_y, body_x + body_width, body_y + body_height],
            fill='white'
        )

    return img

# Create output directory if it doesn't exist
output_dir = 'extension/assets/icons'
os.makedirs(output_dir, exist_ok=True)

# Generate icons
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'{output_dir}/icon{size}.png')
    print(f'Created icon{size}.png')

print('\n✓ All icons generated successfully!')
