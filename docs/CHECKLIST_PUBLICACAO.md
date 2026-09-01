# Checklist de publicação do aplicativo

## Critérios de validação

- Expo Doctor sem bloqueios relevantes para a versão fixada;
- `yarn typecheck` e `yarn test:all` aprovados no commit da publicação;
- exportação Android/Metro e build EAS concluídos no perfil correto;
- dependências nativas e identidade do aplicativo revisadas;
- diferenças do lockfile e auditoria de dependências avaliadas.

Isso ainda não substitui teste no APK. GPS em segundo plano, Maps, voz, câmera
e atualização só podem ser homologados no artefato nativo instalado.

## Ambiente e identidade

- Node `>=20.19.4` local e fixado nos perfis EAS;
- confirmar se `com.ronaldo2024.SuporteDrogal` será mantido;
- decidir se o projeto EAS continuará em conta pessoal ou será transferido;
- em `production`, configurar `GOOGLE_MAPS_API_KEY` e
  `EXPO_PUBLIC_STRAPI_URL=https://rotas.drogal.com.br/api`;
- `ALLOW_CLEARTEXT_TRAFFIC=false` ou ausente em produção;
- restringir a chave Maps pelo package e SHA da assinatura.

No papel `Authenticated`, confirme também as ações que sustentam os fluxos
novos sem expor CRUD genérico:

- `Sessao-dispositivo > iniciar, validar, encerrar, registrarLocalizacao`;
- `Execucao-rota > iniciar, adicionarSegmento, registrarTelemetria, finalizar`;
- `Painel-admin > resumoRotas, trajetoRota, localizacoesColaboradores,
  listarUsuarios, redefinirSenha`;
- `Assistente-ia > conversar` e
  `Metrica-assistente > registrar`, conforme as flags habilitadas.

## Validação

```bash
yarn install --frozen-lockfile
yarn typecheck
yarn test:all
npx expo-doctor@latest .
```

Builds:

```bash
# APK de homologação interna
yarn build-android:preview

# APK instalável com ambiente de produção
yarn build-android:production-apk

# AAB para loja
yarn build-android:store
```

## Ordem do rollout

1. faça backup do banco e dos uploads;
2. publique o backend e habilite somente as ações customizadas da matriz atual;
3. remova do Strapi o menu técnico `Chamados`, caso ainda esteja cadastrado;
4. gere e instale o APK de produção em aparelhos físicos;
5. valide todos os fluxos abaixo;
6. disponibilize o arquivo/URL;
7. só então aumente a versão em `update-app` e monitore falhas.

## Smoke test do APK

- login, senha inválida, expiração e troca de usuário;
- sessão única desligada registra dois aparelhos sem bloquear;
- sessão única ligada mantém o login mais recente e encerra o anterior;
- aparelho anterior offline abre com o cache e é encerrado ao recuperar rede;
- reabertura offline com sessão válida, troca concluída e filiais em cache;
- reabertura offline com `deveAlterarSenha=true` permanece bloqueada;
- troca obrigatória, edição de e-mail/senha e audit log;
- menus por papel e tema claro/escuro entre telas;
- filiais online e cache offline exclusivo da montagem de rotas;
- mapa, métricas, filtros, clusters e pontos sobrepostos;
- painel administrativo: entrada dos módulos, escopo, filtros, paginação,
  detalhes e mapa real/planejado;
- rollout administrativo: `painelAdminGestoresAtivo=false` oculta e bloqueia o
  gestor, enquanto ADMIN permanece autorizado;
- redefinição administrativa: com a flag ativa, ADMIN em todos os setores,
  GESTOR somente no próprio setor, bloqueio sobre ADMIN, audit-log e gate do
  titular;
- contatos e patrimônio;
- assistente desligada, árvore local e orquestrador determinístico;
- com Gemini desligado, confirmar que o pré-roteador e as ferramentas V2 ainda
  respondem; com ele ligado, validar plano rejeitado, esclarecimento e fallback;
- continuidade por usuário/sessão, ambiguidade de nomes, ajuda versionada,
  diagnóstico/comparações/ranking e revalidação de escopo;
- métrica de desfecho e eventos de adoção sem transcrição, prompt ou resposta;
- monitoramento desligado: somente Maps/Waze;
- monitoramento ligado: prévia, início, segundo plano, perda de rede, retorno,
  finalização integral/parcial e sincronização;
- com Maps/Waze aberto, confirmar no Strapi que `POST /segmentos` continua
  chegando e que o marcador do painel muda sem reabrir o AppRotas;
- confirmar que a telemetria operacional aparece no detalhe, que evento antigo
  não substitui estado novo e que falha nesse POST não bloqueia os segmentos;
- no mapa geral, validar flag desligada/ligada, ausência de marcador para origem
  apenas planejada, atualização periódica e abertura do trajeto parcial;
- sem rede, confirmar que nenhum ponto é perdido e que os lotes aparecem após
  a reconexão;
- histórico contém somente o usuário autenticado;
- localização negada/desligada abre configurações;
- atualização obrigatória baixa e instala o artefato correto.
