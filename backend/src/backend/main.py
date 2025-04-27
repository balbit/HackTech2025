import os
from typing import List

from fastapi import FastAPI, Request, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.responses import FileResponse
from src.backend.splatting.utils import construct_splat, base64_to_binary_text

app = FastAPI()

SPLAT_PATH = os.path.join(os.path.dirname(__file__), "splats", "splat.usdz")

@app.get("/health")
def health_check():
    return {"status": "ok"}

# Store connected WebSocket connections
connections: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connections.append(websocket)
    if len(connections) == 2:
        for i in range(2):
            await connections[i].send_text("Both connected")
    try:
        while True:
            data = await websocket.receive_text()
            for connection in connections:
                if connection != websocket:
                    await connection.send_text(data)
    except WebSocketDisconnect:
        connections.remove(websocket)



@app.post("/api/splat")
async def splat(request: Request, background_tasks: BackgroundTasks):
    # Delete the old splat file if it exists
    if os.path.exists(SPLAT_PATH):
        try:
            import time
            timestamp = int(time.time())
            new_path = f"{SPLAT_PATH}_{timestamp}"
            os.rename(SPLAT_PATH, new_path)
            print(f"Renamed existing splat file to {new_path}")
        except Exception as e:
            print(f"Error deleting existing splat file: {e}")

    data = await request.json()
    images = data.get("images", [])
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")
    
    try:
        images = [base64_to_binary_text(image) for image in images]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    background_tasks.add_task(construct_splat, images, SPLAT_PATH)

    return {"status": "ok"}


@app.get("/api/get-splat")
async def get_splat():
    if not os.path.exists(SPLAT_PATH):
        raise HTTPException(status_code=404, detail="Splat file not found")
    return FileResponse(SPLAT_PATH, media_type="model/vnd.usdz+zip", filename="splat.usdz")
