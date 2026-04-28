from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from peft import PeftModel
import torch

app = FastAPI()

# -------- LOAD MODEL --------
BASE_MODEL = "google/flan-t5-base"
ADAPTER_PATH = "model"

print("Loading tokenizer...")
tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL)

print("Loading base model...")
base_model = AutoModelForSeq2SeqLM.from_pretrained(BASE_MODEL)

print("Loading adapter...")
model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

print("Model ready!")

# -------- REQUEST FORMAT --------
class Query(BaseModel):
    message: str

# -------- CHAT API --------
@app.post("/chat")
async def chat(query: Query):
    user_input = query.message.strip()

    prompt = f"""
You are an expert agricultural scientist.

A farmer says:
"{user_input}"

Give:
- Clear explanation
- Reasons
- Practical advice

Respond in this format:

Possible Causes:
Explanation:
Recommended Treatment:
Prevention:
"""

    inputs = tokenizer(
        prompt,
        return_tensors="pt",
        max_length=512,
        truncation=True
    ).to(device)

    outputs = model.generate(
        **inputs,
        max_length=400,
        temperature=0.7,
        top_p=0.9,
        do_sample=True
    )

    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return {"reply": response}