from pathlib import Path
import ast
p=Path(__file__).with_name("app.py")
ast.parse(p.read_text())
print("Qwen Space Python syntax: OK")
