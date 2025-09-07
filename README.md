# Progetto Programmazione Avanzata Anno Accademico 2024-2025
<div align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/Digital_Historical_Products.png" alt="Logo">
</div>

# Indice
- [🎯 Obiettivo del progetto]
- [⚙️ Setup e installazione]
- [🧩 Progettazione]
    - [🏗️ Architettura]
    - [👤 Diagramma dei casi d'uso]
    - [🗄 Diagramma E-R]
    - [📐 Pattern Utilizzati]
    - [↔️ Diagrammi delle sequenze]
- [🌐 Rotte API]
- [📝 Scelte implementative]
- [🛠️ Strumenti utilizzati]
- [👨‍💻 Autori]

---

## Obiettivo

L’obiettivo del progetto è lo sviluppo di un **sistema back-end per la gestione e la distribuzione di beni digitali storici** (immagini e video relativi a manoscritti, cartografie, documenti d’archivio, ecc.).  
Il sistema consente agli utenti autenticati di **acquistare, scaricare e regalare beni digitali** oltre a permettere la gestione dei token per l'acquisto dei beni (credito residuo e ricarica token).

Le principali funzionalità previste dal backend includono:

- **Gestione catalogo beni digitali**: caricamento da parte dell’amministratore e consultazione libera con filtri su tipologia, anno e formato.
- **Acquisto beni**: pagamento tramite token e generazione di un link univoco per il download in un formato a scelta, con applicazione automatica di una filigrana.
- **Gestione download**: link valido per un solo utilizzo, possibilità di richiederne uno nuovo a costo ridotto.
- **Regali digitali**: possibilità di donare un bene ad un altro utente, con generazione di un link aggiuntivo.
- **Acquisti multipli**: supporto al download in formato compresso `.zip`, con filigrana applicata ad ogni contenuto incluso.
- **Storico acquisti**: consultabile dall’utente in formato JSON o PDF, distinto per tipologia (standard, aggiuntivi, regali).
- **Gestione crediti**: ogni utente dispone di un saldo in token, ricaricabile dall’amministratore.

Il progetto è sviluppato in **TypeScript** utilizzando **Node.js, Express e Sequelize** e **PostgreSQL** come RDBMS. Prevede inoltre l’impiego di librerie esterne per la gestione dei formati multimediali e della filigrana.

---

## Setup e installazione

Per l'installazione e la configurazione del progetto è necessario avere installati [Docker](https://www.docker.com/) e [docker-compose](https://docs.docker.com/compose/).

Successivamente, bisogna clonare il repository e avviare i servizi. Ecco i comandi da eseguire nel terminale:

```bash
# Clona il repository
git clone https://github.com/matteorisolo/ProgettoPA

# Entra nella cartella del progetto
cd ProgettoPA

# Copia il file di configurazione '.env' nella directory principale
# (Assicurati di impostare correttamente le variabili)

# Avvia il progetto tramite Docker Compose
docker-compose up --build
```

Una volta avviato, il sistema sarà disponibile all'indirizzo: http://127.0.0.1:3000. Le rotte API possono essere testate utilizzando Postman con la collection fornita nella repository.

---

## Progettazione

### Architettura

Il sistema adotta un'architettura **client-server** su più livelli:

```mermaid
flowchart TD
    %% Utente
    A[Utente] -->|Richiesta HTTP (GET/POST)| B[API Server (Express)]

    %% API Server
    subgraph B_layer[API Server (Express)]
        B1[Autenticazione JWT]
        B2[Validazione richieste]
        B3[Rotte e Controller]
    end
    B --> B_layer

    %% Backend
    subgraph C_layer[Backend (Node.js + Services)]
        C1[Logica applicativa: acquisti, regali, token]
        C2[Gestione immagini/video + filigrana]
        C3[Generazione PDF e ZIP]
    end
    B_layer --> C_layer

    %% Database
    subgraph D_layer[Database (PostgreSQL via Sequelize)]
        D1[Persistenza beni digitali]
        D2[Storico acquisti e token]
    end
    C_layer --> D_layer

    %% Risposta
    D_layer -->|Risposta JSON o file| B_layer
    B_layer -->|Risposta HTTP| A
```