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
  <img src="1757264915420-medieval_manuscript-wm-1757264964336.jpg" alt="medieval_manuscript" width="500"/>
</p>

- `GET /downloads/{{downloadUrlStandard}}` – Rotta che permette di ricevere correttamente il video acquistato con la filigrana traamite l'url ricevuto

*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="italian_econimi_boom_screenshot.png" alt="historical_video" width="500"/>
</p>

- `GET /downloads/{{downloadUrlStandard}}?outputFormat=png` – Rotta che permette di ricevere correttamente l'immagine acquistata con la filigrana traamite l'url ricevuto nel formato specificato

*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="1757344409301-medieval_manuscript-wm-1757344435125.png" alt="medieval_manuscript" width="500"/>
</p>

- `GET /downloads/{{downloadUrlGift}}` – Rotta che permette di ricevere correttamente il prodotto ricevuto in regalo traamite l'url ottenuto 
*Richiesta Body/Query*
```bash
Authorization: Bearer {reciverToken}
```

*Risposta*
<p align="center">
  <img src="italian_econimi_boom_screenshot.png" alt="historical_video" width="500"/>
</p>

- `GET /downloads/{{downloadUrlMultipleStandard}}` – Rotta che permette di ricevere correttamente i prodotti acquistati in un file .zip tramite l'url ottenuto
*Richiesta Body/Query*
```bash
Authorization: Bearer {authToken}
```

*Risposta*
<p align="center">
  <img src="zip_screenshot.png" alt="historical_video" width="500"/>
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

* [Sequelize](https://sequelize.org/) ORM per la gestione delle entità e delle relazioni nel database;

* [Docker](https://www.docker.com/) tecnologia di containerizzazione per il deploy e la portabilità dell’applicazione;

* [PostgreSQL](https://www.postgresql.org/) database relazionale impiegato per la persistenza dei dati;

* [Postman](https://www.postman.com/) tool scelto per il test e la validazione delle rotte API;

* [JWT](https://jwt.io/) meccanismo usato per autenticazione e autorizzazione sicura;

* [GitHub](https://github.com/) piattaforma per il versionamento e la collaborazione sul codice;

* [Visual Studio Code](https://code.visualstudio.com/) editor adottato per lo sviluppo e la gestione del progetto.

---

### Autori

|Nome | GitHub |
|-----------|--------|
|`Risolo Matteo` | [Clicca qui!]() |
|`De Pascali Niccolò` | [Clicca qui!]() |