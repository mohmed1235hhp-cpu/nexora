---
title: Cyber AI Free Demo
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: gradio
sdk_version: 6.0.0
app_file: app.py
pinned: false
hardware: zero-gpu
---

# Cyber AI Free Demo

Free demo inference Space for the Cyber AI project.

The Qwen inference function is explicitly scheduled on ZeroGPU with `@spaces.GPU`, so the model is actually executed on the shared GPU rather than silently falling back to CPU. It uses the open-weight
Qwen3-Coder-30B-A3B-Instruct model in 4-bit mode. The model is Apache-2.0.

ZeroGPU is shared infrastructure with daily limits, so this is for demos and
testing, not production hosting.
