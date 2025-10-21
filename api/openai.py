from openai import OpenAI
from fastapi import HTTPException
from dotenv import load_dotenv
import os

load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise HTTPException(status_code=500, detail="Missing OpenAI API key")

client = OpenAI(api_key=openai_api_key)
GPT_MODEL = "gpt-4o-mini"