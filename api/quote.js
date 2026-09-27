"use strict";

/* Recebe o formulario de orcamento do #quote e manda por e-mail.
 *
 * Provedor: Resend — unico resultado de `vercel integration discover
 * --category messaging`. A integracao do Marketplace injeta RESEND_API_KEY
 * no projeto; nada aqui le segredo de outro lugar.
 *
 * Sem SDK e sem package.json de proposito: o runtime e Node 24 (fixado em
 * .vercel/project.json), que tem fetch nativo. Uma dependencia aqui obrigaria
 * um install no build de um site que hoje e estatico puro.
 *
 * Quando a chave nao existe, responde 503 com motivo. O front-end trata isso
 * como falha e devolve o formulario preenchido com o telefone ao lado — nunca
 * mostra "Request received". Confirmar um envio que nao aconteceu faria a
 * pessoa esperar por um retorno que nunca vem.
 */

const TO = process.env.QUOTE_TO || "4pointscontact@gmail.com";
/* onboarding@resend.dev e o remetente de teste do Resend: funciona antes de
   qualquer dominio ser verificado. Depois de verificar 4pointscleaning.com,
   defina QUOTE_FROM como quotes@4pointscleaning.com — a entregabilidade
   melhora e o e-mail para de cair como "via resend.dev". */
const FROM = process.env.QUOTE_FROM || "4Points Website <onboarding@resend.dev>";

/* Mesma ordem e mesmos rotulos da constante REVIEW em js/main.js: o e-mail que
   chega e a mesma tabela que a pessoa confirmou na tela, linha por linha. */
const FIELDS = [
  ["Service", "service"], ["Frequency", "frequency"], ["Priorities", "needs"],
  ["Property type", "propertyType"], ["Approx. size", "size"], ["Floor surfaces", "floors"],
  ["Service window", "access"], ["Notes", "notes"],
  ["Name", "name"], ["Company", "company"], ["Email", "email"], ["Phone", "phone"],
  ["Service area", "address"]
];

const MAX_BODY = 32 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const esc = v => String(v == null ? "" : v)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* Um valor de formulario nunca deve poder injetar cabecalho no e-mail. */
const oneLine = v => String(v == null ? "" : v).replace(/[\r\n]+/g, " ").trim();

function readBody(req) {
  if (req.body && typeof req.body === "object") return Promise.resolve(req.body);
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > MAX_BODY) reject(new Error("payload too large"));
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (err) { reject(new Error("invalid JSON")); }
    });
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let data;
  try {
    data = await readBody(req);
  } catch (err) {
    return res.status(400).json({ error: "Could not read the request." });
  }

  /* Espelha validate(3) do front. O navegador ja barrou isto uma vez; aqui
     barra de novo porque a funcao e publica e o front nao e a fronteira. */
  const name = oneLine(data.name);
  const email = oneLine(data.email);
  const address = oneLine(data.address);
  if (name.length < 2 || !EMAIL_RE.test(email) || address.length < 3) {
    return res.status(422).json({ error: "Please check your name, email and service area." });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("[quote] RESEND_API_KEY ausente — integracao Resend nao provisionada");
    return res.status(503).json({ error: "Email delivery is not configured yet." });
  }

  const rows = FIELDS
    .map(([label, key]) => {
      const value = oneLine(data[key]) || "—";
      return '<tr><td style="padding:6px 16px 6px 0;color:#61748A;font-size:13px;' +
        'white-space:nowrap;vertical-align:top">' + esc(label) + '</td>' +
        '<td style="padding:6px 0;color:#102A43;font-size:15px">' + esc(value) + "</td></tr>";
    })
    .join("");

  const text = FIELDS
    .map(([label, key]) => label + ": " + (oneLine(data[key]) || "—"))
    .join("\n");

  const html =
    '<div style="font-family:Helvetica,Arial,sans-serif;max-width:640px">' +
    '<p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;' +
    'color:#12556B;margin:0 0 4px">New quote request</p>' +
    '<h1 style="font-size:22px;color:#102A43;margin:0 0 20px">' +
      esc(oneLine(data.service) || "Quote") + " — " + esc(name) + "</h1>" +
    '<table style="border-collapse:collapse;width:100%">' + rows + "</table>" +
    '<p style="margin:22px 0 0;font-size:13px;color:#61748A">' +
    "Sent from the quote form at 4pointscleaning.com. Reply to this email to answer " +
    esc(name) + " directly.</p></div>";

  try {
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.RESEND_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: email,
        subject: "Quote request — " + (oneLine(data.service) || "4Points") + " — " + name,
        html,
        text
      })
    });

    if (!sent.ok) {
      const detail = await sent.text().catch(() => "");
      console.error("[quote] resend " + sent.status + ": " + detail.slice(0, 500));
      return res.status(502).json({ error: "We could not deliver your request." });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[quote]", err);
    return res.status(502).json({ error: "We could not deliver your request." });
  }
};
