import os, threading
from typing import Iterator
import torch
import gradio as gr
import spaces
from transformers import AutoModelForCausalLM, AutoTokenizer, TextIteratorStreamer

MODEL_ID = os.getenv("MODEL_ID", "Qwen/Qwen3-Coder-30B-A3B-Instruct")
SYSTEM = os.getenv(
    "SYSTEM_PROMPT",
    "You are Cyber AI, a single expert assistant. Answer accurately, write production-quality code, and when reviewing code identify and fix syntax, logic, security, and reliability problems. Respond in the user's language.",
)

print(f"Loading {MODEL_ID} in 4-bit mode...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_ID, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_ID,
    device_map="auto",
    torch_dtype=torch.bfloat16,
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
    trust_remote_code=True,
)
model.eval()


def build_prompt(prompt: str, context: str):
    context = (context or "").strip()
    user = prompt.strip()
    if context:
        user = f"Conversation context:\n{context}\n\nCurrent request:\n{user}"
    return [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": user},
    ]


@spaces.GPU(duration=180)
def respond(prompt: str, context: str) -> Iterator[str]:
    if not prompt or not prompt.strip():
        yield "اكتب طلبك أولًا."
        return
    messages = build_prompt(prompt, context)
    inputs = tokenizer.apply_chat_template(
        messages, add_generation_prompt=True, tokenize=True, return_tensors="pt"
    ).to(model.device)
    streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
    kwargs = dict(
        input_ids=inputs,
        streamer=streamer,
        max_new_tokens=4096,
        do_sample=True,
        temperature=0.2,
        top_p=0.8,
        top_k=20,
        repetition_penalty=1.05,
        use_cache=True,
    )
    thread = threading.Thread(target=model.generate, kwargs=kwargs)
    thread.start()
    text = ""
    for piece in streamer:
        text += piece
        yield text
    thread.join()


with gr.Blocks(title="Cyber AI Free Demo") as demo:
    gr.Markdown("# Cyber AI — Free Demo\nQwen3-Coder-30B-A3B-Instruct running on Hugging Face ZeroGPU.")
    prompt = gr.Textbox(label="Prompt", lines=5, placeholder="اكتب طلبك...")
    context = gr.Textbox(label="Conversation context", lines=8, placeholder="اختياري: سجل المحادثة السابق")
    output = gr.Textbox(label="Cyber AI", lines=20)
    submit = gr.Button("Run Cyber AI")
    submit.click(respond, inputs=[prompt, context], outputs=output, api_name="respond")

if __name__ == "__main__":
    demo.queue().launch()
