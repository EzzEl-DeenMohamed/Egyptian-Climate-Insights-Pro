from fastapi import APIRouter
# from app.services.auth import login

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
async def login_user(username: str, password: str):
    # return await login(username, password)
    return {}
