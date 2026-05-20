import sys
from rembg import remove
from PIL import Image

def main():
    input_path = "C:\\Users\\dio\\.gemini\\antigravity\\scratch\\turc-academy\\ChatGPT Image 17 Mei 2026, 14.52.55.png"
    output_path = "C:\\Users\\dio\\.gemini\\antigravity\\scratch\\turc-academy\\public\\assets\\transparent_bg.png"
    
    print(f"Opening image: {input_path}")
    input_img = Image.open(input_path)
    print("Processing...")
    output_img = remove(input_img)
    print(f"Saving to {output_path}")
    output_img.save(output_path)
    print("Done!")

if __name__ == "__main__":
    main()
