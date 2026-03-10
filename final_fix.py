import os  
p_match = r'src/app/match/[id]/page.tsx'  
p_ref = r'src/app/referee/[id]/page.tsx'  
def fix():  
    if os.path.exists(p_match):  
        c = open(p_match, 'r', encoding='utf-8').read()  
        c = c.replace('isLive ? \" "text-black\', 'isLive ? \text-[#fef3c7]\')  
        c = c.replace('text-red-500 animate-pulse', 'text-[#fef3c7] animate-pulse')  
        c = c.replace('Prorrogacao', 'PRORROGACAO')  
        open(p_match, 'w', encoding='utf-8').write(c)  
    if os.path.exists(p_ref):  
        c = open(p_ref, 'r', encoding='utf-8').read()  
        c = c.replace('extra_second', 'extra_second_marker')  
        open(p_ref, 'w', encoding='utf-8').write(c)  
fix()  
