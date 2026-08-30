# Fila Única Creche — protótipo da jornada da família

Protótipo navegável de uma nova jornada de inscrição em creche para a rede municipal
do Rio de Janeiro, construído para o desafio **"Inteligência na Fila da Creche"**.

Este módulo cobre o **lado da família** — inscrição, recomendação de unidades,
comprovações, convocação e consulta. Ele é complementar ao app `creche-inteligente/`
deste mesmo repositório, que cobre o **lado da secretaria** (planejamento de vagas,
dashboard, mapa e gestão das convocações). Os dois se encontram na convocação: o que
aqui é "vaga ofertada com prazo correndo" é, lá, a fila que o diretor precisa chamar.

> **Isto não é o portal matricula.rio.** É uma simulação. Unidades, vagas, filas,
> pontuações e validações são fictícias. Nenhum dado sai do navegador — tudo fica em
> `localStorage`. A página exibe uma faixa permanente indicando que é um protótipo;
> ela não deve ser removida, porque a interface reproduz a identidade visual de um
> portal público e pede CPF, endereço e telefone.

## Como abrir

Arquivo único, sem build e sem dependências. Basta abrir no navegador:

```bash
start prototipo-jornada-familia/inscricao-creche-prototipo.html
```

## O que o protótipo demonstra

| Problema atual | O que a jornada propõe |
| --- | --- |
| Escolhas de unidade inviáveis para a rotina da família | Até 3 endereços de referência (residência, trabalho, estudo, rede de apoio, escola de irmão), cada um com um grau de prioridade exclusivo — alta, média ou baixa |
| A mesma criança ocupando até 5 filas | Fila única por criança; as preferências definem para onde a vaga é oferecida, não em quantas filas ela entra |
| Conferência manual de documentos na unidade | Consulta automática às bases da assistência social + leitura de documentos com revisão humana abaixo de 80% de confiança |
| Convocação perdida por contato desatualizado | Índice de alcance do contato, com @ do WhatsApp (sobrevive à troca de número), segundo responsável e canais redundantes |
| Família sem visibilidade do processo | Consulta por protocolo + CPF, com situação, resultado por unidade, pontuação aberta e resposta à convocação |

### Fluxo

1. **Landing** — no visual do portal, com acesso à inscrição, consulta e FAQ.
2. **A criança** — etapa calculada pela idade em 31/03/2026; CPF validado por dígito verificador.
3. **Endereços de referência** — distância real (Haversine) com decaimento exponencial, ponderada por grau de prioridade e frequência semanal.
4. **Unidades recomendadas** — 3 recomendações explicadas, com caminho de exceção justificada que não retira a criança da fila.
5. **Comprovações** — critérios com fonte registrada (base pública, documento ou declaração) e pontuação aberta linha a linha.
6. **Contato** — canais redundantes e índice de alcance.
7. **Revisão e protocolo** — pontuação detalhada, posição estimada e recibo.
8. **Consulta** — fases do processo, convocação com prazo, aceite e recusa auditável.

## Decisões de projeto que valem registro

- **Grau de prioridade das referências não vale ponto.** Ele orienta apenas a
  recomendação geográfica. A pontuação vem só dos critérios legais de vulnerabilidade.
- **O @ do WhatsApp também não vale ponto.** Pontuar um canal de contato daria
  vantagem a quem tem aparelho melhor, inverteria o objetivo da fila e não
  sobreviveria à auditoria. Ele alimenta o índice de alcance, que governa *como* a
  convocação é entregue — não a posição.
- **Educação especial restrita à faixa de 0 a 3 anos e 11 meses.** TEA e deficiência
  intelectual não entram como itens próprios porque não há diagnóstico fechado
  confiável antes dos 4 anos; os casos entram por "atraso global do desenvolvimento".
  Laudo fechado não é exigido.
- **Recusar uma vaga não reordena as preferências.** A recusa é registrada na unidade
  e a oferta passa à preferência seguinte, preservando o que a família declarou.

## Modo teste

O botão **Modo teste** libera a navegação sem campos obrigatórios e abre todas as
etapas. Junto dele, **Preencher exemplo** carrega um caso completo, e a consulta ganha
um seletor de fase para demonstrar convocação, aceite e recusa. **Editar textos**
permite ajustar rótulos e títulos direto na página.

## Limitações conhecidas

- Rede de 20 unidades fictícias com coordenadas aproximadas de bairro.
- A tabela de pontuação é ilustrativa e não reproduz o edital vigente.
- A leitura de documentos é simulada (confiança derivada do nome do arquivo).
- O brasão e as marcas são reproduções aproximadas, apenas para avaliar o desenho.
