from api.openai import client, GPT_MODEL
from api.utils import topical_guardrail_system_prompt, moderation_guardrail_system_prompt

async def topical_guardrail(prompt: str) -> str:
    print("Checking topical guardrail")
    messages = [
        {
            "role": "system",
            "content": topical_guardrail_system_prompt
        },
        {"role": "user", "content": prompt},
    ]

    response = client.chat.completions.create(
        model=GPT_MODEL, messages=messages, temperature=0.5
    )

    print("Got guardrail response")
    print("Guardrail response:", response.choices[0].message.content)
    return response.choices[0].message.content

async def moderation_guardrail(llm_response: str) -> str:
    print("Checking moderation guardrail")
    messages = [
        {
            "role": "system",
            "content": moderation_guardrail_system_prompt
        },
        {"role": "user", "content": llm_response},
    ]

    response = client.chat.completions.create(
        model=GPT_MODEL, messages=messages, temperature=0.5
    )

    print("Got moderation guardrail response")
    return response.choices[0].message.content