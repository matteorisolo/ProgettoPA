# Progetto Programmazione Avanzata Anno Accademico 2024-2025
<div align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/Digital_Historical_Products.png" alt="Logo">
</div>

# Indice
- [🎯 Obiettivo del progetto](#obiettivo)
- [⚙️ Setup e installazione](#setup-e-installazione)
- [🧩 Progettazione](#progettazione)
    - [🏗️ Architettura](#architettura)
    - [👤 Diagramma dei casi d'uso](#diagramma-dei-casi-duso)
    - [🗄 Diagramma E-R](#diagramma-e-r)
    - [📐 Pattern Utilizzati](#pattern-utilizzati)
    - [↔️ Diagrammi delle sequenze](#diagrammi-delle-sequenze)
- [🌐 Rotte API](#rotte-api)
- [📝 Scelte implementative](#scelte-implementative)
- [🛠️ Strumenti utilizzati](#strumenti-utilizzati)
- [👨‍💻 Autori](#autori)

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
flowchart TB
    A[👨‍💻<br>Utente] -->|Richiesta HTTP<br>GET/POST| B_Group

    subgraph B_Group[ ]
        direction TB
        B_Title[<b>🔄 API SERVER EXPRESS</b>]
        B1[🔐 Autenticazione JWT]
        B2[✓ Validazione richieste]
        B3[🛣️ Rotte e Controller]
    end

    B_Group -->|📋 Dati validati| C_Group

    subgraph C_Group[ ]
        direction TB
        C_Title[<b>⚙️ BACKEND</b>]
        C1[💰 Gestione acquisti, regali, token]
        C2[🖼️ Elaborazione immagini/video + filigrana]
        C3[📄 Generazione PDF e ZIP]
    end
    
    C_Group -->|🗃️ Query dati| D_Group

    subgraph D_Group[ ]
        direction TB
        D_Title[<b>💾 DATABASE</b>]
        D1[🗄️ Beni digitali]
        D2[📊 Storico acquisti e token]
    end
    
    D_Group -->|📊 Risultati query| C_Group
    C_Group -->|📦 Risposta elaborata| B_Group
    B_Group -->|📨 Risposta HTTP| A

    %% Stili per nascondere i bordi dei titoli
    style B_Title fill:none,stroke:none
    style C_Title fill:none,stroke:none
    style D_Title fill:none,stroke:none
    
    %% Stili per i box principali (ridotti di altezza)
    class B_Group,C_Group,D_Group fill:#f9f9f9,stroke:#333,stroke-width:2px,height:40px
    class A fill:#e1f5fe,stroke:#01579b,stroke-width:2px,height:20px

    %% Titoli più grandi
    style B_Title font-size:22px
    style C_Title font-size:22px
    style D_Title font-size:22px

    %% Elementi interni più piccoli
    style B1 font-size:14px
    style B2 font-size:14px
    style B3 font-size:14px
    style C1 font-size:14px
    style C2 font-size:14px
    style C3 font-size:14px
    style D1 font-size:14px
    style D2 font-size:14px
    style A font-size:18px
    
    %% Testi frecce più piccoli
    linkStyle default stroke-width:1px,font-size:14px
```

Nel dettaglio:
- **Utente**: 
  - Autenticato tramite **JWT**.
  - Può effettuare richieste per:
    - Consultare catalogo beni digitali.
    - Acquistare beni singoli o multipli.
    - Scaricare prodotti con link unico.
    - Richiedere filigrane e download aggiuntivi.
    - Effettuare regali digitali.

- **API Server (Express.js)**:
  - Gestisce le **rotte REST** e le validazioni.
  - Controlla autenticazione e autorizzazione tramite middleware.
  - Smista le richieste verso i servizi del backend.

- **Backend (Node.js)**:
  - Gestisce la **logica applicativa**:
    - Controllo credito token.
    - Creazione di acquisti e download.
    - Applicazione filigrane su immagini e video.
    - Generazione di link univoci e ZIP per acquisti multipli.
    - Preparazione di PDF e JSON per lo storico acquisti.
  - Interagisce con i repository per il database.

- **Database (PostgreSQL via Sequelize)**:
  - Memorizza:
    - Utenti, ruoli e token disponibili.
    - Prodotti digitali e metadati.
    - Acquisti, download e link univoci.
  - Garantisce persistenza e integrità dei dati.

La struttura delle cartelle riflette l’architettura multilayer del progetto, garantendo separazione delle responsabilità e manutenibilità:
```bash
ProgettoPA
├── backend
│   ├── fonts                   # font utilizzati per la generazione della filigrana
│   ├── src
│   │   ├── controllers         # gestiscono le richieste HTTP e orchestrano i servizi
│   │   ├── dao                 # data access objects, logica diretta di accesso ai dati
│   │   ├── enums               # enumerazioni centralizzate (ruoli, tipi di acquisto, ecc.)
│   │   ├── middlewares         # middleware Express (autenticazione JWT, validazioni, error handling)
│   │   ├── models              # definizione dei modelli Sequelize
│   │   ├── repositories        # livello di persistenza, astrazione sul database
│   │   ├── routes              # definizione delle rotte e collegamento ai controller
│   │   ├── services            # logica applicativa (gestione acquisti, generazione file, ecc.)
│   │   ├── utils               # funzioni di utilità (generazione PDF, gestione errori, utils JWT, connessione al db)
│   │   ├── app.ts              # configurazione Express (middleware, rotte, ecc.)
│   │   └── server.ts           # entrypoint per avvio del server
│   ├── Dockerfile
│   ├── eslint.config.mjs       # configurazione linting
│   ├── package-lock.json
│   ├── package.json
│   └── tsconfig.json
├── db
│   └── init.sql                # script iniziale per creazione schema e seed del database
├── images                      # risorse statiche o immagini di documentazione
├── collection                  # Postman collection per testare le API
├── docker-compose.yml          # orchestrazione dei container (backend, e db)
├── README.md
├── LICENSE
```

Nel dettaglio:
- **controllers** → gestiscono le richieste HTTP e orchestrano i servizi.  
- **routes** → mappano gli endpoint verso i rispettivi controller.  
- **middlewares** → centralizzano la gestione di autenticazione, validazioni e gestione errori.  
- **services** → implementano la logica applicativa (acquisti, download, regali, generazione file).  
- **dao** e **repositories** → separano l’accesso ai dati dalla logica di business.  
- **models** → definiscono le entità e relazioni tramite Sequelize.  
- **utils** → forniscono funzionalità trasversali.  
- **fonts** → raccoglie i font utilizzati per la generazione della filigrana.  
- **app.ts** e **server.ts** → gestiscono rispettivamente la configurazione dell’applicazione Express e l’avvio del server.

Altre directory:
- **db** → contiene lo script SQL di inizializzazione del database.  
- **collection** → include la Postman Collection per testare le API.  
- **docker-compose.yml** → gestione dei container per backend e database.

---

### Diagramma dei casi d'uso

Il sistema prevede tre attori principali:

- **👤 Utente Non Autenticato**: può esclusivamente consultare il catalogo dei beni disponibili.  
- **👤 Utente Registrato**: può autenticarsi e accedere a tutte le funzionalità di acquisto, download e gestione del proprio credito.  
- **👑 Amministratore**: ha privilegi avanzati per la gestione del catalogo e del credito utenti, oltre alle funzionalità comuni agli utenti.

#### Casi d’uso principali

- **Utente non autenticato**  
  - Visualizzare i beni disponibili.

- **Utente registrato**  
  - Effettuare login.  
  - Acquistare un bene digitale *(con validazione del pagamento)*.  
  - Scaricare un bene acquistato *(con applicazione della filigrana)*.  
  - Richiedere un nuovo link di download.  
  - Visualizzare lo storico acquisti.  
  - Effettuare acquisti multipli con generazione di un archivio ZIP.  
  - Regalare un bene digitale *(indicando l’email del destinatario)*.  
  - Consultare il proprio credito residuo.

- **Amministratore**  
  - Caricare nuovi beni digitali nel catalogo.  
  - Ricaricare il credito di un utente.  
  - Accedere alle funzionalità comuni di visualizzazione catalogo e gestione credito.

#### Relazioni di inclusione

Alcuni casi d’uso includono sotto-funzionalità specifiche:  
- L’acquisto richiede la **validazione del pagamento**.  
- Il download comporta l’**applicazione della filigrana** al bene digitale.  
- Gli acquisti multipli comportano la **generazione di un archivio ZIP**.

Il diagramma seguente illustra graficamente gli attori, i casi d’uso e le relative relazioni di inclusione:

```mermaid
flowchart TD
    %% Attori
    Anon[👤 Utente Non Autenticato]
    U[👤 Utente Registrato]
    A[👑 Amministratore]

    %% Layout ordinato per righe
    Anon --> UC1[Visualizzare beni disponibili]
    U --> UC1
    A --> UC1

    U --> UC2[Effettuare login]
    U --> UC3[Acquistare bene digitale]
    U --> UC4[Scaricare bene acquistato]
    U --> UC5[Richiedere nuovo link]
    U --> UC6[Visualizzare acquisti]
    U --> UC7[Acquisti multipli ZIP]
    U --> UC8[Regalare bene]
    U --> UC9[Visualizzare credito]

    A --> UC10[Caricare nuovi beni]
    A --> UC11[Ricaricare credito utente]
    A --> UC2
    A --> UC9

    %% Relazioni di inclusione (separate) - RIMOSSO Invio email
    UC3 --> ValPag[Validazione pagamento]
    UC4 --> ApplFil[Applicazione filigrana]
    UC7 --> GenZip[Generazione ZIP]

    %% Stili per chiarire le relazioni - CORRETTE
    linkStyle 0 stroke:green,stroke-width:2px
    linkStyle 1 stroke:blue,stroke-width:2px
    linkStyle 2 stroke:red,stroke-width:2px
    linkStyle 3,4,5,6,7,8,9,10 stroke:blue,stroke-width:2px
    linkStyle 11,12 stroke:red,stroke-width:2px
    linkStyle 13,14 stroke:orange,stroke-width:2px
    linkStyle 15,16,17 stroke:purple,stroke-width:2px,dashed

    classDef anon fill:#e8f5e9,stroke:#2e7d32
    classDef user fill:#e3f2fd,stroke:#1565c0
    classDef admin fill:#fce4ec,stroke:#c2185b
    classDef useCase fill:#f5f5f5,stroke:#424242
    classDef include fill:#fff3e0,stroke:#ef6c00

    class Anon anon
    class U user
    class A admin
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11 useCase
    class ValPag,ApplFil,GenZip include
```

---

### DIagramma E-R

Il diagramma E-R mostra la struttura dei dati principali del sistema e le relazioni tra di essi.

- Gli **utenti** rappresentano le persone che utilizzano il sistema, con ruoli differenti (utente normale o amministratore). Gli utenti hanno un saldo di token che viene aggiornato in base agli acquisti e alle ricariche.

- I **prodotti** sono i beni digitali disponibili, come immagini e video storici. La scelta di utilizzare **enum** per tipo di prodotto e formato consente di limitare i valori possibili e mantenere la coerenza dei dati. Il campo `path` indica il percorso fisico del file sul server, necessario per recuperare e servire correttamente il bene.

- Gli **acquisti** registrano le transazioni degli utenti. Oltre al `buyerId`, viene salvato anche il `recipientEmail` quando il bene viene regalato: questa scelta, seppur ridondante, permette di tenere traccia dell'email del ricevente regalo, indicata al momento dell'acquisto del regalo, garantendo di conservare sempre questo riferimento anche se poi in futuro l'email dovesse cambiare. L’enum `type` distingue tra acquisti standard, download aggiuntivi e regali.

- I **download** gestiscono i link univoci per scaricare i prodotti. Anche se più download possono avere lo stesso `download_url` (come nel caso di acquisti multipli (bundle)), la ridondanza viene accettata per semplicità e per soddisfare le regole del programma, evitando di dover creare una tabella separata tipo “lista acquisti” per gestire una relazione molti-a-molti, considerato anche che la funzionalità degli acquisti in bundle, per il tipo di servizio che il backend offre (beni storici digitali), probabilmente è più marginale. I download registrano chi ha utilizzato il link (buyer o recipient), se fa parte di un bundle e la scadenza del link, garantendo il controllo degli accessi e la corretta gestione dei token.

Questa struttura, seppur semplice, permette di tracciare con precisione gli acquisti, i regali e i download, mantenendo al contempo il sistema flessibile e facilmente estendibile.

```mermaid
erDiagram
    users {
        SERIAL id_user PK
        VARCHAR first_name
        VARCHAR last_name
        VARCHAR email UK
        VARCHAR password
        enum_users_role role
        FLOAT tokens
    }
    
    products {
        SERIAL id_product PK
        VARCHAR title UK
        enum_products_type type
        INT year
        enum_format_type format
        FLOAT cost
        VARCHAR path
    }
    
    purchases {
        SERIAL id_purchase PK
        INT buyer_id FK
        INT recipient_id FK
        VARCHAR recipient_email
        INT product_id FK
        enum_purchases_type type
        TIMESTAMP created_at
    }
    
    downloads {
        SERIAL id_download PK
        INT purchase_id FK
        UUID download_url
        BOOLEAN used_buyer
        BOOLEAN used_recipient
        TIMESTAMP expires_at
        TIMESTAMP created_at
        BOOLEAN is_bundle
    }

    users ||--o{ purchases : "makes"
    users ||--o{ purchases : "receives"
    products ||--o{ purchases : "purchased"
    purchases ||--o{ downloads : "generates"
```

---

### Pattern Utilizzati

Per garantire modularità, chiarezza e facilità di manutenzione, nel progetto sono stati adottati diversi design pattern. Di seguito quelli principali e i vantaggi apportati.

#### Singleton
Alcuni servizi o configurazioni devono avere un’unica istanza condivisa in tutto il sistema.  
Il pattern Singleton è stato utilizzato per garantire coerenza e accessibilità globale senza duplicare oggetti o configurazioni. Questo è il caso per esempio della classe *Database* per la connessione allo stesso che deve appunto essere unica (istanza di Sequelize).

#### Factory
Per la gestione centralizzata degli errori HTTP nel progetto è stato adottato il **pattern Factory**. L’idea principale è avere un’unica classe (la factory) che si occupa di **creare oggetti errore personalizzati** in base al contesto in cui si verifica l’errore.  

In pratica, ogni volta che nel codice si incontra una situazione anomala (ad esempio un utente non autorizzato, un acquisto non trovato, o dati non validi), si chiama la factory fornendo:  
- il **tipo di errore** (ad esempio `NotFound`, `Forbidden`, `BadRequest`),  
- un **messaggio descrittivo** che spiega il problema,  
- eventualmente altri parametri utili al logging o alla gestione interna.  

La factory genera quindi un’istanza di errore HTTP coerente, con codice e messaggio corretti, che viene poi propagata attraverso i middleware di Express fino al client.

#### COR (Chain of Responsibility)
Il **pattern Chain of Responsibility (COR)** è stato implementato principalmente attraverso i middleware di Express. In questo pattern, ogni middleware rappresenta un "anello della catena" che può decidere di **gestire la richiesta** oppure di **passarla al middleware successivo**, permettendo così un flusso modulare e flessibile.

Nel progetto, il COR è stato applicato ai seguenti casi:  
- **Autenticazione e autorizzazione JWT**: verifica se l’utente è autenticato e ha i permessi necessari. Se la richiesta non è valida, viene bloccata e restituito un errore; altrimenti, la richiesta continua lungo la catena.  
- **Validazione delle richieste**: controlla che parametri e body rispettino i vincoli previsti (es. array di prodotti, email valide, token disponibili). In caso di errori di validazione, la richiesta viene interrotta.  
- **Gestione centralizzata degli errori**: intercetta eventuali eccezioni sollevate dai middleware precedenti o dai controller, trasformandole in risposte HTTP coerenti, sfruttando la factory per la creazione degli errori.

I principali vantaggi di questo approccio sono:  
1. **Modularità**: ogni controllo è indipendente e concentrato in un unico middleware.  
2. **Estendibilità**: è possibile aggiungere nuovi controlli o modificare quelli esistenti senza toccare il resto della logica.  
3. **Pulizia del codice**: si evita la nidificazione di if complessi e la duplicazione di controlli in più punti.  
4. **Gestione centralizzata degli errori**: tutti gli errori passano attraverso uno stesso flusso, garantendo uniformità nella risposta e semplificando il logging.

In sintesi, il COR nei middleware consente di costruire una pipeline di controlli chiara, scalabile e facilmente manutenibile, adatta a gestire autenticazione, validazioni e errori in maniera coerente.

#### MVC (Model-View-Controller)
Il **pattern MVC (Model-View-Controller)** è stato implementato per organizzare l'applicazione in livelli distinti, migliorando chiarezza e manutenibilità.

- **Modelli (Model)**: definiscono le entità principali del sistema come utenti, prodotti, acquisti e download. Grazie a Sequelize, i modelli gestiscono le relazioni e le regole di integrità dei dati, senza occuparsi della logica applicativa.  

- **Controller (Controller)**: sono responsabili di coordinare le richieste HTTP e collegare i vari servizi e repository. Non eseguono query dirette al database; si limitano a orchestrare le operazioni necessarie per completare l’azione richiesta.  

- **Vista (View)**: la vista corrisponde alle risposte JSON o ai file forniti al client. Gestisce la presentazione dei dati, separandoli dalla logica di business e dall’accesso ai dati.  

Questo approccio consente di mantenere il codice:
- **Chiaro e modulare**, con responsabilità ben definite.  
- **Facile da testare**, in quanto ogni livello può essere verificato separatamente.  
- **Estendibile**, perché nuove funzionalità possono essere aggiunte senza modificare componenti esistenti.  
- **Sicuro e affidabile**, poiché la logica critica è isolata nei controller e nei servizi.

#### DAO (Data Access Object)
I DAO isolano le operazioni di accesso al database per ciascuna entità.  
Vantaggi:
- Migliorano testabilità e manutenzione.  
- Permettono di cambiare la tecnologia sottostante senza alterare la logica applicativa.

#### Repository
I Repository aggregano più DAO e gestiscono logiche applicative più complesse come orchestrazione degli acquisti, gestione dei token o elaborazione dei regali.  
Migliorano la leggibilità dei controller e mantengono la divisione dei compiti chiara.

---

L’insieme di questi pattern ha permesso di ottenere un’architettura chiara, estensibile e facilmente manutenibile, con separazione netta tra logica, accesso ai dati e gestione degli errori.

---

### Diagrammi delle sequenze

I diagrammi delle sequenze sono uno strumento della modellazione UML che mostrano come gli oggetti o componenti di un sistema interagiscono nel tempo. Di seguito i diagrammi delle sequenze per le principali rotte.

#### `POST /login` per l'autenticazione di un utente.

1. **Client** invia una richiesta HTTP al **Router** di Express con email e password.
2. Il **middleware di validazione** (`validateLogin`) verifica la correttezza del formato dell’email e la lunghezza minima della password. In caso di errore, la richiesta viene interrotta.
3. Se la validazione è corretta, il **controller** gestisce la richiesta, estraendo i dati dal body.
4. Il **service** (`AuthService`) si occupa della logica di autenticazione:
   - Recupera l’utente dal database tramite il **DAO** (`UserDao`) e **Sequelize ORM**.
   - Se l’utente non esiste, viene generato un errore HTTP 401.
   - Se l’utente esiste, la password fornita viene confrontata con quella salvata tramite **bcrypt**.
   - In caso di password non valida, viene generato un errore 401.
   - Se la password è corretta, viene generato un **JWT** che include l’ID e il ruolo dell’utente.
5. Il service costruisce l’oggetto di risposta con il token e le informazioni dell’utente (senza la password) e lo restituisce al controller.
6. Infine, il **controller** invia la risposta al client con lo status 200 e il token in caso di successo, oppure passa l’errore ai middleware di gestione degli errori in caso di fallimento.

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Validate as validateLogin Middleware
    participant Controller as login Controller
    participant Service as AuthService
    participant DAO as UserDao
    participant Sequelize as Sequelize ORM
    participant DB as Database (PostgreSQL)
    participant BCrypt as bcrypt
    participant JWT as JWT Utility

    Client->>Router: POST /login<br>{email, password}
    activate Router
    
    Router->>Validate: validateLogin middleware
    activate Validate
    Validate->>Validate: 1. Valida email<br>2. Valida password (min 6 chars)
    Validate-->>Router: Se validazione OK
    deactivate Validate
    
    Router->>Controller: login(req, res, next)
    activate Controller
    
    Controller->>Controller: Destruttura {email, password} da req.body
    
    Controller->>Service: authService.login(email, password)
    activate Service
    
    Service->>DAO: userDao.getByEmail(email)
    activate DAO
    
    DAO->>Sequelize: User.findOne({ where: { email } })
    activate Sequelize
    Sequelize->>DB: SELECT * FROM users WHERE email = ?
    activate DB
    DB-->>Sequelize: Restituisce user o null
    deactivate DB
    Sequelize-->>DAO: User model instance o null
    deactivate Sequelize
    
    alt User non trovato
        DAO-->>Service: null
        Service->>Service: Throw HttpError 401<br>"Invalid email or password"
    else User trovato
        DAO-->>Service: User model instance
        Service->>BCrypt: bcrypt.compare(password, user.password)
        activate BCrypt
        BCrypt-->>Service: true/false
        deactivate BCrypt
        
        alt Password non valida
            Service->>Service: Throw HttpError 401<br>"Invalid email or password"
        else Password valida
            Service->>JWT: generateToken({id: user.idUser, role: user.role})
            activate JWT
            JWT-->>Service: JWT Token
            deactivate JWT
            
            Service->>Service: Costruisce IAuthLoginResult<br>(token + user info senza password)
            Service-->>Controller: IAuthLoginResult
        end
    end
    
    deactivate DAO
    deactivate Service
    
    alt Successo
        Controller->>Controller: res.status(200).json({ token })
        Controller-->>Client: 200 OK + {token}
    else Errore
        Controller->>Controller: next(error)
        Controller-->>Client: Error Response (401/500)
    end
    
    deactivate Controller
    deactivate Router
```

#### `POST /products` per il caricamento di un prodotto.

Il diagramma rappresenta il flusso di creazione di un nuovo bene digitale da parte di un amministratore.  

1. **Client** invia una richiesta `POST /products` con token di autorizzazione e i dati del file (immagine o video) e metadati del prodotto (titolo, tipo, anno, formato, costo).  
2. La richiesta viene intercettata dal **Router Express**, che la inoltra al **middleware di autenticazione**. Qui il token JWT viene verificato e viene controllato che l’utente abbia ruolo `ADMIN`.  
3. Una volta autenticato, il **middleware di upload** gestisce il file, validandone il tipo e la dimensione e memorizzandolo temporaneamente in memoria.  
4. Successivamente, il **middleware di validazione** verifica che tutti i campi richiesti nel corpo della richiesta siano presenti e corretti.  
5. Il **Controller** riceve la richiesta validata e salva il file sul file system del server.  
6. Il Controller prepara i dati del prodotto e li passa al **ProductService**, che incapsula la logica di creazione del prodotto.  
7. Il **ProductDao** interagisce con Sequelize per inserire il record nel database PostgreSQL.  
8. Sequelize genera la query SQL e il database conferma la creazione del nuovo prodotto.  
9. Il DAO restituisce l’oggetto creato al Service, che lo inoltra al Controller.  
10. Infine, il Controller risponde al client con un messaggio di conferma e i dettagli del prodotto creato (`201 Created`).  

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Auth as authMiddleware + authorize
    participant Upload as uploadProduct
    participant Validate as createProductValidate
    participant Controller as createProduct Controller
    participant Service as ProductService
    participant DAO as ProductDao
    participant Sequelize as Sequelize ORM
    participant DB as Database (PostgreSQL)
    participant FS as File System

    Client->>Router: POST /products<br>Authorization: Bearer {token}<br>FormData: {file, title, type, year, format, cost}
    activate Router
    
    Router->>Auth: authMiddleware + authorize([ADMIN])
    activate Auth
    Auth->>Auth: 1. Extract & verify JWT token<br>2. Check user.role === 'admin'
    Auth-->>Router: Authentication & Authorization OK
    deactivate Auth
    
    Router->>Upload: uploadProduct.single('file')
    activate Upload
    Upload->>Upload: Validate file type (image/video)<br>Max size: 50MB<br>Store in memory
    Upload-->>Router: req.file = buffer
    deactivate Upload
    
    Router->>Validate: createProductValidate
    activate Validate
    Validate->>Validate: Validate body fields<br>(title, type, year, format, cost, file)
    Validate-->>Router: Validation OK
    deactivate Validate
    
    Router->>Controller: createProduct(req, res, next)
    activate Controller
    
    Controller->>Controller: Check req.file exists
    Controller->>FS: fs.writeFileSync(filePath, req.file.buffer)
    activate FS
    FS-->>Controller: File saved successfully
    deactivate FS
    
    Controller->>Controller: Prepare productData from req.body
    Controller->>Service: ProductService.createProduct(productData)
    activate Service
    
    Service->>DAO: productDao.create(productData)
    activate DAO
    
    DAO->>Sequelize: Product.create(productData)
    activate Sequelize
    Sequelize->>DB: INSERT INTO products (...) VALUES (...)
    activate DB
    DB-->>Sequelize: Product created
    deactivate DB
    Sequelize-->>DAO: Product model instance
    deactivate Sequelize
    
    DAO-->>Service: Created product
    deactivate DAO
    Service-->>Controller: Created product
    deactivate Service
    
    Controller->>Controller: res.status(201).json({message, product})
    Controller-->>Client: 201 Created + product details
    deactivate Controller
    deactivate Router
    
    alt Error at any step
        Note over Router,Controller: Error handling middleware<br>catches and returns appropriate error
        Controller-->>Client: Error Response (400/401/403/500)
    end
```

#### `GET /products` per il recupero della lista dei beni digitali acquistabili.

Il diagramma illustra il flusso di richiesta per ottenere l’elenco dei beni digitali, eventualmente filtrati per tipo, anno o formato.

1. Il **Client** invia una richiesta `GET /products` con parametri opzionali di filtro (`type`, `year`, `format`).  
2. La richiesta raggiunge il **Router Express**, che passa i dati al **middleware di validazione** per controllare la correttezza dei parametri.  
3. Se la validazione è superata, il **Controller** prepara i filtri da applicare e chiama il **ProductService**, che gestisce la logica di ricerca.  
4. Il Service verifica se sono stati forniti filtri:
   - **Nessun filtro:** richiama `productDao.getAll()` per recuperare tutti i prodotti dal database.  
   - **Filtri presenti:** richiama `productDao.getByFilters(filters)` per ottenere solo i prodotti corrispondenti ai criteri selezionati.  
5. Il **DAO** utilizza Sequelize per interagire con PostgreSQL, eseguendo le query necessarie (`findAll`), e restituisce al Service i risultati sotto forma di array di modelli prodotto.  
6. Il Service inoltra i dati al Controller, che costruisce la risposta JSON da inviare al client:
   - Se non ci sono prodotti corrispondenti, restituisce un messaggio indicativo e un array vuoto.  
   - Se vengono trovati prodotti, restituisce l’elenco completo insieme a un messaggio di conferma.  
7. Il **Client** riceve la risposta finale con lo status `200 OK` e la lista dei prodotti.  

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Validate as getProductsValidate
    participant Controller as getProducts Controller
    participant Service as ProductService
    participant DAO as ProductDao
    participant Sequelize as Sequelize ORM
    participant DB as Database (PostgreSQL)

    Client->>Router: GET /products?type=manuscript&year=1800&format=jpg
    activate Router
    
    Router->>Validate: getProductsValidate
    activate Validate
    Validate->>Validate: Validate query parameters<br>(type, year, format - all optional)
    Validate-->>Router: Validation OK
    deactivate Validate
    
    Router->>Controller: getProducts(req, res, next)
    activate Controller
    
    Controller->>Controller: Prepare filters from query params<br>{ type: 'manuscript', year: 1800, format: 'jpg' }
    
    Controller->>Service: ProductService.list(filters)
    activate Service
    
    Service->>Service: Check if any filter is provided
    
    alt No filters provided
        Service->>DAO: productDao.getAll()
        activate DAO
        DAO->>Sequelize: Product.findAll()
        activate Sequelize
        Sequelize->>DB: SELECT * FROM products
        activate DB
        DB-->>Sequelize: All products
        deactivate DB
        Sequelize-->>DAO: Array of Product models
        deactivate Sequelize
        DAO-->>Service: All products
        deactivate DAO
    else Filters provided
        Service->>DAO: productDao.getByFilters(filters)
        activate DAO
        DAO->>Sequelize: Product.findAll({ where: filters })
        activate Sequelize
        Sequelize->>DB: SELECT * FROM products WHERE type='manuscript' AND year=1800 AND format='jpg'
        activate DB
        DB-->>Sequelize: Filtered products
        deactivate DB
        Sequelize-->>DAO: Array of filtered Product models
        deactivate Sequelize
        DAO-->>Service: Filtered products
        deactivate DAO
    end
    
    Service-->>Controller: Products array
    deactivate Service
    
    alt No products found
        Controller->>Controller: res.status(200).json({ message: 'No products found', products: [] })
    else Products found
        Controller->>Controller: res.status(200).json({ message: 'Products retrieved', products })
    end
    
    Controller-->>Client: 200 OK + products list
    deactivate Controller
    deactivate Router
    
    alt Error at any step
        Note over Router,Controller: Error handling middleware<br>catches and returns appropriate error
        Controller-->>Client: Error Response (400/500)
    end
```

#### `GET /users/me/tokens` per il recupero del proprio credito residuo.

Questo diagramma mostra il flusso per ottenere il numero di token disponibili per l’utente autenticato.

1. Il **Client** invia una richiesta `GET /users/me/tokens` includendo il token JWT nell’header `Authorization`.  
2. La richiesta raggiunge il **Router Express**, che la inoltra al **middleware di autenticazione e autorizzazione**.  
   - Il middleware estrae e verifica il token JWT.  
   - Controlla che il ruolo dell’utente sia `USER`.  
   - In caso positivo, aggiunge le informazioni dell’utente a `req.user`.  
3. Il **Controller** estrae l’ID utente da `req.user` e chiama `AuthService.getUserById(user.id)`.  
4. Il **Service** delega al **DAO** per ottenere i dati dell’utente dal database PostgreSQL tramite Sequelize (`User.findByPk`).  
5. Se l’utente non viene trovato, viene generato un errore 404. Altrimenti, il DAO restituisce l’istanza utente completa.  
6. Il Service estrae solo i campi sicuri dell’utente, escludendo ad esempio la password, e passa i dati al Controller.  
7. Il Controller invia al **Client** una risposta `200 OK` contenente il numero di token disponibili.

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Auth as authMiddleware + authorize
    participant Controller as getMyTokens Controller
    participant Service as AuthService
    participant DAO as UserDao
    participant Sequelize as Sequelize ORM
    participant DB as Database (PostgreSQL)

    Client->>Router: GET /users/me/tokens<br>Authorization: Bearer {token}
    activate Router
    
    Router->>Auth: authMiddleware + authorize([USER])
    activate Auth
    Auth->>Auth: 1. Extract & verify JWT token<br>2. Check user.role === 'user'
    Auth-->>Router: Authentication & Authorization OK<br>req.user = {id, role}
    deactivate Auth
    
    Router->>Controller: getMyTokens(req, res, next)
    activate Controller
    
    Controller->>Controller: Extract user.id from req.user
    
    Controller->>Service: AuthService.getUserById(user.id)
    activate Service
    
    Service->>DAO: userDao.getById(userId)
    activate DAO
    
    DAO->>Sequelize: User.findByPk(userId)
    activate Sequelize
    Sequelize->>DB: SELECT * FROM users WHERE id_user = ?
    activate DB
    DB-->>Sequelize: User data
    deactivate DB
    Sequelize-->>DAO: User model instance
    deactivate Sequelize
    
    alt User not found
        DAO-->>Service: Throw HttpError 404
    else User found
        DAO-->>Service: User object with tokens
    end
    deactivate DAO
    
    Service->>Service: Extract only safe user fields<br>(exclude password)
    Service-->>Controller: User data with tokens
    deactivate Service
    
    Controller->>Controller: res.status(200).json({ message, tokens })
    Controller-->>Client: 200 OK + { tokens: number }
    deactivate Controller
    deactivate Router
    
    alt Error at any step
        Note over Router,Controller: Error handling middleware<br>catches and returns appropriate error
        Controller-->>Client: Error Response (401/403/404/500)
    end
```

#### `PATCH /users/:id/tokens` per il caricamento dei token.

Il diagramma illustra il processo di aggiornamento dei token di un utente da parte di un amministratore.

1. L’**Admin Client** invia una richiesta `PATCH /users/:id/tokens` con il token JWT nell’header `Authorization` e il numero di token da ricaricare nel body.  
2. La richiesta raggiunge il **Router Express**, che la inoltra al **middleware di autenticazione e autorizzazione**.  
   - Il middleware verifica il token JWT.  
   - Controlla che il ruolo dell’utente sia `ADMIN`.  
   - Se tutto è corretto, aggiunge le informazioni dell’admin a `req.user`.  
3. Il **middleware di validazione** controlla che:  
   - Il parametro `id` sia un intero positivo.  
   - Il campo `tokens` nel body sia un numero positivo.  
4. Il **Controller** estrae l’ID utente dai parametri e il nuovo valore di token dal body, quindi chiama `AuthService.updateTokens(userId, amount)`.  
5. Il **Service** recupera i dati dell’utente tramite il **DAO**, usando Sequelize per interrogare PostgreSQL (`User.findByPk`).  
   - Se l’utente non viene trovato, viene generato un errore 404.  
   - Altrimenti, il Service calcola il nuovo saldo dei token sommando l’attuale valore all’importo fornito.  
6. Il Service aggiorna il record utente attraverso il DAO (`User.update`) e ottiene i dati aggiornati.  
7. Infine, il Controller invia una risposta `200 OK` al client con l’ID utente e il nuovo saldo dei token.  

```mermaid
sequenceDiagram
    participant Client as Client (Frontend/Admin)
    participant Router as Express Router
    participant Auth as authMiddleware + authorize
    participant Validate as updateTokensValidate
    participant Controller as updateUserTokens Controller
    participant Service as AuthService
    participant DAO as UserDao
    participant Sequelize as Sequelize ORM
    participant DB as Database (PostgreSQL)

    Client->>Router: PATCH /users/:id/tokens<br>Authorization: Bearer {token}<br>Body: { "tokens": 50 }
    activate Router
    
    Router->>Auth: authMiddleware + authorize([ADMIN])
    activate Auth
    Auth->>Auth: 1. Extract & verify JWT token<br>2. Check user.role === 'admin'
    Auth-->>Router: Authentication & Authorization OK<br>req.user = {id, role}
    deactivate Auth
    
    Router->>Validate: updateTokensValidate
    activate Validate
    Validate->>Validate: Validate params and body<br>- param id: positive integer<br>- body tokens: positive number
    Validate-->>Router: Validation OK
    deactivate Validate
    
    Router->>Controller: updateUserTokens(req, res, next)
    activate Controller
    
    Controller->>Controller: Extract id from params, tokens from body
    
    Controller->>Service: AuthService.updateTokens(userId, amount)
    activate Service
    
    Service->>DAO: userDao.getById(userId)
    activate DAO
    DAO->>Sequelize: User.findByPk(userId)
    activate Sequelize
    Sequelize->>DB: SELECT * FROM users WHERE id_user = ?
    activate DB
    DB-->>Sequelize: User data
    deactivate DB
    Sequelize-->>DAO: User model instance
    deactivate Sequelize
    
    alt User not found
        DAO-->>Service: Throw HttpError 404
    else User found
        DAO-->>Service: User object with current tokens
    end
    deactivate DAO
    
    Service->>Service: Calculate newBalance = currentTokens + amount
    
    Service->>DAO: userDao.updateTokens(userId, newBalance)
    activate DAO
    DAO->>Sequelize: User.update({ tokens: newBalance }, { where: { idUser: userId } })
    activate Sequelize
    Sequelize->>DB: UPDATE users SET tokens = ? WHERE id_user = ?
    activate DB
    DB-->>Sequelize: Rows updated
    deactivate DB
    Sequelize-->>DAO: Updated user data
    deactivate Sequelize
    DAO-->>Service: Updated user with new tokens
    deactivate DAO
    
    Service-->>Controller: New tokens value
    deactivate Service
    
    Controller->>Controller: res.status(200).json({ message, userId, tokens })
    Controller-->>Client: 200 OK + { userId: number, tokens: number }
    deactivate Controller
    deactivate Router
    
    alt Error at any step
        Note over Router,Controller: Error handling middleware<br>catches and returns appropriate error
        Controller-->>Client: Error Response (400/401/403/404/500)
    end
```

#### `POST /purchase` per l'acquisto di uno o più beni

Il diagramma descrive il flusso di acquisto di uno o più beni (bundle) da parte di un utente autenticato, con eventuale regalo, e la generazione di un link di download univoco.

1. **Client** invia una richiesta `POST /purchase` con token di autorizzazione e payload `{ productIds, recipientEmail? }`.
2. La richiesta viene intercettata dal **Router Express**, che la inoltra ai middleware di **autenticazione** (verifica JWT) e **autorizzazione** (ruolo `USER`).
3. Superati i controlli, il **middleware di validazione** verifica struttura e coerenza dei dati (array `productIds`, eventuale `recipientEmail`).
4. Il **Controller** riceve la richiesta validata, estrae `userId`, `productIds` e l’eventuale `recipientEmail`, e avvia le verifiche preliminari:
   * Per ogni `productId`, controlla che il prodotto esista;
   * Determina il **tipo di acquisto** (`STANDARD`, `ADDITIONAL_DOWNLOAD`, `GIFT`) ed il **costo unitario** (1 token per `ADDITIONAL_DOWNLOAD`, sovrapprezzo +0.5 per `GIFT`).
5. Il **Controller** richiede ad **AuthService** i dati utente per verificare il **saldo token**; se insufficiente rispetto al **costo totale** del carrello, viene restituito errore 400.
6. In caso di saldo sufficiente, il **Controller** apre una **transazione Sequelize** e, per ciascun prodotto:
   * usa **PurchaseService** per creare il record in `purchases` e aggiornare il saldo token;
   * usa **DownloadService** per creare il record in `downloads` con `download_url` (UUID). Se è un **bundle**, il primo download genera l’URL e i successivi vengono allineati allo **stesso** `download_url` (campo `is_bundle = true`).
7. Al termine, la transazione viene **committata**. Il **Controller** risponde con `201 Created`, includendo `totalCost`, l’elenco dei `purchases` e il `downloadUrl` (unico per l’eventuale bundle).

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Auth as authMiddleware
    participant Authorize as authorize([UserRole.USER])
    participant Validate as createPurchaseValidate
    participant Controller as purchaseProduct Controller
    participant AuthService as AuthService
    participant PurchaseService as PurchaseService
    participant PurchaseRepo as purchaseRepository
    participant ProductDao as productDao
    participant UserDao as userDao
    participant PurchaseDao as purchaseDao
    participant DownloadService as DownloadService
    participant DownloadRepo as downloadRepository
    participant DB as Database (PostgreSQL)
    participant Sequelize as Sequelize Transaction

    Client->>Router: POST /purchase<br>{productIds, recipientEmail?}<br>Authorization: Bearer <token>
    activate Router
    
    Router->>Auth: authMiddleware
    activate Auth
    Auth->>Auth: Verify JWT token
    Auth-->>Router: Add user payload to req.user
    deactivate Auth
    
    Router->>Authorize: authorize([UserRole.USER])
    activate Authorize
    Authorize->>Authorize: Check if user.role === USER
    Authorize-->>Router: Authorization OK
    deactivate Authorize
    
    Router->>Validate: createPurchaseValidate
    activate Validate
    Validate->>Validate: Validate productIds array<br>Validate recipientEmail (optional)
    Validate-->>Router: Validation OK
    deactivate Validate
    
    Router->>Controller: purchaseProduct(req, res, next)
    activate Controller
    
    Controller->>Controller: Destructure {productIds, recipientEmail}<br>Get user.id from req.user
    
    loop For each productId in productIds
        Controller->>PurchaseRepo: productExists(productId)
        activate PurchaseRepo
        PurchaseRepo->>ProductDao: getById(productId)
        activate ProductDao
        ProductDao->>DB: SELECT * FROM products WHERE id_product = ?
        activate DB
        DB-->>ProductDao: Product or null
        deactivate DB
        ProductDao-->>PurchaseRepo: Product or null
        deactivate ProductDao
        PurchaseRepo-->>Controller: Product or null
        deactivate PurchaseRepo
        
        alt Product not found
            Controller->>Controller: Throw 404 Error
        else Product exists
            Controller->>PurchaseRepo: hasUserPurchasedProduct(userId, productId)
            activate PurchaseRepo
            PurchaseRepo->>PurchaseDao: getByBuyerAndProduct(userId, productId)
            activate PurchaseDao
            PurchaseDao->>DB: SELECT * FROM purchases<br>WHERE buyerId=? AND productId=?
            activate DB
            DB-->>PurchaseDao: Purchase or null
            deactivate DB
            PurchaseDao-->>PurchaseRepo: Purchase or null
            deactivate PurchaseDao
            PurchaseRepo-->>Controller: boolean (true/false)
            deactivate PurchaseRepo
            
            Controller->>Controller: Determine purchaseType<br>(STANDARD/ADDITIONAL_DOWNLOAD/GIFT)
            Controller->>Controller: Calculate cost for this product
        end
    end
    
    Controller->>AuthService: getUserById(userId)
    activate AuthService
    AuthService->>UserDao: getById(userId)
    activate UserDao
    UserDao->>DB: SELECT * FROM users WHERE id_user = ?
    activate DB
    DB-->>UserDao: User object
    deactivate DB
    UserDao-->>AuthService: User object
    deactivate UserDao
    AuthService-->>Controller: User object with tokens
    deactivate AuthService
    
    alt Insufficient tokens
        Controller->>Controller: Throw 400 Error
    else Sufficient tokens
        Controller->>Sequelize: Begin transaction
        
        loop For each productId in productIds
            Controller->>PurchaseService: createPurchase(purchaseData)
            activate PurchaseService
            PurchaseService->>PurchaseService: Calculate final cost<br>Validate gift recipient
            PurchaseService->>PurchaseDao: create(purchaseData, transaction)
            activate PurchaseDao
            PurchaseDao->>DB: INSERT INTO purchases<br>RETURNING id_purchase
            activate DB
            DB-->>PurchaseDao: New purchase ID
            deactivate DB
            PurchaseDao-->>PurchaseService: Purchase object
            deactivate PurchaseDao
            
            PurchaseService->>UserDao: updateTokens(buyerId, newBalance, transaction)
            activate UserDao
            UserDao->>DB: UPDATE users SET tokens = ?<br>WHERE id_user = ?
            activate DB
            DB-->>UserDao: Rows updated
            deactivate DB
            UserDao-->>PurchaseService: Updated user
            deactivate UserDao
            
            PurchaseService-->>Controller: purchaseId
            deactivate PurchaseService
            
            Controller->>DownloadService: createDownload(downloadData)
            activate DownloadService
            DownloadService->>DownloadService: Generate downloadUrl (UUID)
            DownloadService->>DownloadRepo: create(downloadData)
            activate DownloadRepo
            DownloadRepo->>DB: INSERT INTO downloads
            activate DB
            DB-->>DownloadRepo: New download
            deactivate DB
            DownloadRepo-->>DownloadService: Download object
            deactivate DownloadRepo
            DownloadService-->>Controller: Download object with downloadUrl
            deactivate DownloadService
            
            alt Not first product in bundle
                Controller->>DownloadRepo: updateDownloadUrl(downloadId, bundleUrl)
                activate DownloadRepo
                DownloadRepo->>DB: UPDATE downloads SET download_url = ?<br>WHERE id_download = ?
                activate DB
                DB-->>DownloadRepo: Rows updated
                deactivate DB
                DownloadRepo-->>Controller: Updated download
                deactivate DownloadRepo
            end
        end
        
        Controller->>Sequelize: Commit transaction
    end
    
    alt Success
        Controller->>Controller: res.status(201).json({<br>message, totalCost,<br>purchases, downloadUrl<br>})
        Controller-->>Client: 201 Created + purchase details
    else Error
        Controller->>Controller: next(error)
        Controller-->>Client: Error Response
    end
    
    deactivate Controller
    deactivate Router

```

#### `GET /purchases` per lo storico acquisti

Il diagramma illustra il flusso con cui un utente autenticato recupera lo storico dei propri acquisti, scegliendo il formato di output (JSON o PDF).

1. **Client** invia una richiesta `GET /purchases?format=pdf/json` con token di autenticazione.  
2. Il **Router Express** passa la richiesta al middleware di **autenticazione** (verifica JWT) e di **autorizzazione** (solo ruolo `USER`).  
3. Il middleware di **validazione** controlla il parametro opzionale `format` (può essere `json` o `pdf`, altrimenti default `json`).  
4. Il **Controller** estrae l’id utente dal token e inoltra la richiesta al **purchaseRepository** per ottenere lo storico acquisti.  
5. Il **Repository** interroga i DAO per raccogliere i dati:  
   - **PurchaseDao** recupera gli acquisti dal database,  
   - per ogni acquisto viene arricchito il dettaglio prodotto tramite **ProductDao**,  
   - se presente un destinatario regalo, viene caricato anche tramite **UserDao**.  
6. Il Repository costruisce la lista di `IPurchaseListAttributes` e la restituisce al Controller.  
7. Il **Controller** raggruppa gli acquisti per tipologia (`STANDARD`, `GIFT`, `ADDITIONAL_DOWNLOAD`).  
8. In base al formato richiesto:  
   - **JSON** (default): risposta `200 OK` con la lista raggruppata,  
   - **PDF**: viene invocato il **PDF Generator**, che produce un file con lo storico, inviato come allegato nella risposta.  

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Auth as authMiddleware
    participant Authorize as authorize([UserRole.USER])
    participant Validate as getPurchasesValidate
    participant Controller as getUserPurchases Controller
    participant PurchaseRepo as purchaseRepository
    participant PurchaseDao as purchaseDao
    participant ProductDao as productDao
    participant UserDao as userDao
    participant DB as Database (PostgreSQL)
    participant PDF as PDF Generator

    Client->>Router: GET /purchases?format=pdf/json<br>Authorization: Bearer <token>
    activate Router
    
    Router->>Auth: authMiddleware
    activate Auth
    Auth->>Auth: Verify JWT token
    Auth-->>Router: Add user payload to req.user
    deactivate Auth
    
    Router->>Authorize: authorize([UserRole.USER])
    activate Authorize
    Authorize->>Authorize: Check if user.role === USER
    Authorize-->>Router: Authorization OK
    deactivate Authorize
    
    Router->>Validate: getPurchasesValidate
    activate Validate
    Validate->>Validate: Validate format query parameter<br>(optional: 'json' or 'pdf')
    Validate-->>Router: Validation OK
    deactivate Validate
    
    Router->>Controller: getUserPurchases(req, res, next)
    activate Controller
    
    Controller->>Controller: Get user.id from req.user<br>Get format from req.query (default 'json')
    
    Controller->>PurchaseRepo: getUserHistory(user.id)
    activate PurchaseRepo
    
    PurchaseRepo->>PurchaseDao: getByFilters({ buyerId: userId })
    activate PurchaseDao
    PurchaseDao->>DB: SELECT * FROM purchases<br>WHERE buyerId = ?<br>ORDER BY createdAt DESC
    activate DB
    DB-->>PurchaseDao: List of purchases
    deactivate DB
    PurchaseDao-->>PurchaseRepo: Purchase[]
    deactivate PurchaseDao
    
    loop For each purchase in list
        PurchaseRepo->>ProductDao: getById(purchase.productId)
        activate ProductDao
        ProductDao->>DB: SELECT * FROM products WHERE id_product = ?
        activate DB
        DB-->>ProductDao: Product details
        deactivate DB
        ProductDao-->>PurchaseRepo: Product object
        deactivate ProductDao
        
        alt purchase has recipientId
            PurchaseRepo->>UserDao: getById(purchase.recipientId)
            activate UserDao
            UserDao->>DB: SELECT * FROM users WHERE id_user = ?
            activate DB
            DB-->>UserDao: User details
            deactivate DB
            UserDao-->>PurchaseRepo: User object (no password)
            deactivate UserDao
        else No recipientId
            PurchaseRepo->>PurchaseRepo: recipient = null
        end
        
        PurchaseRepo->>PurchaseRepo: Build IPurchaseListAttributes
    end
    
    PurchaseRepo-->>Controller: IPurchaseListAttributes[]
    deactivate PurchaseRepo
    
    Controller->>Controller: Group purchases by type<br>(STANDARD, GIFT, ADDITIONAL_DOWNLOAD)
    
    alt format === 'pdf'
        Controller->>PDF: generatePDF(user.id, groupedPurchases)
        activate PDF
        PDF->>PDF: Create PDF buffer with purchase history
        PDF-->>Controller: PDF buffer
        deactivate PDF
        
        Controller->>Controller: Set PDF response headers
        Controller->>Client: 200 OK + PDF attachment
    else format === 'json' (default)
        Controller->>Client: 200 OK + JSON grouped purchases
    end
    
    deactivate Controller
    deactivate Router
```

#### `GET /downloads/:downloadUrl` per il download di uno o più beni digitali

Il diagramma descrive il processo con cui un utente autenticato scarica un bene digitale precedentemente acquistato, eventualmente in formato bundle (ZIP) e con possibilità di conversione nel formato richiesto.

1. **Client** invia una richiesta `GET /downloads/:downloadUrl?outputFormat=<format>` con token di autenticazione.  
2. Il **Router Express** passa la richiesta ai middleware:  
   - **authMiddleware**: verifica il token JWT e arricchisce la request con i dati utente,  
   - **authorize([USER])**: controlla che l’utente abbia ruolo `USER`,  
   - **downloadValidate**: valida `downloadUrl` (UUID) e `outputFormat` (opzionale).  
3. Il **Controller** recupera i parametri e interroga l’**AuthService** per ottenere i dettagli dell’utente (inclusa l’email).  
4. Tramite il **downloadRepository** si ottiene la lista dei download associati a quell’URL:  
   - Se nessun record è trovato → errore `404 Not Found`,  
   - Se il link è scaduto → errore `400 Bad Request`.  
5. Per ogni download (singolo o bundle), il **purchaseRepository** ricostruisce i dettagli dell’acquisto: prodotto, buyer e, se presente, recipient del regalo.  
6. Il Controller verifica che l’utente sia **autorizzato** (buyer o destinatario del regalo) e che non abbia già utilizzato quel download:  
   - Se non autorizzato → errore `403 Forbidden`,  
   - Se già usato → errore `400 Bad Request`.  
7. Se autorizzato, la logica viene delegata al **DownloadService**:  
   - **Caso singolo prodotto**: recupera i dettagli del file dal DB e dal file system; applica filigrana e conversione con **ImageMagick** (immagini) o **FFmpeg** (video).  
   - **Caso bundle**: ogni file viene processato (filigrana + conversione) e infine compresso in un archivio con **Archiver (ZIP)**.  
8. Il download viene **marcato come utilizzato** nel database, per evitare ulteriori accessi.  
9. Il Controller invia al Client il file generato (immagine, video o ZIP) con intestazioni corrette, gestendo anche la pulizia dei file temporanei.  

```mermaid
sequenceDiagram
    participant Client as Client (Frontend)
    participant Router as Express Router
    participant Auth as authMiddleware
    participant Authorize as authorize([UserRole.USER])
    participant Validate as downloadValidate
    participant Controller as getDownload Controller
    participant AuthService as AuthService
    participant DownloadRepo as downloadRepository
    participant PurchaseRepo as purchaseRepository
    participant DownloadService as DownloadService
    participant PurchaseDao as purchaseDao
    participant ProductDao as productDao
    participant DB as Database (PostgreSQL)
    participant ImageMagick as ImageMagick
    participant FFmpeg as FFmpeg
    participant Archiver as Archiver (ZIP)
    participant FileSystem as File System

    Client->>Router: GET /downloads/:downloadUrl?outputFormat=<format><br>Authorization: Bearer <token>
    activate Router
    
    Router->>Auth: authMiddleware
    activate Auth
    Auth->>Auth: Verify JWT token
    Auth-->>Router: Add user payload to req.user
    deactivate Auth
    
    Router->>Authorize: authorize([UserRole.USER])
    activate Authorize
    Authorize->>Authorize: Check if user.role === USER
    Authorize-->>Router: Authorization OK
    deactivate Authorize
    
    Router->>Validate: downloadValidate
    activate Validate
    Validate->>Validate: Validate downloadUrl (UUID)<br>Validate outputFormat (optional)
    Validate-->>Router: Validation OK
    deactivate Validate
    
    Router->>Controller: getDownload(req, res, next)
    activate Controller
    
    Controller->>Controller: Extract downloadUrl from params<br>Extract outputFormat from query
    
    Controller->>AuthService: getUserById(authUser.id)
    activate AuthService
    AuthService->>DB: SELECT * FROM users WHERE id_user = ?
    activate DB
    DB-->>AuthService: User details with email
    deactivate DB
    AuthService-->>Controller: User email
    deactivate AuthService
    
    Controller->>DownloadRepo: getAllByUrl(downloadUrl)
    activate DownloadRepo
    DownloadRepo->>DB: SELECT * FROM downloads WHERE download_url = ?
    activate DB
    DB-->>DownloadRepo: Download[] or empty
    deactivate DB
    DownloadRepo-->>Controller: Download[] or null
    deactivate DownloadRepo
    
    alt No downloads found
        Controller->>Controller: Throw 404 Error
    else Downloads found
        Controller->>DownloadRepo: isExpired(downloadUrl)
        activate DownloadRepo
        DownloadRepo->>DB: Check expiresAt for downloadUrl
        activate DB
        DB-->>DownloadRepo: expiresAt timestamp
        deactivate DB
        DownloadRepo-->>Controller: boolean (expired/not)
        deactivate DownloadRepo
        
        alt Download expired
            Controller->>Controller: Throw 400 Error
        else Download valid
            loop For each download in bundle
                Controller->>PurchaseRepo: getDetailsById(download.purchaseId)
                activate PurchaseRepo
                PurchaseRepo->>PurchaseDao: getById(purchaseId)
                activate PurchaseDao
                PurchaseDao->>DB: SELECT * FROM purchases WHERE id_purchase = ?
                activate DB
                DB-->>PurchaseDao: Purchase details
                deactivate DB
                PurchaseDao-->>PurchaseRepo: Purchase object
                deactivate PurchaseDao
                
                PurchaseRepo->>ProductDao: getById(purchase.productId)
                activate ProductDao
                ProductDao->>DB: SELECT * FROM products WHERE id_product = ?
                activate DB
                DB-->>ProductDao: Product details
                deactivate DB
                ProductDao-->>PurchaseRepo: Product object
                deactivate ProductDao
                
                PurchaseRepo->>UserDao: getById(purchase.buyerId)
                activate UserDao
                UserDao->>DB: SELECT * FROM users WHERE id_user = ?
                activate DB
                DB-->>UserDao: Buyer details
                deactivate DB
                UserDao-->>PurchaseRepo: Buyer object
                deactivate UserDao
                
                alt purchase has recipientId
                    PurchaseRepo->>UserDao: getById(purchase.recipientId)
                    activate UserDao
                    UserDao->>DB: SELECT * FROM users WHERE id_user = ?
                    activate DB
                    DB-->>UserDao: Recipient details
                    deactivate DB
                    UserDao-->>PurchaseRepo: Recipient object
                    deactivate UserDao
                end
                
                PurchaseRepo-->>Controller: Purchase details with product, buyer, recipient
                deactivate PurchaseRepo
            end
            
            Controller->>Controller: Check user authorization<br>(isBuyer or isRecipient)
            alt User not authorized
                Controller->>Controller: Throw 403 Error
            else User authorized
                Controller->>Controller: Check if download already used<br>by this user
                alt Download already used
                    Controller->>Controller: Throw 400 Error
                else Download available
                    Controller->>DownloadService: processDownload(downloadUrl, isBuyer, outputFormat)
                    activate DownloadService
                    
                    DownloadService->>DownloadRepo: getAllByUrl(downloadUrl)
                    activate DownloadRepo
                    DownloadRepo->>DB: Get all downloads with this URL
                    activate DB
                    DB-->>DownloadRepo: Download[]
                    deactivate DB
                    DownloadRepo-->>DownloadService: Download[]
                    deactivate DownloadRepo
                    
                    alt Single product (not bundle)
                        DownloadService->>PurchaseDao: getById(download.purchaseId)
                        activate PurchaseDao
                        PurchaseDao->>DB: Get purchase details
                        activate DB
                        DB-->>PurchaseDao: Purchase
                        deactivate DB
                        PurchaseDao-->>DownloadService: Purchase
                        deactivate PurchaseDao
                        
                        DownloadService->>ProductDao: getById(purchase.productId)
                        activate ProductDao
                        ProductDao->>DB: Get product details
                        activate DB
                        DB-->>ProductDao: Product with file path
                        deactivate DB
                        ProductDao-->>DownloadService: Product
                        deactivate ProductDao
                        
                        DownloadService->>FileSystem: Check if original file exists
                        activate FileSystem
                        FileSystem-->>DownloadService: File exists/not
                        deactivate FileSystem
                        
                        alt Image file
                            DownloadService->>ImageMagick: Watermark and convert image
                            activate ImageMagick
                            ImageMagick-->>DownloadService: Watermarked file path
                            deactivate ImageMagick
                        else Video file
                            DownloadService->>FFmpeg: Watermark video
                            activate FFmpeg
                            FFmpeg-->>DownloadService: Watermarked video path
                            deactivate FFmpeg
                        end
                        
                        DownloadService->>DB: Transaction - mark download as used
                        activate DB
                        DB-->>DownloadService: Update successful
                        deactivate DB
                    else Bundle of products
                        DownloadService->>Archiver: Create ZIP archive with watermarked files
                        activate Archiver
                        Archiver-->>DownloadService: ZIP file path
                        deactivate Archiver
                        
                        DownloadService->>DB: Transaction - mark all bundle downloads as used
                        activate DB
                        DB-->>DownloadService: Update successful
                        deactivate DB
                    end
                    
                    DownloadService-->>Controller: {filePath, fileName, contentType}
                    deactivate DownloadService
                    
                    Controller->>Client: Send file with appropriate headers
                    Controller->>FileSystem: Cleanup temporary files (after send)
                end
            end
        end
    end
    
    alt Error occurred
        Controller->>Controller: next(error)
        Controller-->>Client: Error Response
    end
    
    deactivate Controller
    deactivate Router
```

## Rotte API

Le rotte API costituiscono l’interfaccia attraverso la quale gli utenti e l’amministratore interagiscono con il sistema. Oltre alle rotte di autenticazione (login) e a quelle che consentono di ottenere il prodotto acquistato, sono disponibili endpoint aggiuntivi per la gestione completa del dominio applicativo: creazione e visualizzazione dei prodotti digitali, gestione dei download e tracciamento delle transazioni. In questo modo l’API fornisce tutti gli strumenti necessari per supportare il ciclo di vita degli acquisti e garantire il corretto accesso ai beni digitali. 

### Login ('/login')
- `POST /login` – Rotta che mostra la corretta autenticazione di un utente 

*Richiesta Body/Query*
```json
{
    "email": "mario.rossi@example.com",
    "password": "mario123"
}
```
*Risposta:*
```json
{
     "token": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTcyNTY1MDQsImV4cCI6MTc1NzI2MDEwNH0.uXhRg8Y1ZHKB0uZSNE6TGDNVFkRISsu4CPGX2GhQTw8",
        "user": {
            "idUser": 2,
            "firstName": "Mario",
            "lastName": "Rossi",
            "email": "mario.rossi@example.com",
            "role": "user",
            "tokens": 20
        }
    }
}
```

### Products ('/products')
- `POST /products` – Rotta che mostra il corretto inserimento di un prodotto da parte dell'admin

*Richiesta Body/Query*

```bash
Authorization: Bearer {adminToken}
```
```json
{
    "title": "Medieval Manuscript",
    "type": "manuscript",
    "year": 1250,
    "format": "jpg",
    "cost": 3,
    "file": "medieval_manuscript.jpg"
}
```

*Risposta:*
```json
{
    "message": "Product created successfully",
    "product": {
        "idProduct": 7,
        "title": "Medieval Manuscript",
        "type": "manuscript",
        "year": 1250,
        "format": "jpg",
        "cost": 3,
        "path": "/usr/src/app/uploads/1757258883319-medieval_manuscript.jpg"
    }
}
```

- `GET /products` – Rotta che mostra correttamente tutti i prodotti presenti

*Richiesta Body/Query*

```bash
Authorization: Bearer No Auth
```
*Risposta:*
```json
{
    "message": "Products retrieved successfully",
    "products": [
        {
            "idProduct": 1,
            "title": "Ancient Manuscript",
            "type": "manuscript",
            "year": 1620,
            "format": "jpg",
            "cost": 5,
            "path": "/usr/src/app/uploads/manuscript1620.jpg"
        },
        {
            "idProduct": 2,
            "title": "Historic Map",
            "type": "historical_cartography",
            "year": 1780,
            "format": "png",
            "cost": 7,
            "path": "/usr/src/app/uploads/map1780.png"
        },
        {
            "idProduct": 3,
            "title": "Restoration Video",
            "type": "historical_cartography",
            "year": 1900,
            "format": "mp4",
            "cost": 8,
            "path": "/usr/src/app/uploads/restoration1900.mp4"
        },
        {
            "idProduct": 4,
            "title": "Old Photograph",
            "type": "photograph",
            "year": 1925,
            "format": "jpg",
            "cost": 4,
            "path": "/usr/src/app/uploads/photo1925.jpg"
        },
        {
            "idProduct": 5,
            "title": "Historic Newspaper",
            "type": "newspaper",
            "year": 1912,
            "format": "png",
            "cost": 6,
            "path": "/usr/src/app/uploads/newspaper1912.png"
        },
        {
            "idProduct": 6,
            "title": "World Map of 1492 High Resolution",
            "type": "historical_cartography",
            "year": 1492,
            "format": "jpg",
            "cost": 25,
            "path": "/usr/src/app/uploads/world_map_1492.jpg"
        },
        {
            "idProduct": 7,
            "title": "Medieval Manuscript",
            "type": "manuscript",
            "year": 1250,
            "format": "jpg",
            "cost": 3,
            "path": "/usr/src/app/uploads/1757258883319-medieval_manuscript.jpg"
        }
        {
            "idProduct": 8,
            "title": "Italian econimic boom",
            "type": "historical_video",
            "year": 1950,
            "format": "mp4",
            "cost": 10,
            "path": "/usr/src/app/uploads/1757259860260-italian_economic_boom.mp4"
        }
    ]
}
```

- `GET /products?type=manuscript` – Rotta che mostra tutti i prodotti presenti facenti parte del tipo specificato, in questo caso 'manuscript' 

*Richiesta Body/Query*

```bash
Authorization: No Auth
```
---json
*Risposta:*
```json
{
    "message": "Products retrieved successfully",
    "products": [
        {
            "idProduct": 1,
            "title": "Ancient Manuscript",
            "type": "manuscript",
            "year": 1620,
            "format": "jpg",
            "cost": 5,
            "path": "/usr/src/app/uploads/manuscript1620.jpg"
        },
        {
            "idProduct": 7,
            "title": "Medieval Manuscript",
            "type": "manuscript",
            "year": 1250,
            "format": "jpg",
            "cost": 3,
            "path": "/usr/src/app/uploads/1757258883319-medieval_manuscript.jpg"
        }
    ]
}
```

### Purchase ('/purchase')
- `POST /purchase` – Rotta che mostra il corretto acquisto di un prodotto da parte di un utente autenticato

*Richiesta Body/Query*

```bash
Authorization: Bearer {authToken}
```
```json
{
    "productIds": [7]
}
```
*Risposta:*
```json
{
    "message": "Purchase completed successfully",
    "totalCost": 3,
    "purchases": [
        {
            "purchaseId": 1,
            "productId": 7,
            "type": "standard"
        }
    ],
    "downloadUrl": "265eb55f-8e9f-44c4-a477-16c1b7e81016"
}
```

- `POST /purchase` – Rotta che mostra il corretto regalo di un prodotto da parte di un utente autenticato verso un altro utente registrato

*Richiesta Body/Query*

```bash
Authorization: Bearer {authToken}
```
```json
{
     "productIds": [8],
     "recipientEmail": "luigi.bianchi@example.com"
}
```
*Risposta:*
```json
{
    "message": "Purchase completed successfully",
    "totalCost": 10.5,
    "purchases": [
        {
            "purchaseId": 2,
            "productId": 8,
            "type": "gift",
            "recipientEmail": "luigi.bianchi@example.com"
        }
    ],
    "downloadUrl": "80bfbb55-6742-49b8-bc86-a9b07fff0541"
}
```

- `POST /purchase` – Rotta che mostra il corretto acquisto di un prodotto multiplo da parte di un utente autenticato

*Richiesta Body/Query*

```bash
Authorization: Bearer {authToken}
```
```json
{
    "productIds": [7,8]
}
```
*Risposta:*
```json
{
    "message": "Purchase completed successfully",
    "totalCost": 13,
    "purchases": [
        {
            "purchaseId": 1,
            "productId": 7,
            "type": "standard"
        },
        {
            "purchaseId": 2,
            "productId": 8,
            "type": "standard"
        }
    ],
    "downloadUrl": "a1d93c57-024b-4575-9760-ed85eb7113d6"
}
```

- `GET /purchase?format=json` – Rotta che mostra correttamente la lista degli acquisti effettuata dall'utente in formato json

*Richiesta Body/Query*

```bash
Authorization: Bearer {authToken}
```

*Risposta:*
```json
{
    "standard": [
        {
            "type": "standard",
            "product": {
                "idProduct": 8,
                "title": "Italian econimic boom",
                "type": "photograph",
                "year": 1950,
                "cost": 10,
                "format": "mp4"
            },
            "recipient": {}
        },
        {
            "type": "standard",
            "product": {
                "idProduct": 7,
                "title": "Medieval Manuscript",
                "type": "manuscript",
                "year": 1250,
                "cost": 3,
                "format": "jpg"
            },
            "recipient": {}
        }
    ],
    "gift": [],
    "additional_download": []
}
```

- `GET /purchase?format=pdf` – Rotta che mostra correttamente la lista degli acquisti effettuata dall'utente in formato pdf

*Richiesta Body/Query*

```bash
Authorization: Bearer {authToken}
```

*Risposta:*
<p align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/purchase_history_for_mario_rossi.png" alt="Purchase_history" width="500"/>
</p>

### Users ('/users')

- `GET /users/me/tokens` – Rotta che mostra correttamente i token in possesso dell'utente

*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
```json
{
    "message": "User tokens retrieved successfully.",
    "tokens": 7
}
```

- `PATCH /users/:id/tokens` – Rotta che mostra la corretta ricarica dei token da parte dell'admin nei confronti dell'utente

*Richiesta Body/Query*
```bash
Authorization: Bearer {adminToken}
```
```json
{
    "tokens": 20
}
```

*Risposta*
```json
{
    "message": "User tokens updated successfully.",
    "userId": "2",
    "tokens": 27
}
```

### Downloads ('/downloads)
- `GET /downloads/{{downloadUrlStandard}}` – Rotta che permette di ricevere correttamente il prodotto acquistato con la filigrana traamite l'url ricevuto

*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/1757264915420-medieval_manuscript-wm-1757264964336.jpg" alt="medieval_manuscript" width="500"/>
</p>

- `GET /downloads/{{downloadUrlStandard}}` – Rotta che permette di ricevere correttamente il video acquistato con la filigrana traamite l'url ricevuto

*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/italian_econimic_boom_screenshot.png" alt="historical_video" width="500"/>
</p>

- `GET /downloads/{{downloadUrlStandard}}?outputFormat=png` – Rotta che permette di ricevere correttamente l'immagine acquistata con la filigrana traamite l'url ricevuto nel formato specificato

*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/1757344409301-medieval_manuscript-wm-1757344435125.png" alt="medieval_manuscript" width="500"/>
</p>

- `GET /downloads/{{downloadUrlGift}}` – Rotta che permette di ricevere correttamente il prodotto ricevuto in regalo traamite l'url ottenuto 
*Richiesta Body/Query*
```bash
Authorization: Bearer {reciverToken}
```

*Risposta*
<p align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/italian_econimic_boom_screenshot.png" alt="historical_video" width="500"/>
</p>

- `GET /downloads/{{downloadUrlMultipleStandard}}` – Rotta che permette di ricevere correttamente i prodotti acquistati in un file .zip tramite l'url ottenuto
*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="https://github.com/matteorisolo/ProgettoPA/blob/main/images/zip_screenshot.png" alt="historical_video" width="500"/>
</p>

---

## Scelte implementative


---


## Strumenti utilizzati

Per la realizzazione dell'applicazione sono stati utilizzati i seguenti strumenti:

* [Typescript](https://www.typescriptlang.org/) linguaggio principale scelto per lo sviluppo dell’applicazione;

* [Express.js](https://expressjs.com/) framework per applicazioni Web per Node.js;

* [Node.js](https://nodejs.org/en) sistema per la gestione di moduli e pacchetti;

* [ImageMagick](https://imagemagick.org/) libreria utilizzata per applicare la filigrana e processare le immagini;

* [FFmpeg](https://ffmpeg.org/) strumento usato per inserire la filigrana e manipolare i file video;

* [PDFKit](https://pdfkit.org/) libreria impiegata per la generazione dei report in formato PDF;

* [Sequelize](https://sequelize.org/) ORM per la gestione delle entità e delle relazioni nel database;

* [Docker](https://www.docker.com/) tecnologia di containerizzazione per il deploy e la portabilità dell’applicazione;

* [PostgreSQL](https://www.postgresql.org/) database relazionale impiegato per la persistenza dei dati;

* [Postman](https://www.postman.com/) tool scelto per il test e la validazione delle rotte API;

* [JWT](https://jwt.io/) meccanismo usato per autenticazione e autorizzazione sicura;

* [GitHub](https://github.com/) piattaforma per il versionamento e la collaborazione sul codice;

* [Visual Studio Code](https://code.visualstudio.com/) editor adottato per lo sviluppo e la gestione del progetto.

---

### Autori

|Nome | Email |
|-----------|--------|
|`Risolo Matteo` | s1122743@studenti.uvipm.it |
|`De Pascali Niccolò` | s1123958@studenti.univpm.it |