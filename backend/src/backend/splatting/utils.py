import base64
from io import BytesIO
from PIL import Image
import uuid
import os

def base64_to_image(base64_str: str) -> Image:
    try:
        image_data = base64.b64decode(base64_str)
        image = Image.open(BytesIO(image_data))
        return image
    except Exception as e:
        raise ValueError("Invalid base64 image") from e


def construct_splat(images: list[Image], output_path: str) -> None: 
    """
    Constructs a splat, saving it to a file.
    """
    tmp_dir = os.path.join(os.path.dirname(__file__), "tmp", uuid.uuid4().hex)
    
    photogrammetry_binary = "/Users/hdeep/Documents/GitHub/HackTech2025/backend/photogrammetry" # TODO: Make this configurable
    os.makedirs(tmp_dir, exist_ok=True)
    # save images to tmp_dir
    for i, image in enumerate(images):
        image.save(os.path.join(tmp_dir, f"image_{i}.png"))
    
    # run photogrammetry binary
    try:
        os.system(f"{photogrammetry_binary} {tmp_dir} {output_path}")
        print(f"Splat constructed at {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error running photogrammetry binary: {e}")
    
    
