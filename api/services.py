from fastapi import HTTPException
import asyncio

from api.utils import player_in_correct_level, system_prompts_per_level, secrets
from api.openai import client, GPT_MODEL
from api.guardrails import topical_guardrail, moderation_guardrail

import re

async def get_available_models():
    response = client.models.list()
    return response

async def get_llm_response(prompt: str, level: str) -> str:
    print("Getting LLM response")
    system_prompt = system_prompts_per_level.get(level.upper())
    if not system_prompt:
        raise HTTPException(status_code=400, detail="Invalid level")

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt},
    ]

    response = client.chat.completions.create(
        model=GPT_MODEL, messages=messages, temperature=0.5
    )

    print("Got LLM response")
    return response.choices[0].message.content

async def process_prompt(prompt: str, level: str):
    # TODO
    if not await player_in_correct_level(level, "uid-of-the-player-who-made-the-request"):
        return {"error": "You already passed or did not reach this level yet."}
    
    # TODO: Semantic cache(?)
    topical_guardrail_task = asyncio.create_task(topical_guardrail(prompt))
    llm_response_task = asyncio.create_task(get_llm_response(prompt, level))

    while True:
        done, _ = await asyncio.wait(
            [topical_guardrail_task, llm_response_task], return_when=asyncio.FIRST_COMPLETED
        )
        if topical_guardrail_task in done:
            guardrail_result = topical_guardrail_task.result()
            if "not_allowed" in guardrail_result.lower():
                llm_response_task.cancel()
                print("Prompt blocked by topical guardrail")
                return {"error": "Your prompt is not relevant to the game."}
            elif llm_response_task in done:
                llm_response = llm_response_task.result()
                current_secret = secrets.get(level)

                # Moderation guardrail to filter out secret/password if revealed
                if level.lower() in ["two", "three", "four", "five"] and re.search(re.escape(current_secret), llm_response, re.IGNORECASE):
                    llm_response = await moderation_guardrail(llm_response)
                return {"response": llm_response}
            
        else:
            await asyncio.sleep(0.2)

async def process_guess(guess: str, level: str, player_uid: str):
    # Make sure user is in the correct level
    if not await player_in_correct_level(level, player_uid):
        return {"error": "You already passed or did not reach this level yet."}

    level = level.upper()
    if level not in secrets:
        raise HTTPException(status_code=400, detail="Invalid level")
    
    return guess.strip().lower() == secrets[level].strip().lower()