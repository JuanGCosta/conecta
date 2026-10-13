# Conecta | Redesign inspirado nas duas referências

Nova versão visual da plataforma Conecta, inteiramente feita com **HTML, CSS e JavaScript**, sem precisar instalar dependências ou executar build.

## Como abrir

Abra `index.html` no navegador. Para publicar no Netlify, Vercel ou Firebase Hosting, envie todo o conteúdo desta pasta, inclusive a pasta `assets`.

## Identidade visual

- **Início:** cabeçalho integrado ao hero verde escuro, fotos de pessoas em painéis verticais, elementos flutuantes, busca de serviços, dados derivados do catálogo e serviços em faixa horizontal.
- **Profissionais:** moldura verde com padrão geométrico, barra verde clara, filtros laterais, campo de pesquisa, ordenação e cards horizontais com fotos.
- **Responsividade:** adaptações próprias para desktop, tablet e celular.
- **Outras telas:** pedidos, perfil, portfólio, modais, detalhes profissionais e contato continuam disponíveis.

## Funcionalidades verificadas

Busca por serviço e nome, filtro de cidade, categorias, ordenação, favoritos, listagem de salvos, abertura do perfil, publicação de pedidos, edição do próprio perfil e gerenciamento de portfólio. Todas as alterações de interface executam as mesmas rotinas funcionais da versão de entrada.

## Fotos

O projeto já vem com imagens locais de fallback, retiradas do material de referência fornecido, para que o visual não fique sem fotos em testes sem internet. Quando possível, o navegador tenta carregar fotos externas de alta resolução para a interface. **Antes de publicar comercialmente, substitua as imagens demonstrativas por fotografias que você tenha autorização para usar.**

## Limites da demonstração

Os seis perfis e três pedidos iniciais são **exemplos fictícios**, identificados no site. O cadastro, os pedidos, as fotos, favoritos e o portfólio do próprio usuário ficam no `localStorage` desse navegador. Ainda não há sincronização de dados em nuvem, autenticação ou banco de dados multiusuário. A integração real entre clientes e profissionais exigirá um backend.

## Arquivos principais

- `index.html`: páginas e componentes.
- `app.js`: buscas, filtros, roteamento e demais interações.
- `style.css`, `premium.css` e `reference.css`: estilos (o último implementa este redesign).
- `assets/`: fallback de imagens.

## Testes

A versão foi verificada no Chromium em telas de 1440px, 800px e 390px, sem rolagem horizontal ou erros de JavaScript. Também foram testados a pesquisa do início, categorias, busca por cidade, ordenação, favoritos, detalhes de perfil, pedidos, modais e Meu espaço.
