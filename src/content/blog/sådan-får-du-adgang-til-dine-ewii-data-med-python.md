---
author: Brandon Bondig
pubDatetime: 2025-05-17T23:13:21Z
title: Sådan får du adgang til dine EWII-data med Python
slug: sådan-får-du-adgang-til-dine-ewii-data-med-python
featured: true
draft: false
tags:
  - ewii
  - python
  - api
  - mitid
description: Hent elforbrug, aftaler og måledata fra EWII med Python – nemt og automatiseret.
---

EWII tilbyder desværre ikke officiel API-adgang til dine forbrugsdata eller aftaler. Men med lidt authentication magi og Python kan du stadig automatisere adgangen til din konto og hente oplysninger som elforbrug, målepunkter og rapporter direkte fra selvbetjeningen. I denne guide viser jeg, hvordan du logger ind via MitID og bruger en simpel klient til at arbejde med dine data.

## Table of contents

## Installation og forberedelse

I denne guide bruger vi [ewii](https://github.com/brandonbondig/ewii-python) - en uofficiel Python-klient til EWII's selvbetjening. For at komme i gang, skal du blot installere pakken via terminalen:

```bash
pip install ewii
playwright install chromium
```

## Sådan logger du ind og finder dit målepunkt

Første skridt er at logge ind. Da EWIIs login system benytter MitID, kræver det at vi en enkelt gang interagerer med en browser.

Her er et eksempel på, hvordan du logger ind og henter ID’et på din måleenhed:

```python
import json, requests
from datetime import date
from ewii import EwiiClient

client = EwiiClient()
client.login(headless=True)

info = client.get_info()
meter = info["forbrugssteder"][0]["maalepunkter"][0]["maalepunktId"]

today = date.today()
first = today.replace(day=1)

print(client.get_consumption(first.isoformat(), today.isoformat(), meter))
```

Når du kører dette script, åbnes en Chromium-browser, hvor du bliver bedt om at logge ind med MitID. Når login er gennemført, laves der en forespørgsel til EWII's info side som besider dit måle punkt id, dette bruges til at hente dit elforbrug.

Du kan se en oversigt over de tilgængelige endpoints [her](https://github.com/brandonbondig/ewii-python).

## Gem og genbrug din login-session

For at undgå at skulle logge ind med MitID hver gang, kan vi gemme den aktive session lokalt og genbruge den ved fremtidige forespørgsler. Det gør integrationen både hurtigere og mere praktisk.

```python
import json
import requests
from ewii import EwiiClient

session = requests.Session()
cookie_path = "session.json"
client = EwiiClient(session)
client.login(headless=False)

with open(cookie_path, "w") as f:
    json.dump(client._get_session(), f)
```

Din session bliver nu gemt i filen `session.json`. Næste gang du vil hente data, kan du nemt genindlæse sessionen derfra i stedet for at logge ind igen:

```python
import json
import requests
from datetime import date
from ewii import EwiiClient

cookie_path = "session.json"

session = requests.Session()

try:
    with open(cookie_path) as f:
        for name, value in json.load(f).items():
            session.cookies.set(name, value, domain="www.ewii.dk")
    print("indlæste gemte cookies")
except (FileNotFoundError, json.JSONDecodeError):
    print("ingen eller korrupte cookies – logger ind på ny")

client = EwiiClient(session)
client.login(headless=True)

info   = client.get_info()
meter  = info["forbrugssteder"][0]["maalepunkter"][0]["maalepunktId"]

today  = date.today()
first  = today.replace(day=1)

data = client.get_consumption(first.isoformat(),
                              today.isoformat(),
                              meter_id=meter)

print(data)
```

Med adgang til dine data fra EWII åbner der sig en række muligheder. Du kan fx:

- Automatisere udtræk af dit elforbrug og visualisere udviklingen over tid
- Integrere data i dit eget energi-dashboard
- Sende varslinger ved usædvanligt højt forbrug
- Bygge en simpel web-API, så du eller andre nemt kan hente data on demand

Hvis du vælger at bygge en tjeneste, der kører løbende (fx et FastAPI-baseret API), skal du blot huske at holde sessionen i live – fx med et periodisk “keep-alive”-kald – så du undgår at blive logget ud. Sessionen fungerer så længe den ikke udløber eller bliver invalideret af EWII, så med en smule vedligeholdelse kan du have fuld adgang uden at skulle logge ind via MitID hver gang.
