/* Conecta: processamento de links de e-mail do Firebase no domínio oficial. */
const SITE_URL = 'https://conectasjc.com.br/';
const params = new URLSearchParams(location.search);
const mode = params.get('mode');
const code = params.get('oobCode');
const title = document.getElementById('statusTitle');
const description = document.getElementById('statusDescription');
const icon = document.getElementById('statusIcon');
const primary = document.getElementById('primaryButton');
const passwordSection = document.getElementById('passwordSection');
const support = document.getElementById('supportLine');
const form = document.getElementById('passwordForm');
const formError = document.getElementById('formError');
const submit = document.getElementById('resetSubmit');
const config = window.CONECTA_FIREBASE_CONFIG;

const statusIcons = {
  info: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><rect x="4.5" y="8" width="23" height="16" rx="3"/><path d="m5.5 10 10.5 8 10.5-8"/></svg>',
  success: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="12"/><path d="m10.5 16.2 3.7 3.8 7.5-8"/></svg>',
  error: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round"><circle cx="16" cy="16" r="12"/><path d="M16 9v9M16 23h.01"/></svg>',
  loading: '<span class="status-spinner"></span>'
};

function status(kind, heading, body, opts = {}) {
  icon.hidden = kind === 'info';
  icon.dataset.kind = kind;
  icon.innerHTML = statusIcons[kind] || statusIcons.info;
  title.textContent = heading;
  description.textContent = body;
  passwordSection.hidden = !opts.showPassword;
  primary.hidden = !opts.showReturn;
  primary.href = SITE_URL;
  support.textContent = opts.note || 'Precisa de ajuda? Entre em contato com nosso suporte.';
}
function errorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'Este link já foi utilizado, expirou ou não é válido. Solicite um novo e-mail no Conecta.';
    case 'auth/user-disabled':
      return 'Esta conta está indisponível. Tente novamente mais tarde.';
    case 'auth/weak-password':
      return 'Sua senha está muito fraca. Crie uma senha mais longa e difícil de adivinhar.';
    case 'auth/network-request-failed':
      return 'Não conseguimos nos conectar agora. Verifique sua internet e tente novamente.';
    default:
      return 'Não foi possível concluir a solicitação. Volte ao Conecta e tente novamente.';
  }
}
function clearCodeFromUrl() {
  try { history.replaceState({}, '', location.pathname); } catch { /* Nenhuma ação necessária. */ }
}
async function run() {
  if (!mode || !code) {
    status('info', 'Confirmar e-mail', 'Abra o link enviado ao seu e-mail para confirmar sua conta.', {
      showReturn: true,
      note: 'Não encontrou o e-mail? Verifique a caixa de spam ou peça um novo envio no Conecta.'
    });
    return;
  }
  status('loading', 'Verificando seu link', 'Estamos conferindo as informações da sua conta.', {
    note: 'Este processo pode levar alguns instantes.'
  });
  if (!config?.apiKey || !config?.projectId || !config?.authDomain) {
    status('error', 'Não foi possível confirmar', 'A configuração da plataforma está indisponível. Tente novamente mais tarde.', {showReturn:true});
    return;
  }
  try {
    const version = '11.10.0';
    const [appSDK, authSDK] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`)
    ]);
    const app = appSDK.getApps().length ? appSDK.getApp() : appSDK.initializeApp(config);
    const appCheckKey = String(window.CONECTA_APP_CHECK_SITE_KEY || '').trim();
    if (appCheckKey) {
      try {
        const ac = await import(`https://www.gstatic.com/firebasejs/${version}/firebase-app-check.js`);
        const provider = String(window.CONECTA_APP_CHECK_PROVIDER || 'enterprise') === 'v3'
          ? new ac.ReCaptchaV3Provider(appCheckKey)
          : new ac.ReCaptchaEnterpriseProvider(appCheckKey);
        ac.initializeAppCheck(app, { provider, isTokenAutoRefreshEnabled: true });
      } catch (e) { console.warn('Conecta App Check:', e?.code || e); }
    }
    const auth = authSDK.getAuth(app);
    auth.languageCode = 'pt-BR';
    if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') {
      await authSDK.applyActionCode(auth, code);
      clearCodeFromUrl();
      status('success', 'E-mail confirmado!', 'Sua conta está verificada. Volte ao Conecta para continuar.', {
        showReturn: true,
        note: 'Se você já estava conectado, atualize a verificação da conta dentro do Conecta.'
      });
    } else if (mode === 'resetPassword') {
      await authSDK.verifyPasswordResetCode(auth, code);
      status('info', 'Criar nova senha', 'Escolha uma senha segura para acessar sua conta.', {
        showPassword: true,
        note: 'Use uma senha exclusiva para o Conecta.'
      });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        formError.hidden = true;
        const pw = document.getElementById('newPassword').value;
        const confirm = document.getElementById('confirmPassword').value;
        if (pw !== confirm || pw.length < 10 || pw.length > 128 || /\s/.test(pw) || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9\s]/.test(pw) || /senha|password|123456|qwerty|conecta|admin/i.test(pw)) {
          formError.textContent = pw !== confirm ? 'As senhas não coincidem.' : 'Crie uma senha com pelo menos 10 caracteres, maiúscula, minúscula, número e símbolo, sem palavras comuns.';
          formError.hidden = false;
          return;
        }
        submit.disabled = true;
        try {
          await authSDK.confirmPasswordReset(auth, code, pw);
          clearCodeFromUrl();
          status('success', 'Senha atualizada!', 'Agora você pode entrar no Conecta usando sua nova senha.', {showReturn:true});
        } catch (e) {
          formError.textContent = errorMessage(e);
          formError.hidden = false;
        } finally { submit.disabled = false; }
      });
    } else if (mode === 'recoverEmail') {
      await authSDK.checkActionCode(auth, code);
      await authSDK.applyActionCode(auth, code);
      clearCodeFromUrl();
      status('success', 'E-mail restaurado', 'A alteração do endereço de e-mail foi revertida. Se você não reconhece essa solicitação, redefina sua senha no Conecta.', {showReturn:true});
    } else {
      status('error', 'Link não reconhecido', 'Esta ação não é compatível com a página. Acesse o Conecta para continuar.', {showReturn:true});
    }
  } catch (e) {
    console.warn('Conecta email action:', e?.code || 'unknown');
    status('error', 'Não foi possível confirmar', errorMessage(e), {
      showReturn:true,
      note:'Por segurança, links de confirmação só podem ser utilizados uma vez.'
    });
  }
}
run();
