'use client'
import { useState, useEffect } from 'react'
import Icon from '@/components/ui/Icon'

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

// Charge le script reCAPTCHA v3 une seule fois
function loadRecaptcha() {
  if (!SITE_KEY || document.getElementById('recaptcha-script')) return
  const script = document.createElement('script')
  script.id = 'recaptcha-script'
  script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
  script.async = true
  document.head.appendChild(script)
}

function getRecaptchaToken(action = 'contact') {
  return new Promise((resolve, reject) => {
    if (!SITE_KEY) { resolve(null); return }
    window.grecaptcha.ready(async () => {
      try {
        const token = await window.grecaptcha.execute(SITE_KEY, { action })
        resolve(token)
      } catch (err) {
        reject(err)
      }
    })
  })
}

export default function ContactClient() {
  const [form, setForm] = useState({ prenom: "", nom: "", email: "", sujet: "Inscription", message: "", website: "" })
  const [status, setStatus] = useState("idle")
  const [feedback, setFeedback] = useState("")
  const u = (k, v) => {
    setForm({ ...form, [k]: v })
    if (status !== "idle") {
      setStatus("idle")
      setFeedback("")
    }
  }

  useEffect(() => {
    loadRecaptcha()
    // Affiche le badge reCAPTCHA uniquement sur cette page
    document.body.classList.add('show-recaptcha')
    return () => document.body.classList.remove('show-recaptcha')
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setStatus("sending")
    setFeedback("")

    if (!form.prenom.trim() || !form.nom.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus("error")
      setFeedback("Merci de compléter tous les champs obligatoires.")
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus("error")
      setFeedback("Merci de saisir une adresse email valide.")
      return
    }

    // Récupère le token reCAPTCHA v3 (invisible)
    let recaptchaToken = null
    try {
      recaptchaToken = await getRecaptchaToken('contact')
    } catch {
      // En cas d'échec du script reCAPTCHA, on laisse le serveur décider
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptchaToken }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Le message n'a pas pu être envoyé.")
      }

      setForm({ prenom: "", nom: "", email: "", sujet: "Inscription", message: "", website: "" })
      setStatus("success")
      setFeedback("Votre message a bien été envoyé. Nous vous répondrons rapidement.")
    } catch (error) {
      setStatus("error")
      setFeedback(error.message || "Le message n'a pas pu être envoyé.")
    }
  }

  return (
    <section className="section">
      <div className="container">
        <div className="contact-grid">

          {/* Coordonnées — passe sous le formulaire sur mobile (order: 2) */}
          <div className="contact-info-col">
            <h3 style={{ marginBottom: 24 }}>Coordonnées</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <Icon name="mail" size={18}/>
                <div>
                  <strong style={{ display: "block", marginBottom: 4 }}>Email</strong>
                  <a href="mailto:contact@gymmarche.fr">contact@gymmarche.fr</a>
                </div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <Icon name="pin" size={18}/>
                <div>
                  <strong style={{ display: "block", marginBottom: 4 }}>Adresse (boîte aux lettres)</strong>
                  <span style={{ color: "var(--ink-soft)" }}>50, rue du Muguet<br/>78120 Rambouillet</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 36, padding: 24, background: "var(--bg-elev)", border: "1px solid var(--line)", borderRadius: "var(--r-md)" }}>
              <h4 style={{ marginBottom: 10 }}>Forum des Associations</h4>
              <p style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}>
                Samedi 13 septembre au stade du Vieux Moulin. Venez nous rencontrer sur le stand AGMR.
              </p>
            </div>

            <div style={{ marginTop: 20, padding: 24, background: "var(--green-tint)", border: "1px solid var(--green-soft)", borderRadius: "var(--r-md)" }}>
              <h4 style={{ marginBottom: 10 }}>Première séance gratuite</h4>
              <p style={{ margin: 0, fontSize: "0.94rem", color: "var(--ink-soft)" }}>
                Vous pouvez assister à une séance d&apos;essai gratuite sans inscription préalable pour la gym et la randonnée.
              </p>
            </div>
          </div>

          {/* Formulaire — reste en premier sur mobile (order: 1) */}
          <div className="contact-form-col">
            <h3 style={{ marginBottom: 24 }}>Formulaire de contact</h3>
            <form className="form" onSubmit={submit}>
              <div style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }} aria-hidden="true">
                <label>
                  Site web
                  <input tabIndex={-1} autoComplete="off" value={form.website} onChange={e => u("website", e.target.value)}/>
                </label>
              </div>
              <div className="row-2">
                <div className="field">
                  <label>Prénom</label>
                  <input value={form.prenom} onChange={e => u("prenom", e.target.value)} placeholder="Votre prénom" required autoComplete="given-name"/>
                </div>
                <div className="field">
                  <label>Nom</label>
                  <input value={form.nom} onChange={e => u("nom", e.target.value)} placeholder="Votre nom" required autoComplete="family-name"/>
                </div>
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => u("email", e.target.value)} placeholder="votre@email.fr" required autoComplete="email"/>
              </div>
              <div className="field">
                <label>Sujet</label>
                <select value={form.sujet} onChange={e => u("sujet", e.target.value)}>
                  {["Inscription","Randonnée","Gym","Marche nordique","Séjour","Autre"].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Message</label>
                <textarea rows={5} value={form.message} onChange={e => u("message", e.target.value)} placeholder="Votre message..." required maxLength={3000}/>
              </div>
              {feedback && (
                <p
                  role={status === "error" ? "alert" : "status"}
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    borderRadius: "var(--r-sm)",
                    border: `1px solid ${status === "error" ? "var(--accent)" : "var(--green-soft)"}`,
                    background: status === "error" ? "var(--accent-tint)" : "var(--green-tint)",
                    color: "var(--ink-soft)",
                    fontSize: "0.94rem",
                  }}
                >
                  {feedback}
                </p>
              )}
              <button className="btn btn-primary" type="submit" disabled={status === "sending"} style={{ alignSelf: "flex-start" }}>
                {status === "sending" ? "Envoi en cours..." : "Envoyer le message"}
              </button>
              {SITE_KEY && (
                <p style={{ margin: 0, fontSize: "0.74rem", color: "var(--ink-mute)", lineHeight: 1.5 }}>
                  Ce formulaire est protégé par reCAPTCHA —{" "}
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>Confidentialité</a>
                  {" & "}
                  <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" style={{ color: "inherit" }}>CGU</a> Google.
                </p>
              )}
            </form>
          </div>

        </div>
      </div>
    </section>
  )
}
