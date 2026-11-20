const MONTHS_FULL = [
  "janvier","fevrier","mars","avril","mai","juin",
  "juillet","aout","septembre","octobre","novembre","decembre"
]
const MONTHS_SHORT = [
  "jan","fev","mars","avr","mai","juin",
  "juil","aout","sept","oct","nov","dec"
]

export const formatDateFR = (iso) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`
}

export const monthFR = (m) => MONTHS_SHORT[m]
export const monthFRFull = (m) => MONTHS_FULL[m]

export const catLabel = (c) => ({
  gym: "Gym",
  rando: "Randonnee",
  nordique: "Marche nordique",
  asso: "Association",
  event: "Evenement",
}[c] || c)
