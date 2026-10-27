# Testes das regras do Firestore

Estes testes simulam usuários (visitante, cliente, profissional, alguém sem relação) tentando ler e gravar dados, e conferem se o `firestore.rules` permite ou bloqueia cada ação. Tudo roda no **emulador local**, com o projeto falso `demo-conecta`: o Firebase real não é acessado.

## Pré-requisitos

- Node.js
- Java 21 ou mais novo (o emulador não aceita versões anteriores)
- Firebase CLI: `npm install -g firebase-tools`

## Como rodar

Dentro desta pasta:

```cmd
npm install
npm test
```

O resultado lista cada teste com ✔ (passou) ou ✖ (falhou). Testes marcados como **todo** são lacunas conhecidas: aparecem no relatório, mas não reprovam o conjunto.

## Problema conhecido no Windows

Se o emulador fechar com `Unable to establish loopback connection`, o caminho da pasta temporária tem acento (por exemplo, `Usuário`). Antes de `npm test`, aponte o Java para uma pasta sem acento:

```cmd
set JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:\temp -Djava.io.tmpdir=C:\temp
```

(A pasta `C:\temp` precisa existir.)

## Ao mudar o `firestore.rules`

Rode os testes antes de publicar as regras no Firebase. Se uma regra nova bloquear algo que deveria funcionar, um teste de "caso normal" (por exemplo, "cliente inicia uma conversa normal") vai falhar.
