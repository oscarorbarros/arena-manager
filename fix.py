import os
p = r'src/app/referee/[id]/page.tsx'
with open(p, 'r', encoding='utf-8') as f: c = f.read()
c = c.replace('handlePause(" Fim do 1 + chr 186 +  Tempo\, ''half_time'');', 'updateMatchWithEvent(matchId, { status: \paused\, startTime: undefined, period: ''half_time'' }, { type: \end\, observation: \Fim do 1o Tempo\ });')
c = c.replace('handlePause(\Fim do 2 + chr 186 +  Tempo\, ''full_time'');', 'updateMatchWithEvent(matchId, { status: \paused\, startTime: undefined, period: ''full_time'' }, { type: \end\, observation: \Fim do 2o Tempo\ });')
with open(p, 'w', encoding='utf-8') as f: f.write(c)
