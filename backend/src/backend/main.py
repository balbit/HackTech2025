import os

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from src.backend.splatting.utils import construct_splat, base64_to_image

app = FastAPI()

SPLAT_PATH = "/Users/hdeep/Documents/GitHub/HackTech2025/backend/splat.usdz"

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/splat")
async def splat(request: Request, background_tasks: BackgroundTasks):
    data = await request.json()
    images = data.get("images", [])
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")
    
    try:
        images = [base64_to_image(image) for image in images]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    background_tasks.add_task(construct_splat, images, SPLAT_PATH)
    return {"status": "ok"}


@app.get("/api/get-splat")
async def get_splat():
    if not os.path.exists(SPLAT_PATH):
        raise HTTPException(status_code=404, detail="Splat file not found")
    return FileResponse(SPLAT_PATH, media_type="model/vnd.usdz+zip", filename="splat.usdz")
