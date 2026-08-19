# Checklist de publicação do aplicativo

Última revisão técnica: **5 de agosto de 2026**.

## Estado validado

- Expo Doctor 18/18;
- typecheck e 72 testes aprovados;
- exportação Android/Metro concluída com 1.840 módulos;
- nenhuma dependência circular nos 212 arquivos analisados;
- dependências nativas compatíveis e `@expo/vector-icons` deduplicado.

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

1. publique primeiro o backend aditivo e mantenha permissões do APK anterior;
2. teste o APK anterior contra o backend novo;
3. gere e instale o APK de produção em aparelhos físicos;
4. valide todos os fluxos abaixo;
5. disponibilize o arquivo/URL;
6. só então aumente a versão em `update-app`;
7. monitore falhas e retire permissões antigas numa entrega posterior.

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
- contatos, chamados e patrimônio;
- assistente desligada, local e fallback online, com métrica sem transcrição;
- monitoramento desligado: somente Maps/Waze;
- monitoramento ligado: prévia, início, segundo plano, perda de rede, retorno,
  finalização integral/parcial e sincronização;
- com Maps/Waze aberto, confirmar no Strapi que `POST /segmentos` continua
  chegando e que o marcador do painel muda sem reabrir o AppRotas;
- sem rede, confirmar que nenhum ponto é perdido e que os lotes aparecem após
  a reconexão;
- histórico contém somente o usuário autenticado;
- localização negada/desligada abre configurações;
- atualização obrigatória baixa e instala o artefato correto.

O endpoint `/api/chamados` precisa existir no ambiente, embora seu schema não
esteja versionado no repositório Strapi atual. Consulte a matriz completa no
projeto backend antes da liberação.
