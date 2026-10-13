# Conecta V11 | Reformulação visual completa

A V11 muda a estrutura das páginas **Pedidos**, **Mensagens** e **Meu espaço**, mantendo a navegação e a integração Firebase da V9. Não é apenas uma troca de cores.

**Principais melhorias visuais:**

- Página de pedidos com hero verde, composição fotográfica, painel de filtros e categorias rápidas, cards horizontais mais trabalhados e bloco lateral de orientações.
- Mensagens com nova apresentação, caixa de entrada e estado inicial de conversa redesenhados, mantendo o chat privado existente.
- Meu espaço com formulário organizado em três etapas e **prévia dinâmica do perfil durante o preenchimento**.
- Modal de novo pedido com duas colunas no desktop, lateral editorial verde, campos em etapas e layout adaptado ao celular.
- Refinamentos adicionais nos componentes e no menu mobile, sem alterar os requisitos do Firebase.

**Importante:** O novo formulário de pedido continua usando o armazenamento local da versão anterior. Ele não publica pedidos para outros usuários. O botão agora diz **Salvar pedido**, com essa limitação indicada no modal. Os recursos de contas, perfis públicos e chat continuam dependendo da configuração de Firebase abaixo.

## Como publicar esta atualização no seu GitHub

1. Extraia o ZIP e entre na pasta `conecta-v11`.
2. Copie **todos os arquivos internos** para a raiz da pasta local já vinculada ao Git, ao lado da pasta `.git`. Preserve sua configuração existente em `firebase-config.js` se já tiver colocado dados do projeto Firebase, pois este pacote traz um arquivo de exemplo ainda vazio.
3. No CMD dentro da pasta local do repositório, execute:

```cmd
git status
git add .
git commit -m "Conecta V11 - Novo visual"
git push origin main
```

4. Aguarde o fluxo do GitHub Pages ficar verde em **Actions**, depois atualize o navegador com Ctrl + Shift + R.

## Base funcional preservada (Firebase V9)

Esta versão mantém o visual verde do Conecta e implementa uma base **real** de autenticação e mensagens com Firebase Authentication e Cloud Firestore. É HTML, CSS e JavaScript puro, sem build.

## Como funciona

| Ação | Visitante, sem conta | Conta com e-mail confirmado |
|---|---|---|
| Visualizar início e profissionais | Sim | Sim |
| Buscar por categoria e cidade | Sim | Sim |
| Abrir perfil profissional | Sim | Sim |
| Criar perfil profissional público | Não | Sim |
| Ver conversas e enviar mensagens | Não | Sim |
| Contato por WhatsApp, quando informado | Não, pede cadastro | Sim, após confirmar o e-mail |

No formulário de perfil, **WhatsApp é opcional**. Em um perfil real que não possui WhatsApp, o botão principal é **Enviar mensagem no Conecta**. Se houver WhatsApp, aparecem o botão do WhatsApp e uma opção de conversar pelo Conecta. **Ambos os contatos exigem conta com e-mail confirmado**, embora todo o catálogo seja público. Os números de WhatsApp ficam em documentos privados de `contacts` e são consultados somente após a confirmação do e-mail, em vez de serem expostos nos perfis públicos. Os **seis profissionais demonstrativos** são identificados e não recebem mensagens. As conversas reais são privadas entre seus dois participantes e sincronizadas em tempo real.

## Configurar o Firebase antes de lançar

**Sem estes passos, a interface pode ser navegada, mas cadastros online e mensagens reais permanecem bloqueados e uma explicação aparece ao clicar. Nenhum chat fictício é mostrado como conversa enviada.**

1. Acesse https://console.firebase.google.com e crie um projeto.
2. Em **Configurações do projeto > Seus aplicativos**, registre um aplicativo **Web (`</>`)**, copie os dados públicos `apiKey`, `authDomain`, `projectId` e `appId` e cole no arquivo `firebase-config.js`. Nunca coloque uma chave administrativa (service account) no front-end.
3. Vá a **Authentication > Sign-in method > Email/Password** e habilite esse provedor. Em **Templates** personalize opcionalmente o e-mail de verificação. Em **Settings > Authorized domains**, adicione `juangcosta.github.io` (sem `https://`, sem `/conecta/`). Para outros domínios, adicione-os também.
4. Vá em **Firestore Database > Create database** e crie o banco em **modo de produção**. Escolha a região considerando os usuários.
5. Em **Firestore > Rules**, substitua as regras iniciais pelo conteúdo **completo** do arquivo `firestore.rules` e clique em **Publish**. **Não** use regras abertas `allow read, write: if true`.
6. Suba os arquivos para o repositório GitHub e configure **Settings > Pages > main > /(root)**. O `index.html` precisa ficar na raiz do repositório. Aguarde a publicação.
7. Em dois navegadores (um deles em janela anônima), crie duas contas com e-mails diferentes e **confirme ambas as caixas de entrada**. Com a conta do prestador, publique seu perfil deixando WhatsApp em branco. Com a conta do cliente, busque o prestador, abra o perfil, clique em **Enviar mensagem no Conecta** e envie uma mensagem. Faça login na conta do prestador e responda em **Mensagens**.

As credenciais do Firebase Web nesse arquivo são dados de configuração que podem ser públicos, mas **a segurança depende das regras corretas** e de não expor chaves privadas. Para produção, teste as regras também no Rules Playground / Emulator Suite.

## Enviar atualizações pelo CMD

Dentro da pasta que contém `index.html`, após conectar ao repositório:

```cmd
git add .
git commit -m "Conecta V9 - login e mensagens"
git push origin main
```

**Importante:** se seu repositório já estiver clonado no PC, atualize a cópia existente, mantendo a pasta `.git` e colocando os novos arquivos na mesma raiz do projeto. Não execute `git init` novamente sem necessidade. Nunca use `git push --force` só para publicar.

## Arquivos novos

- `firebase-config.js`: configuração pública do seu projeto Firebase, inicialmente vazia.
- `firebase-backend.js`: operações Firebase de conta, verificação, perfis e chat em tempo real.
- `firestore.rules`: regras para perfis públicos editáveis apenas pelo dono verificado e conversas restritas aos participantes.
- `v9.js`: fluxo de login, cadastro, recuperar senha, bloqueio de ações e mensagens.
- `v9.css`: estilos responsivos das telas de login e de mensagens.

## O que realmente está na nuvem

**Depois de configurar o Firebase:** cadastro/login, confirmação de e-mail, recuperação de senha, perfis profissionais, contatos opcionais protegidos, listagem dos perfis públicos, conversas e mensagens entre cliente e prestador.

**Ainda são locais da V8:** pedidos de serviço, fotos do portfólio, favoritos, conteúdos exemplificativos e outras informações de demonstração. A publicação de pedidos só foi protegida por conta confirmada, mas pedidos e portfólios **ainda não são compartilhados no banco de dados**. Não represente esses módulos como sistemas colaborativos prontos. O backup do perfil local anterior fica em `localStorage` com a chave `conecta.v8-profile-backup`; ele **não é migrado automaticamente** para evitar publicar dados acidentalmente.

Esta versão não inclui moderação, denúncias, bloqueio de usuários, notificações push nem políticas de privacidade e retenção prontas para lançamento amplo. Recomendam-se esses itens antes de abrir cadastros ao público. As imagens de demonstração precisam ter autorização de uso antes da publicação comercial.

## Testes realizados

Verificação de sintaxe JavaScript, navegação e bloqueio sem Firebase em desktop e celular, login e fluxo de mensagens simulando as respostas do backend, além de formulário com publicação simulada. **O tráfego real Firebase entre duas contas só poderá ser testado após as configurações do seu próprio projeto.**
