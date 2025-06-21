# Grafiche - Wash The World

## Panoramica
Questo documento descrive tutte le grafiche SVG personalizzate create per il progetto "Wash The World".

## Cartella delle Grafiche
Tutte le grafiche sono posizionate in: `frontend/public/images/`

## File SVG Creati

### 1. Logo Principale
- **File**: `logo.svg`
- **Descrizione**: Logo ufficiale di "Wash The World" con goccia d'acqua stilizzata
- **Caratteristiche**:
  - Design moderno con gradiente blu
  - Icona goccia d'acqua con effetti di brillantezza
  - Testo "WASH THE WORLD" con tipografia pulita
  - Dimensioni: 200x60px

### 2. Badge Completato
- **File**: `badge-complete.svg`
- **Descrizione**: Icona per badge sbloccati/completati
- **Caratteristiche**:
  - Sfondo circolare con gradiente verde
  - Checkmark bianco al centro
  - Effetti di brillantezza e scintille decorative
  - Dimensioni: 64x64px

### 3. Badge Bloccato
- **File**: `badge-locked.svg`
- **Descrizione**: Icona per badge non ancora sbloccati
- **Caratteristiche**:
  - Sfondo circolare con gradiente grigio
  - Icona lucchetto al centro
  - Indicatore di blocco (X rossa)
  - Dimensioni: 64x64px

### 4. Goccia d'Acqua
- **File**: `water-drop.svg`
- **Descrizione**: Icona generica per elementi legati all'acqua
- **Caratteristiche**:
  - Goccia d'acqua stilizzata con gradiente blu
  - Effetti di brillantezza
  - Onde circolari decorative
  - Dimensioni: 48x48px

### 5. Sfondo Hero
- **File**: `hero-bg.svg`
- **Descrizione**: Sfondo decorativo per sezioni hero
- **Caratteristiche**:
  - Gradiente blu chiaro
  - Bolle decorative fluttuanti
  - Pattern ondulati
  - Dimensioni: 1200x400px

## Utilizzo nei Componenti

### Login.jsx
- Utilizza `logo.svg` per il logo principale
- Utilizza `hero-bg.svg` come sfondo decorativo

### OnboardingDashboard.jsx
- Utilizza `logo.svg` nell'header
- Utilizza `badge-complete.svg` e `badge-locked.svg` per i badge

### Badges.jsx
- Utilizza `badge-complete.svg` per badge sbloccati
- Utilizza `badge-locked.svg` per badge bloccati

## Caratteristiche Tecniche

### Formato
- Tutti i file sono in formato SVG vettoriale
- Scalabili senza perdita di qualità
- Ottimizzati per il web

### Colori
- **Blu principale**: #3B82F6
- **Blu chiaro**: #60A5FA
- **Verde**: #10B981
- **Grigio**: #6B7280

### Gradienti
- Gradienti lineari per profondità
- Gradienti radiali per effetti di brillantezza
- Opacità variabili per effetti di trasparenza

## Personalizzazione

### Modificare i Colori
I colori possono essere modificati cambiando i valori nei tag `<stop>` dei gradienti:

```svg
<stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
<stop offset="100%" style="stop-color:#1E40AF;stop-opacity:1" />
```

### Aggiungere Nuove Grafiche
1. Creare il file SVG in `frontend/public/images/`
2. Ottimizzare per il web (dimensioni, colori)
3. Aggiornare questo documento
4. Integrare nei componenti React

## Best Practices

### Performance
- File SVG ottimizzati per dimensioni ridotte
- Utilizzo di gradienti invece di immagini raster
- Scalabilità vettoriale per tutti i dispositivi

### Accessibilità
- Tag `alt` appropriati per tutte le immagini
- Contrasto sufficiente per elementi testuali
- Struttura semantica corretta

### Manutenibilità
- Nomi file descrittivi
- Struttura SVG pulita e commentata
- Documentazione aggiornata

## Prossimi Sviluppi

### Grafiche da Aggiungere
- Icone per diversi tipi di task (video, quiz, documento)
- Animazioni SVG per feedback utente
- Illustrazioni per stati vuoti
- Icone per livelli di difficoltà

### Miglioramenti
- Animazioni CSS per le grafiche
- Tema scuro per le icone
- Varianti per diversi stati (hover, active, disabled) 