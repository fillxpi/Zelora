# Zelora

Aplicativo mobile de hábitos e metas com gamificação. A ideia é ir além de uma lista de tarefas: ligar hábitos a metas de longo prazo e mostrar a evolução do usuário de forma visual, com sequências diárias e recompensas.

> Projeto de portfólio em desenvolvimento.

## Ideias principais

- **Hábitos com recorrência flexível** (ex.: 3x por semana, a cada 2 dias)
- **Metas com marcos**, ligadas aos hábitos e com progresso calculado automaticamente
- **Sequências (streaks) com proteção de sequência**, para que um dia perdido não derrube todo o progresso
- **Progressão visual:** anel de progresso diário, mapa de calor de calendário, XP, níveis e um avatar que evolui
- **Insights:** estatísticas e revisão semanal
- **Offline-first** com sincronização

## Stack

| Camada | Tecnologia |
| --- | --- |
| Mobile | React Native, Expo, TypeScript |
| Backend (planejado) | Node.js, TypeScript, PostgreSQL, Prisma |
| Infra (planejado) | Docker, GitHub Actions |

## Estrutura do repositório

```
zelora/
├── mobile/    # app React Native (Expo)
└── backend/   # API Node.js (a ser criada)
```

## Como rodar o app

Pré-requisitos: Node.js (LTS), Git e o app Expo Go no celular.

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o Expo Go.

## Roadmap

- [ ] Setup do projeto e estrutura do repositório
- [ ] MVP: criar hábitos, marcar como feito, streak e anel de progresso diário
- [ ] Gamificação: XP, níveis, moedas e proteção de sequência
- [ ] Metas com marcos e vínculo com hábitos
- [ ] Recorrência flexível e dias de descanso
- [ ] Backend com autenticação e sincronização
- [ ] Dashboard: mapa de calor, gráficos e revisão semanal
- [ ] Notificações, assinaturas e anúncios (camada de monetização)

## Autor

Fillipi Lucio
