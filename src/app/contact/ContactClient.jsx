'use client'
import { useState } from 'react'
import Icon from '@/components/ui/Icon'

const TEST_CONTACT_EMAIL = 'tho.chevalier@gmail.com'

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

  const submit = async (e) => {
    e.preventDefault()
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

    const subject = `[AGMR] ${form.sujet} - ${form.prenom} ${form.nom}`
    const body = [
      `Prénom : ${form.prenom}`,
      `Nom : ${form.nom}`,
      `Email : ${form.email}`,
      `Sujet : ${form.sujet}`,
      '',
      'Message :',
      form.message,
    ].join('\n')

    window.location.href = `mailto:${TEST_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    setStatus("success")
    setFeedback(`Votre message est prêt dans votre logiciel mail, adressé à ${TEST_CONTACT_EMAIL}.`)
  }

  return (
    <section className="section">
      <div className="container">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 56 }}>

          <div>
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

          <div>
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
            </form>
          </div>

        </div>
      </div>
    </section>
  )
}
