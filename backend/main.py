from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, solve, course_upload, subscriptions
from .config import DEBUG

app = FastAPI(
    title="YouAskedAI API",
    description="API for YouAskedAI - AI-powered academic problem solver",
    version="1.0.0",
    debug=DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(solve.router, prefix="/api/solve", tags=["Problem Solving"])
app.include_router(course_upload.router, prefix="/api/courses", tags=["Course Materials"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to YouAskedAI API",
        "version": "1.0.0",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 