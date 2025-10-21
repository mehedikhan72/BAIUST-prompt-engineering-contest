from fastapi import APIRouter, HTTPException, Request
from api import services

from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

@router.get("/available-models")
@limiter.limit("5/minute")
async def get_available_models(request: Request):
    try:
        response = await services.get_available_models()
        return {"models": response}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-prompt/")
@limiter.limit("5/minute")
async def process_prompt_endpoint(prompt: str, level: str, request: Request):
    try:
        result = await services.process_prompt(prompt, level)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.post("/process-guess/")
@limiter.limit("5/minute")
async def process_guess_endpoint(guess: str, level: str, request: Request):
    try:
        is_correct = await services.process_guess(guess, level)
        return {"correct": is_correct}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))