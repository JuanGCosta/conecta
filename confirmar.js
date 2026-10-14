/* Conecta: secure Firebase email action handler for the free GitHub Pages deployment. */
const SITE_URL = 'https://juangcosta.github.io/conecta/';
const params = new URLSearchParams(location.search);
const mode = params.get('mode');
const code = params.get('oobCode');
const title = document.getElementById('statusTitle');
const description = document.getElementById('statusDescription');
const eyebrow = document.getElementById('statusEyebrow');
const icon = document.getElementById('statusIcon');
const primary = document.getElementById('primaryButton');
const passwordSection = document.getElementById('passwordSection');
const support = document.getElementById('supportLine');
const form = document.getElementById('passwordForm');
const formError = document.getElementById('formError');
const submit = document.getElementById('resetSubmit');
const config = window.CONECTA_FIREBASE_CONFIG;
function status(kind, label, heading, body, opts = {}) {
  icon.dataset.kind = kind;
  icon.innerHTML = kind === 'success' ? '✓' : kind === 'error' ? '!' : '<span class="status-spinner"></span>';
  eyebrow.textContent = label;
  title.textContent = heading;
  description.textContent = body;
  passwordSection.hidden = !opts.showPassword;
  primary.hidden = !opts.showReturn;
  primary.href = SITE_URL;
  support.textContent = opts.note || 'Sua segurança vem em primeiro lugar.';
}
function errorMessage(error) {
  switch (error?.code) {
    case 'auth/invalid-action-code':
    case 'auth/expired-action-code':
      return 'Este link já foi utilizado, expirou ou não é válido. Entre no Conecta e solicite um novo e-mail.';
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
  try { history.replaceState({}, '', location.pathname); } catch { /* no-op */ }
}
async function run() {
  if (!mode || !code) {
    status('error','LINK INCOMPLETO','Não encontramos a confirmação','Abra o link completo recebido no seu e-mail. Se ele estiver incompleto, solicite outro pelo Conecta.',{showReturn:true});
    return;
  }
  if (!config?.apiKey || !config?.projectId || !config?.authDomain) {
    status('error','CONEXÃO INDISPONÍVEL','Não conseguimos confirmar agora','A configuração da plataforma está indisponível. Volte ao Conecta e tente novamente.',{showReturn:true});
    return;
  }
  try {
    const version='11.10.0';
    const [appSDK, authSDK] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${version}/firebase-auth.js`)
    ]);
    const app = appSDK.getApps().length ? appSDK.getApp() : appSDK.initializeApp(config);
    const auth = authSDK.getAuth(app);
    auth.languageCode='pt-BR';
    if (mode === 'verifyEmail' || mode === 'verifyAndChangeEmail') {
      await authSDK.applyActionCode(auth, code);
      clearCodeFromUrl();
      status('success','TUDO CERTO!','Seu e-mail foi confirmado!','Sua conta Conecta está verificada. Agora você pode entrar, criar seu perfil e conversar com profissionais.',{showReturn:true,note:'Sua conta está pronta para novas conexões.'});
    } else if (mode === 'resetPassword') {
      await authSDK.verifyPasswordResetCode(auth, code);
      status('success','RECUPERAÇÃO DE CONTA','Crie sua nova senha','Escolha uma senha segura para voltar a acessar sua conta Conecta.',{showPassword:true,note:'Use uma senha exclusiva para sua conta.'});
      form.addEventListener('submit',async event=>{
        event.preventDefault();formError.hidden=true;
        const pw=document.getElementById('newPassword').value;
        const confirm=document.getElementById('confirmPassword').value;
        if(pw.length<8 || pw!==confirm){formError.textContent=pw.length<8?'Use pelo menos 8 caracteres.':'As senhas não coincidem.';formError.hidden=false;return;}
        submit.disabled=true;
        try{
          await authSDK.confirmPasswordReset(auth,code,pw);
          clearCodeFromUrl();
          status('success','SENHA ATUALIZADA','Sua senha foi redefinida!','Agora você pode entrar no Conecta usando sua nova senha.',{showReturn:true});
        }catch(e){formError.textContent=errorMessage(e);formError.hidden=false;}finally{submit.disabled=false;}
      });
    } else if (mode === 'recoverEmail') {
      await authSDK.checkActionCode(auth,code);
      await authSDK.applyActionCode(auth,code);
      clearCodeFromUrl();
      status('success','CONTA PROTEGIDA','E-mail anterior restaurado','A alteração do endereço de e-mail foi revertida. Se você não reconhece essa solicitação, recomendamos redefinir a senha no Conecta.',{showReturn:true});
    } else {
      status('error','AÇÃO NÃO RECONHECIDA','Link não reconhecido','Essa ação não é compatível com esta página. Acesse o Conecta para continuar.',{showReturn:true});
    }
  } catch (e) {
    console.warn('Conecta email action:',e?.code||e?.message||'unknown');
    status('error','NÃO FOI POSSÍVEL CONFIRMAR','Não conseguimos concluir',errorMessage(e),{showReturn:true,note:'Por segurança, links de confirmação só podem ser utilizados uma vez.'});
  }
}
run();
