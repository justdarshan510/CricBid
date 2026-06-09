import os
from PIL import Image

def main():
    generated_path = r"C:\Users\justd\.gemini\antigravity-ide\brain\9af5761f-70a7-4f39-87c7-2070c376d777\csk_blended_left_1780981966519.png"
    old_bg_path = "public/team-backgrounds/csk-background-old.jpg"
    output_path = r"C:\Users\justd\.gemini\antigravity-ide\brain\9af5761f-70a7-4f39-87c7-2070c376d777\csk_blended_left_with_logo.png"
    
    # Load generated blended image (1024x1024)
    gen_img = Image.open(generated_path).convert("RGBA")
    
    # Load original background (3840x2560)
    old_bg = Image.open(old_bg_path).convert("RGBA")
    
    # Resize original background directly to 1024x1024 to match the generation model's canvas size
    old_bg_resized = old_bg.resize((1024, 1024), Image.Resampling.LANCZOS)
    
    # Crop the top-right corner of the original background (where the original logo is)
    # Let's crop from x=800 to 1024, y=0 to 200
    box = (800, 0, 1024, 200)
    original_top_right = old_bg_resized.crop(box)
    
    # Paste this original top-right region onto the generated image to replace the bad logo
    gen_img.paste(original_top_right, (800, 0))
    
    # Save the output
    gen_img.save(output_path, "PNG")
    print("Logo restored from original background successfully!")

if __name__ == "__main__":
    main()
