import csv
import os

times = [
    "Alta Floresta",
    "Barra do Garças",
    "Cáceres",
    "Campo Novo do Parecis",
    "Confresa",
    "Cuiabá - Octayde Jorge da Silva",
    "Cuiabá - Bela Vista",
    "Juína",
    "Pontes e Lacerda",
    "Primavera do Leste",
    "Rondonópolis",
    "São Vicente",
    "Sorriso",
    "Tangará da Serra",
    "Várzea Grande",
    "Campus Avançado de Lucas do Rio Verde",
    "Campus Avançado de Sinop",
    "Guarantã do Norte"
]

output_file = "c:\\Users\\ginho\\Documents\\GitHub\\arena-manager\\times_jogadores_ifmt.csv"

# Vamos criar um CSV com a seguinte estrutura:
# Time, Tipo, Nome do Integrante, Numero na Camisa (apenas para jogadores)

with open(output_file, mode='w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerow(["Time", "Funcao", "Nome", "Camisa"]) # Header
    
    for time in times:
        # 1 Chefe de Delegação
        writer.writerow([time, "Chefe de Delegação", f"Chefe - {time}", ""])
        # 12 Jogadores
        for i in range(1, 13):
            writer.writerow([time, "Jogador", f"Atleta {i} - {time}", str(i)])

print(f"CSV criado com sucesso: {output_file}")
