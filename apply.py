import os
p = r'src/app/referee/[id]/page.tsx'
c = open(p, 'r', encoding='utf-8').read()
c = c.replace('handlePause(" Fim do 1º Tempo\, ''half_time'');', 'updateMatchWithEvent(matchId, { status: \paused\, startTime: undefined, period: ''half_time'' }, { type: \end\, observation: \Fim do 1º Tempo\ });')
open(p, 'w', encoding='utf-8').write(c)
