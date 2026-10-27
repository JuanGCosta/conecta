// Testes das regras do Firestore (firestore.rules) no emulador local.
// Cada teste simula um usuário tentando ler ou gravar algo e confere se a
// regra permite (assertSucceeds) ou bloqueia (assertFails). Nada aqui acessa
// o Firebase real: o projeto "demo-conecta" só existe dentro do emulador.
import { readFileSync } from 'node:fs';
import { test, describe, before, beforeEach, after } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, collectionGroup, query, where, writeBatch,
  serverTimestamp, Timestamp, deleteField, setLogLevel
} from 'firebase/firestore';

setLogLevel('error');

const CIDADE = 'São José dos Campos';
const antigo = () => Timestamp.fromMillis(Date.now() - 60_000);

// Personagens dos testes: um profissional, uma cliente e alguém sem relação.
const conta = (uid, name, extra = {}) => ({ uid, token: { email_verified: true, name, email: `${uid}@teste.com`, ...extra } });
const PROF = conta('prof', 'Paulo Pintor');
const CLI = conta('cli', 'Clara');
const ESTRANHO = conta('estranho', 'Eduardo');

let env;
const db = pessoa => env.authenticatedContext(pessoa.uid, pessoa.token).firestore();
const visitante = () => env.unauthenticatedContext().firestore();
const semera = async fn => env.withSecurityRulesDisabled(ctx => fn(ctx.firestore()));

async function criarConversa(status, extra = {}) {
  await semera(d => setDoc(doc(d, 'chats', 'cli_prof'), {
    customerId: 'cli', providerId: 'prof', participants: ['cli', 'prof'],
    customerName: 'Clara', providerName: 'Paulo Pintor',
    lastMessage: 'Olá', lastSenderId: 'cli', createdAt: antigo(), updatedAt: antigo(),
    status, pendingCount: 1, ...extra
  }));
}

const avaliacao = (extra = {}) => ({
  authorUid: 'cli', authorName: 'Clara', rating: 5, comment: 'Ótimo serviço', updatedAt: serverTimestamp(), ...extra
});

const pedido = (extra = {}) => ({
  ownerUid: 'cli', owner: 'Clara', title: 'Pintar a sala', category: 'Pintura', city: CIDADE,
  description: 'Preciso pintar uma sala de 12 m2.', photos: [], status: 'open',
  createdAt: serverTimestamp(), updatedAt: serverTimestamp(), ...extra
});

const perfil = (uid, name) => ({
  ownerUid: uid, name, category: 'Pintura', city: CIDADE, neighborhood: '', hasWhatsapp: false,
  bio: '', photo: '', updatedAt: serverTimestamp()
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-conecta',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') }
  });
});
after(async () => { await env?.cleanup(); });
beforeEach(async () => {
  await env.clearFirestore();
  await semera(async d => {
    await setDoc(doc(d, 'profiles', 'prof'), { ...perfil('prof', 'Paulo Pintor'), hasWhatsapp: true, updatedAt: antigo() });
    await setDoc(doc(d, 'contacts', 'prof'), { ownerUid: 'prof', phone: '12999990000', updatedAt: antigo() });
  });
});

describe('Telefones (WhatsApp) dos profissionais', () => {
  test('visitante sem login não lê o telefone', async () => {
    await assertFails(getDoc(doc(visitante(), 'contacts', 'prof')));
  });
  test('conta sem conversa com o profissional não lê o telefone', async () => {
    await assertFails(getDoc(doc(db(ESTRANHO), 'contacts', 'prof')));
  });
  test('cliente com conversa ainda pendente não lê o telefone', async () => {
    await criarConversa('pending');
    await assertFails(getDoc(doc(db(CLI), 'contacts', 'prof')));
  });
  test('cliente com conversa aceita lê o telefone', async () => {
    await criarConversa('accepted');
    await assertSucceeds(getDoc(doc(db(CLI), 'contacts', 'prof')));
  });
  test('cliente bloqueada não lê mais o telefone', async () => {
    await criarConversa('blocked', { blockerId: 'prof' });
    await assertFails(getDoc(doc(db(CLI), 'contacts', 'prof')));
  });
  test('ninguém consegue listar todos os telefones', async () => {
    await criarConversa('accepted');
    await assertFails(getDocs(collection(db(CLI), 'contacts')));
  });
  test('o dono lê o próprio telefone', async () => {
    await assertSucceeds(getDoc(doc(db(PROF), 'contacts', 'prof')));
  });
});

describe('Avaliações', () => {
  const avaliar = (pessoa, dados) => setDoc(doc(db(pessoa), 'profiles', 'prof', 'reviews', pessoa.uid), dados);

  test('sem conversa com o profissional não avalia', async () => {
    await assertFails(avaliar(CLI, avaliacao()));
  });
  test('com conversa pendente não avalia', async () => {
    await criarConversa('pending');
    await assertFails(avaliar(CLI, avaliacao()));
  });
  test('com conversa aceita avalia', async () => {
    await criarConversa('accepted');
    await assertSucceeds(avaliar(CLI, avaliacao()));
  });
  test('não dá para assinar a avaliação com outro nome', async () => {
    await criarConversa('accepted');
    await assertFails(avaliar(CLI, avaliacao({ authorName: 'Suporte Conecta' })));
  });
  test('com conversa bloqueada não avalia', async () => {
    await criarConversa('blocked', { blockerId: 'prof' });
    await assertFails(avaliar(CLI, avaliacao()));
  });
  test('conta sem e-mail confirmado não avalia', async () => {
    await criarConversa('accepted');
    await assertFails(avaliar(conta('cli', 'Clara', { email_verified: false }), avaliacao()));
  });
  test('o profissional não avalia a si mesmo', async () => {
    await assertFails(setDoc(doc(db(PROF), 'profiles', 'prof', 'reviews', 'prof'), avaliacao({ authorUid: 'prof', authorName: 'Paulo Pintor' })));
  });
});

describe('Conversas e mensagens', () => {
  function iniciarConversa(pessoa, extra = {}) {
    const d = db(pessoa);
    const texto = 'Olá, preciso pintar a sala.';
    const lote = writeBatch(d);
    lote.set(doc(d, 'chats', 'cli_prof'), {
      customerId: 'cli', providerId: 'prof', participants: ['cli', 'prof'],
      customerName: 'Clara', providerName: 'Paulo Pintor',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), status: 'pending', pendingCount: 1,
      lastMessage: texto, lastSenderId: 'cli', ...extra
    });
    lote.set(doc(d, 'chats', 'cli_prof', 'messages', 'intro'), { senderId: 'cli', text: texto, createdAt: serverTimestamp() });
    return lote.commit();
  }

  test('cliente inicia uma conversa normal', async () => {
    await assertSucceeds(iniciarConversa(CLI));
  });
  test('não dá para iniciar conversa com nome de cliente falso', async () => {
    await assertFails(iniciarConversa(CLI, { customerName: 'Suporte Conecta' }));
  });
  test('não dá para iniciar conversa com nome de profissional falso', async () => {
    await assertFails(iniciarConversa(CLI, { providerName: 'Outro Nome' }));
  });
  test('quem não participa não lê a conversa', async () => {
    await criarConversa('accepted');
    await assertFails(getDoc(doc(db(ESTRANHO), 'chats', 'cli_prof')));
  });
  test('quem não participa não lê as mensagens', async () => {
    await criarConversa('accepted');
    await semera(d => setDoc(doc(d, 'chats', 'cli_prof', 'messages', 'intro'), { senderId: 'cli', text: 'Olá', createdAt: antigo() }));
    await assertFails(getDocs(collection(db(ESTRANHO), 'chats', 'cli_prof', 'messages')));
  });
  test('participante bloqueia uma conversa aceita', async () => {
    await criarConversa('accepted');
    await assertSucceeds(updateDoc(doc(db(PROF), 'chats', 'cli_prof'), { status: 'blocked', blockerId: 'prof', updatedAt: serverTimestamp() }));
  });
  test('quem foi bloqueado não consegue desbloquear', async () => {
    await criarConversa('blocked', { blockerId: 'prof' });
    await assertFails(updateDoc(doc(db(CLI), 'chats', 'cli_prof'), { status: 'accepted', blockerId: deleteField(), updatedAt: serverTimestamp() }));
  });
  test('não dá para mandar mensagem numa conversa bloqueada', async () => {
    await criarConversa('blocked', { blockerId: 'prof' });
    const d = db(CLI);
    const lote = writeBatch(d);
    lote.update(doc(d, 'chats', 'cli_prof'), { lastMessage: 'Oi?', lastSenderId: 'cli', updatedAt: serverTimestamp() });
    lote.set(doc(collection(d, 'chats', 'cli_prof', 'messages')), { senderId: 'cli', text: 'Oi?', createdAt: serverTimestamp() });
    await assertFails(lote.commit());
  });
  test('cliente não passa do limite de 3 mensagens antes do aceite', async () => {
    await criarConversa('pending', { pendingCount: 3 });
    await assertFails(updateDoc(doc(db(CLI), 'chats', 'cli_prof'), { lastMessage: 'Mais uma', lastSenderId: 'cli', pendingCount: 4, updatedAt: serverTimestamp() }));
  });
  test('cliente não aceita a própria conversa no lugar do profissional', async () => {
    await criarConversa('pending');
    await assertFails(updateDoc(doc(db(CLI), 'chats', 'cli_prof'), { status: 'accepted', updatedAt: serverTimestamp() }));
  });
});

describe('Pedidos de serviço', () => {
  const abrirPedido = () => semera(d => setDoc(doc(d, 'requests', 'p1'), { ...pedido(), createdAt: antigo(), updatedAt: antigo() }));

  test('cliente publica um pedido normal', async () => {
    await assertSucceeds(setDoc(doc(db(CLI), 'requests', 'p1'), pedido()));
  });
  test('não aceita foto vinda de endereço externo', async () => {
    await assertFails(setDoc(doc(db(CLI), 'requests', 'p1'), pedido({ photos: ['https://firebasestorage.googleapis.com/v0/b/outro/o/a.jpg'] })));
  });
  test('não dá para publicar pedido com nome de outra pessoa', async () => {
    await assertFails(setDoc(doc(db(CLI), 'requests', 'p1'), pedido({ owner: 'Suporte Conecta' })));
  });
  test('o dono encerra o próprio pedido', async () => {
    await abrirPedido();
    await assertSucceeds(updateDoc(doc(db(CLI), 'requests', 'p1'), { status: 'closed', updatedAt: serverTimestamp() }));
  });
  test('outra pessoa não encerra o pedido', async () => {
    await abrirPedido();
    await assertFails(updateDoc(doc(db(ESTRANHO), 'requests', 'p1'), { status: 'closed', updatedAt: serverTimestamp() }));
  });
  test('o dono não muda o texto do pedido junto com o encerramento', async () => {
    await abrirPedido();
    await assertFails(updateDoc(doc(db(CLI), 'requests', 'p1'), { status: 'closed', title: 'Outro título', updatedAt: serverTimestamp() }));
  });
});

describe('Perfis e dados pessoais', () => {
  test('conta sem e-mail confirmado não cria perfil', async () => {
    const naoConfirmado = conta('novo', 'Nina', { email_verified: false });
    await assertFails(setDoc(doc(db(naoConfirmado), 'profiles', 'novo'), perfil('novo', 'Nina')));
  });
  test('ninguém edita o perfil de outra pessoa', async () => {
    await assertFails(setDoc(doc(db(ESTRANHO), 'profiles', 'prof'), perfil('estranho', 'Paulo Pintor')));
  });
  test('ninguém lê os favoritos de outra pessoa', async () => {
    await assertFails(getDocs(collection(db(ESTRANHO), 'users', 'cli', 'favorites')));
  });
  test('ninguém lê o pedido de privacidade (LGPD) de outra pessoa', async () => {
    await assertFails(getDoc(doc(db(ESTRANHO), 'privacyRequests', 'cli')));
  });
});

describe('Nomes que imitam a plataforma (golpes)', () => {
  const criarPerfil = nome => {
    const pessoa = conta('novo', nome);
    return setDoc(doc(db(pessoa), 'profiles', 'novo'), perfil('novo', nome));
  };

  for (const nome of ['Suporte Conecta', 'Equipe C0necta', 'CONECTA Oficial', 'c o n e c t a', 'Conécta Verificação', 'Administrador', 'Moderação', 'Moderadora Ana']) {
    test(`perfil com o nome "${nome}" é recusado`, async () => {
      await assertFails(criarPerfil(nome));
    });
  }
  for (const nome of ['Maria Conceição', 'Suporte Técnico Silva', 'Conecte Elétrica', 'Ana Moderna Reformas', 'João Admir']) {
    test(`perfil com o nome legítimo "${nome}" é aceito`, async () => {
      await assertSucceeds(criarPerfil(nome));
    });
  }

  const golpista = conta('cli', 'Suporte Conecta');
  test('conta chamada "Suporte Conecta" não inicia conversa', async () => {
    const d = db(golpista);
    const texto = 'Seu perfil será suspenso, pague a taxa.';
    const lote = writeBatch(d);
    lote.set(doc(d, 'chats', 'cli_prof'), {
      customerId: 'cli', providerId: 'prof', participants: ['cli', 'prof'],
      customerName: 'Suporte Conecta', providerName: 'Paulo Pintor',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), status: 'pending', pendingCount: 1,
      lastMessage: texto, lastSenderId: 'cli'
    });
    lote.set(doc(d, 'chats', 'cli_prof', 'messages', 'intro'), { senderId: 'cli', text: texto, createdAt: serverTimestamp() });
    await assertFails(lote.commit());
  });
  test('conta chamada "Suporte Conecta" não publica pedido', async () => {
    await assertFails(setDoc(doc(db(golpista), 'requests', 'p1'), pedido({ owner: 'Suporte Conecta' })));
  });
  test('conta chamada "Suporte Conecta" não avalia', async () => {
    await criarConversa('accepted');
    await assertFails(setDoc(doc(db(golpista), 'profiles', 'prof', 'reviews', 'cli'), avaliacao({ authorName: 'Suporte Conecta' })));
  });
  test('conta sem nome continua publicando como "Cliente Conecta"', async () => {
    const semNome = { uid: 'cli', token: { email_verified: true, email: 'cli@teste.com' } };
    await assertSucceeds(setDoc(doc(db(semNome), 'requests', 'p1'), pedido({ owner: 'Cliente Conecta' })));
  });
});

describe('Exclusão de conta (LGPD)', () => {
  const avaliacaoRecebida = () => semera(d => setDoc(doc(d, 'profiles', 'prof', 'reviews', 'cli'),
    { authorUid: 'cli', authorName: 'Clara', rating: 1, comment: 'Ruim', updatedAt: antigo() }));
  const pedidoComProposta = () => semera(async d => {
    await setDoc(doc(d, 'requests', 'p1'), { ...pedido(), createdAt: antigo(), updatedAt: antigo() });
    await setDoc(doc(d, 'requests', 'p1', 'offers', 'prof'), { providerUid: 'prof', providerName: 'Paulo Pintor', message: 'Posso ajudar com a pintura.', createdAt: antigo() });
  });
  const encerrar = (pessoa, extra = {}) => updateDoc(doc(db(pessoa), 'chats', 'cli_prof'), {
    status: 'removed', lastMessage: 'Conversa encerrada.', lastSenderId: pessoa.uid, updatedAt: serverTimestamp(), ...extra
  });

  test('profissional não apaga avaliação ruim mantendo o perfil', async () => {
    await avaliacaoRecebida();
    await assertFails(deleteDoc(doc(db(PROF), 'profiles', 'prof', 'reviews', 'cli')));
  });
  test('profissional apaga as avaliações recebidas junto com o próprio perfil', async () => {
    await avaliacaoRecebida();
    const d = db(PROF);
    const lote = writeBatch(d);
    lote.delete(doc(d, 'profiles', 'prof'));
    lote.delete(doc(d, 'contacts', 'prof'));
    lote.delete(doc(d, 'profiles', 'prof', 'reviews', 'cli'));
    await assertSucceeds(lote.commit());
  });
  test('quem fez a avaliação apaga a própria avaliação', async () => {
    await avaliacaoRecebida();
    await assertSucceeds(deleteDoc(doc(db(CLI), 'profiles', 'prof', 'reviews', 'cli')));
  });
  test('profissional encontra as próprias propostas em todos os pedidos', async () => {
    await pedidoComProposta();
    await assertSucceeds(getDocs(query(collectionGroup(db(PROF), 'offers'), where('providerUid', '==', 'prof'))));
  });
  test('ninguém encontra as propostas de outra pessoa', async () => {
    await pedidoComProposta();
    await assertFails(getDocs(query(collectionGroup(db(ESTRANHO), 'offers'), where('providerUid', '==', 'prof'))));
  });
  test('profissional apaga a própria proposta', async () => {
    await pedidoComProposta();
    await assertSucceeds(deleteDoc(doc(db(PROF), 'requests', 'p1', 'offers', 'prof')));
  });
  test('cliente apaga o pedido junto com as propostas recebidas', async () => {
    await pedidoComProposta();
    const d = db(CLI);
    const lote = writeBatch(d);
    lote.delete(doc(d, 'requests', 'p1', 'offers', 'prof'));
    lote.delete(doc(d, 'requests', 'p1'));
    await assertSucceeds(lote.commit());
  });
  test('cliente encerra a conversa e vira "Usuário removido"', async () => {
    await criarConversa('accepted');
    await assertSucceeds(encerrar(CLI, { customerName: 'Usuário removido' }));
  });
  test('profissional encerra uma conversa bloqueada ao excluir a conta', async () => {
    await criarConversa('blocked', { blockerId: 'prof' });
    await assertSucceeds(encerrar(PROF, { providerName: 'Usuário removido' }));
  });
  test('ao encerrar, não dá para trocar o nome da outra pessoa', async () => {
    await criarConversa('accepted');
    await assertFails(encerrar(CLI, { customerName: 'Usuário removido', providerName: 'Usuário removido' }));
  });
  test('quem não participa não encerra a conversa', async () => {
    await criarConversa('accepted');
    await assertFails(encerrar(ESTRANHO, { customerName: 'Usuário removido' }));
  });
  test('conversa encerrada não recebe novas mensagens', async () => {
    await criarConversa('removed', { customerName: 'Usuário removido', lastMessage: 'Conversa encerrada.' });
    const d = db(PROF);
    const lote = writeBatch(d);
    lote.update(doc(d, 'chats', 'cli_prof'), { lastMessage: 'Oi?', lastSenderId: 'prof', updatedAt: serverTimestamp() });
    lote.set(doc(collection(d, 'chats', 'cli_prof', 'messages')), { senderId: 'prof', text: 'Oi?', createdAt: serverTimestamp() });
    await assertFails(lote.commit());
  });
  test('conversa encerrada não volta a ser aceita', async () => {
    await criarConversa('removed', { customerName: 'Usuário removido', lastMessage: 'Conversa encerrada.' });
    await assertFails(updateDoc(doc(db(PROF), 'chats', 'cli_prof'), { status: 'accepted', updatedAt: serverTimestamp() }));
  });
  test('a outra pessoa continua lendo a conversa encerrada', async () => {
    await criarConversa('removed', { customerName: 'Usuário removido', lastMessage: 'Conversa encerrada.' });
    await assertSucceeds(getDoc(doc(db(PROF), 'chats', 'cli_prof')));
  });
  test('a segunda pessoa também pode sair da conversa encerrada', async () => {
    await criarConversa('removed', { customerName: 'Usuário removido', lastMessage: 'Conversa encerrada.' });
    await assertSucceeds(encerrar(PROF, { providerName: 'Usuário removido' }));
  });
  test('depois de encerrada, o telefone deixa de ficar disponível', async () => {
    await criarConversa('removed', { providerName: 'Usuário removido', lastMessage: 'Conversa encerrada.' });
    await assertFails(getDoc(doc(db(CLI), 'contacts', 'prof')));
  });
});
