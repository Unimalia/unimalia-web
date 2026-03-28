# UNIMALIA — Technical Overview

## 1. Stack Tecnologico

- Frontend / Backend: Next.js (App Router)
- Backend services: Supabase (Auth, Database, Storage)
- Hosting: Vercel
- CDN / Security layer: Cloudflare
- Storage avanzato: Cloudflare R2 (imaging, file clinici)

---

## 2. Concetto Chiave del Sistema

### Entità centrale: Animale

L'animale è l'entità principale del sistema ed è indipendente dal proprietario.

- Può esistere senza owner registrato
- Può essere creato da un veterinario
- Può essere successivamente rivendicato dal proprietario

---

## 3. Modello di Accesso

### Attori

- Owner (proprietario)
- Professionista (veterinario/clinica)
- Organizzazione (clinica)

---

### Regole di accesso

1. Owner  
   Accesso completo ai propri animali (con limitazioni legate al piano)

2. Professionista con grant attivo  
   Accesso completo (read/write in base al grant)

3. Professionista senza grant  
   Accesso limitato:
   - solo eventi creati da sé (own_only)
   - nessuna visibilità globale

4. Clinic origin  
   Se l’animale è stato creato dalla clinica, può esistere accesso contestuale

---

### Funzione centrale

requireOwnerOrGrant(...)

Gestisce:
- validazione accesso
- fallback own_only
- contesto organizzazione
- scope read/write

---

## 4. Claim Owner (Rivendicazione Animale)

- Il proprietario può rivendicare un animale tramite token/email
- Il claim NON assegna automaticamente grant ai veterinari
- Collega owner ↔ animale

Validazione:
- email obbligatoria
- matching prudente

---

## 5. Microchip

- Stato default: microchip da verificare
- Anche se presente, non è automaticamente verificato
- Il veterinario può confermare la corrispondenza

---

## 6. Cartella Clinica

### Eventi clinici
- CRUD lato professionista
- Stato:
  - attivo
  - void (cancellato logico)

### Visibilità
- Owner:
  - completa solo se premium
  - altrimenti accesso parziale via referti/email

---

## 7. Gestione File

- Upload/download legati agli eventi clinici
- Accesso controllato via:
  - grant
  - owner
  - fallback own_only

---

## 8. Imaging (DICOM)

Pipeline separata:

1. prepare upload
2. upload diretto su Cloudflare R2
3. complete upload

Caratteristiche:
- non passa dal backend
- accesso controllato
- separato dai file standard

---

## 9. Sicurezza

### Browser
- CSP
- HSTS
- Frame protection
- Permissions Policy

### Backend
- requireOwnerOrGrant per accessi
- audit log (writeAudit)

---

## 10. Stato Attuale

Consolidato:
- clinic events
- gestione file
- claim owner
- sicurezza base

In miglioramento:
- centralizzazione helper
- riduzione duplicazioni
- audit più uniforme

---

## 11. Rischi Noti

- duplicazione logiche auth
- incoerenze tra route
- helper sparsi
- access control non uniforme

---

## 12. Direzione Tecnica

1. centralizzare access control
2. eliminare duplicazioni helper
3. migliorare audit
4. preparare scalabilità

---

## 13. Filosofia Prodotto

- nessuna registrazione obbligatoria
- veterinari come driver
- identità animale centrale
- sicurezza prioritaria