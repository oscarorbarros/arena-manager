# -*- coding: utf-8 -*-
import os
path = "src/lib/context.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()
t_load = 'const loadFromStorage = () => {'
r_load = 'const loadFromStorage = () => {\n        console.log("?? Context: Executando loadFromStorage...");'
content = content.replace(t_load, r_load)
t_event = 'const handleStorage = (e: StorageEvent) => {'
r_event = 'const handleStorage = (e: StorageEvent) => {\n        console.log("?? Context: Evento de storage detectado:", e.key);'
content = content.replace(t_event, r_event)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
