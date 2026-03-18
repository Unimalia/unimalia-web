function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function wrapEmailHtml(title: string, contentHtml: string) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Arial; line-height:1.5; color:#111;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="font-size:18px;font-weight:700;margin-bottom:12px;">${escapeHtml(title)}</div>
      <div style="font-size:14px;color:#222;">${contentHtml}</div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <div style="font-size:12px;color:#666;">
        UNIMALIA — ecosistema digitale per la protezione degli animali.<br/>
        Se non hai richiesto tu questa email, puoi ignorarla.
      </div>
    </div>
  </div>`;
}

export function verificationEmail(params: {
  verifyUrl: string;
  reportTitle: string;
}) {
  const html = wrapEmailHtml(
    "Conferma il tuo annuncio",
    `
      <p>Abbiamo ricevuto il tuo annuncio: <b>${escapeHtml(params.reportTitle)}</b>.</p>
      <p>Per pubblicarlo e poterlo poi gestire senza registrarti, conferma la tua email:</p>
      <p>
        <a href="${params.verifyUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#111;color:#fff;">
          Conferma annuncio
        </a>
      </p>
      <p style="color:#666;font-size:12px;">Se il pulsante non funziona, copia questo link nel browser:<br/>${escapeHtml(params.verifyUrl)}</p>
    `
  );
  return { subject: "Conferma il tuo annuncio su UNIMALIA", html };
}

export function reportPublishedEmail(params: {
  reportUrl: string;
  manageUrl: string;
  reportTitle: string;
}) {
  const html = wrapEmailHtml(
    "Il tuo annuncio è online",
    `
      <p>Il tuo annuncio è stato pubblicato: <b>${escapeHtml(params.reportTitle)}</b>.</p>

      <p><b>Link pubblico annuncio:</b></p>
      <p><a href="${params.reportUrl}">${escapeHtml(params.reportUrl)}</a></p>

      <p style="margin-top:18px;"><b>Link privato per gestire l’annuncio:</b></p>
      <p><a href="${params.manageUrl}">${escapeHtml(params.manageUrl)}</a></p>

      <p style="margin-top:18px;">
        Da questa pagina privata potrai:
      </p>
      <ul style="padding-left:18px;">
        <li>copiare il link da condividere</li>
        <li>copiare un testo pronto per Facebook</li>
        <li>segnare l’annuncio come ritrovato</li>
      </ul>
    `
  );
  return { subject: "Il tuo annuncio è online ✅", html };
}

export function protectedConversationEmail(params: {
  heading: string;
  reportTitle: string;
  reportUrl: string;
  message: string;
  conversationUrl: string;
}) {
  const html = wrapEmailHtml(
    params.heading,
    `
      <p>Annuncio: <b>${escapeHtml(params.reportTitle)}</b></p>

      <div style="padding:12px;border:1px solid #eee;border-radius:12px;background:#fafafa;margin:12px 0;">
        ${escapeHtml(params.message).replace(/\n/g, "<br/>")}
      </div>

      <p>Per leggere e rispondere senza mostrare il tuo indirizzo email:</p>

      <p>
        <a href="${params.conversationUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#111;color:#fff;">
          Apri conversazione protetta
        </a>
      </p>

      <p style="margin-top:16px;">
        Link annuncio pubblico:
        <br />
        <a href="${params.reportUrl}">${escapeHtml(params.reportUrl)}</a>
      </p>
    `
  );
  return { subject: "Nuovo messaggio protetto su UNIMALIA", html };
}

export function newMessageRelayEmail(params: {
  reportTitle: string;
  reportUrl: string;
  senderEmail: string;
  message: string;
}) {
  const html = wrapEmailHtml(
    "Hai un nuovo messaggio",
    `
      <p>Messaggio per: <b>${escapeHtml(params.reportTitle)}</b></p>
      <p><b>Da:</b> ${escapeHtml(params.senderEmail)}</p>
      <div style="padding:12px;border:1px solid #eee;border-radius:12px;background:#fafafa;margin:12px 0;">
        ${escapeHtml(params.message).replace(/\n/g, "<br/>")}
      </div>
      <p>Apri l’annuncio:</p>
      <p><a href="${params.reportUrl}">${escapeHtml(params.reportUrl)}</a></p>
    `
  );
  return { subject: "Nuovo messaggio sul tuo annuncio", html };
}

export function expiringSoonEmail(params: {
  reportTitle: string;
  manageUrl: string;
  daysLeft: number;
}) {
  const html = wrapEmailHtml(
    "Il tuo annuncio sta per scadere",
    `
      <p><b>${escapeHtml(params.reportTitle)}</b> scadrà tra <b>${params.daysLeft} giorni</b>.</p>
      <p>Vuoi mantenerlo attivo?</p>
      <p>
        <a href="${params.manageUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#111;color:#fff;">
          Mantieni attivo annuncio
        </a>
      </p>
    `
  );
  return { subject: "Promemoria: annuncio in scadenza", html };
}

export function askIfFoundEmail(params: {
  reportTitle: string;
  closeFoundUrl: string;
  keepActiveUrl: string;
}) {
  const html = wrapEmailHtml(
    "Aggiornamento annuncio",
    `
      <p>${escapeHtml(params.reportTitle)} è stato risolto?</p>
      <p>
        <a href="${params.closeFoundUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#111;color:#fff;margin-right:8px;">
          Sì, ritrovato ✅
        </a>
        <a href="${params.keepActiveUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#eee;color:#111;">
          No, ancora no
        </a>
      </p>
    `
  );
  return { subject: "È stato ritrovato?", html };
}

export function inviteToRegisterAfterFoundEmail(params: {
  registerUrl: string;
  alreadyRegistered?: boolean;
  donateUrl?: string | null;
}) {
  const title = params.alreadyRegistered
    ? "Crea la scheda animale su UNIMALIA"
    : "Proteggi il tuo animale per sempre";

  const actionLabel = params.alreadyRegistered
    ? "Crea scheda animale"
    : "Registrati e crea scheda animale";

  const donateBlock = params.donateUrl
    ? `
      <p style="margin-top:18px;color:#555;font-size:13px;">
        Se UNIMALIA ti è stato utile e vuoi sostenere il progetto, puoi farlo in modo del tutto facoltativo.
      </p>
      <p>
        <a href="${params.donateUrl}" style="font-size:13px;color:#111;">
          Sostieni UNIMALIA
        </a>
      </p>
    `
    : "";

  const html = wrapEmailHtml(
    title,
    `
      <p>Felici che sia andata bene ❤️</p>
      <p>
        ${
          params.alreadyRegistered
            ? "Ora puoi creare la scheda animale su UNIMALIA, così avrai tutto più pronto in caso di emergenza."
            : "Vuoi registrarti e creare l’identità digitale del tuo animale? Così, se succede di nuovo, fai tutto più velocemente."
        }
      </p>
      <p>
        <a href="${params.registerUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;text-decoration:none;background:#111;color:#fff;">
          ${actionLabel}
        </a>
      </p>
      ${donateBlock}
    `
  );
  return { subject: "UNIMALIA · Dopo il lieto fine", html };
}