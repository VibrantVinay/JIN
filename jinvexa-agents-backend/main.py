# main.py (Your Python Agent Backend)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# Your OpenRouter or Cloud API Key for Gemma
GEMMA_API_KEY = os.getenv("OPENROUTER_API_KEY")

class GoalRequest(BaseModel):
    goal: str
    model: str = "google/gemma-4-31b-it:free"

# 1. Import your existing Python agents here
# from my_agents import search_agent, compile_agent

@app.post("/api/agents/generate-course")
async def generate_course(req: GoalRequest):
    try:
        # Step 1: Run your custom Python Agents to gather data
        # agent_data = search_agent.run(req.goal)
        
        # Step 2: Use Gemma 31B as the "Main Brain" Orchestrator
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GEMMA_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": req.model,
                "messages": [
                    {"role": "system", "content": "You are the Jinvexa Main Brain. Formulate a curriculum."},
                    {"role": "user", "content": f"Use this agent data to build a course for: {req.goal}"}
                ]
            }
        )
        
        gemma_data = response.json()
        
        # Step 3: Return the final structured data back to Next.js
        return {"roadmap": gemma_data["choices"][0]["message"]["content"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run with: uvicorn main:app --reload --port 8000
