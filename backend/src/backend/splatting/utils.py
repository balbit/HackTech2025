import base64
import uuid
import os

def base64_to_binary_text(base64_str: str) -> bytes:
    try:
        image_data = base64.b64decode(base64_str)
        return image_data
    except Exception as e:
        raise ValueError("Invalid base64 image") from e


def construct_splat(images: list[bytes], output_path: str) -> None: 
    """
    Constructs a splat, saving it to a file.
    """
    tmp_dir = os.path.join(os.path.dirname(__file__), "tmp", uuid.uuid4().hex)
    
    # Get the path to the backend directory
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
    photogrammetry_binary = os.path.join(backend_dir, "photogrammetry") # TODO: Make this configurable
    os.makedirs(tmp_dir, exist_ok=True)
    # save images to tmp_dir
    for i, image in enumerate(images):
        with open(os.path.join(tmp_dir, f"image_{i}.heic"), "wb") as f:
            f.write(image)
    
    # run photogrammetry binary
    try:
        os.system(f"{photogrammetry_binary} {tmp_dir} {output_path}")
        print(f"Splat constructed at {output_path}")
    except subprocess.CalledProcessError as e:
        print(f"Error running photogrammetry binary: {e}")
    
    
