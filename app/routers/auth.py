from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.user import UserRegister, UserLogin, Token, UserResponse
from app.services.auth import hash_password, verify_password, create_access_token, get_current_user
from app.db.database import create_user as db_create_user, get_user_by_username as db_get_user_by_username, get_user_by_email as db_get_user_by_email
from app.db.postgres import create_user_async as pg_create_user, get_user_by_username_async as pg_get_user_by_username, get_user_by_email_async as pg_get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])


def get_user_db_operations():
    from app.main import app
    if getattr(app.state, "use_postgres", False):
        return {
            "create_user": pg_create_user,
            "get_user_by_username": pg_get_user_by_username,
            "get_user_by_email": pg_get_user_by_email,
        }
    return {
        "create_user": db_create_user,
        "get_user_by_username": db_get_user_by_username,
        "get_user_by_email": db_get_user_by_email,
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    db_ops = get_user_db_operations()

    existing_user = db_ops["get_user_by_username"](user_data.username)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")

    existing_email = db_ops["get_user_by_email"](user_data.email)
    if existing_email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_pw = hash_password(user_data.password)
    new_user = db_ops["create_user"](user_data.username, user_data.email, hashed_pw)

    return UserResponse(id=new_user["id"], username=new_user["username"], email=new_user["email"])


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    db_ops = get_user_db_operations()

    user = db_ops["get_user_by_username"](form_data.username)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    if not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    access_token = create_access_token(data={"sub": user["username"]})

    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(id=current_user["id"], username=current_user["username"], email=current_user["email"])