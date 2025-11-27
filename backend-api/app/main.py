from fastapi import FastAPI

app = FastAPI(title="ADN Forensics API")

@app.get("/")
async def root():
    return {"message": "Hello from backend-api"}
