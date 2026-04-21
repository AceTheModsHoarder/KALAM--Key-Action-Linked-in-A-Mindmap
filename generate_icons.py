"""
Generate Android app icons for KALAM app following HCI principles.
- Simple, recognizable design
- Good contrast and readability
- Dark theme with professional appearance
"""

from PIL import Image, ImageDraw, ImageFont
import os
from pathlib import Path

# Icon sizes for different densities
ICON_SIZES = {
    'ldpi': 36,
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

# Color scheme (dark hue with accent)
BACKGROUND_COLOR = (26, 35, 51)  # Dark blue-gray
ACCENT_COLOR = (79, 172, 254)    # Bright blue accent
TEXT_COLOR = (255, 255, 255)      # White text

# Base path
BASE_PATH = Path(__file__).parent / 'mindmap-ui' / 'android' / 'app' / 'src' / 'main' / 'res'

def create_icon(size, add_accent=True):
    """Create a simple minimalist mindmap icon at given size."""
    # Create image with dark background
    img = Image.new('RGB', (size, size), BACKGROUND_COLOR)
    draw = ImageDraw.Draw(img)
    
    # Simple mindmap design: central node with 4 connecting nodes
    center = size // 2
    radius = size // 8
    node_radius = size // 12
    
    # Draw connecting lines from center to outer nodes
    line_width = max(1, size // 48)
    positions = [
        (center, center - size // 3),  # Top
        (center, center + size // 3),  # Bottom
        (center - size // 3, center),  # Left
        (center + size // 3, center),  # Right
    ]
    
    # Draw lines
    for pos in positions:
        draw.line([(center, center), pos], fill=ACCENT_COLOR, width=line_width)
    
    # Draw central node
    draw.ellipse(
        [(center - radius, center - radius), 
         (center + radius, center + radius)],
        fill=ACCENT_COLOR
    )
    
    # Draw outer nodes (smaller)
    for pos in positions:
        node_r = node_radius
        draw.ellipse(
            [(pos[0] - node_r, pos[1] - node_r),
             (pos[0] + node_r, pos[1] + node_r)],
            fill=ACCENT_COLOR
        )
    
    return img

def create_foreground_icon(size):
    """Create foreground icon for adaptive icons (Android 8+)."""
    # Foreground should be transparent PNG with just the design element
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))  # Transparent background
    draw = ImageDraw.Draw(img)
    
    # Simple mindmap design: central node with 4 connecting nodes
    center = size // 2
    radius = size // 8
    node_radius = size // 12
    
    # Draw connecting lines from center to outer nodes
    line_width = max(1, size // 48)
    positions = [
        (center, center - size // 3),  # Top
        (center, center + size // 3),  # Bottom
        (center - size // 3, center),  # Left
        (center + size // 3, center),  # Right
    ]
    
    # Draw lines with alpha
    for pos in positions:
        draw.line([(center, center), pos], fill=ACCENT_COLOR + (255,), width=line_width)
    
    # Draw central node
    draw.ellipse(
        [(center - radius, center - radius), 
         (center + radius, center + radius)],
        fill=ACCENT_COLOR + (255,)
    )
    
    # Draw outer nodes (smaller)
    for pos in positions:
        node_r = node_radius
        draw.ellipse(
            [(pos[0] - node_r, pos[1] - node_r),
             (pos[0] + node_r, pos[1] + node_r)],
            fill=ACCENT_COLOR + (255,)
        )
    
    return img

def create_rounded_icon(img):
    """Create a rounded version of the icon."""
    size = img.size[0]
    # Create a circular mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse((0, 0, size - 1, size - 1), fill=255)
    
    # Apply mask
    output = Image.new('RGB', (size, size), BACKGROUND_COLOR)
    output.paste(img, (0, 0))
    output.putalpha(mask)
    
    # Convert back to RGB for saving
    final = Image.new('RGB', (size, size), BACKGROUND_COLOR)
    final.paste(output, (0, 0), mask)
    
    return final

def generate_all_icons():
    """Generate all icon variants for all densities."""
    print("Generating KALAM app icons...")
    
    for density, size in ICON_SIZES.items():
        print(f"\nGenerating icons for {density} ({size}x{size})...")
        
        # Create icon
        icon = create_icon(size)
        rounded = create_rounded_icon(icon.copy())
        foreground = create_foreground_icon(size)
        
        # Create directory paths
        mipmap_dir = BASE_PATH / f'mipmap-{density}'
        mipmap_dir.mkdir(parents=True, exist_ok=True)
        
        # Save icons
        icon_path = mipmap_dir / 'ic_launcher.png'
        rounded_path = mipmap_dir / 'ic_launcher_round.png'
        foreground_path = mipmap_dir / 'ic_launcher_foreground.png'
        
        icon.save(icon_path, 'PNG')
        rounded.save(rounded_path, 'PNG')
        foreground.save(foreground_path, 'PNG')
        
        print(f"  ✓ Saved ic_launcher.png")
        print(f"  ✓ Saved ic_launcher_round.png")
        print(f"  ✓ Saved ic_launcher_foreground.png")
    
    print("\n✓ All icons generated successfully!")
    print(f"\nIcons saved to: {BASE_PATH}")

if __name__ == '__main__':
    generate_all_icons()
