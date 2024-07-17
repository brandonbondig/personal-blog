---
author: Brandon Bondig
pubDatetime: "now"
modDatetime:
title: Using the Growatt API
slug: using-the-growatt-api
featured: true
draft: first
tags:
  - Growatt
  - python
  - API
  - solar panels
description: Learn how to use the Growatt solar panel API to automate tasks like automatic power switching.
---

![A starry night sky.](../../assets/images/Cartoon_Style_Blog_Header.png)

Learn how to use the Growatt solar panel API to automate tasks like automatic power switching.

## Table of contents

## The Growatt API

The Growatt API allows developers to interact with Growatt's platform programmatically. With the API, you can automate tasks such as retrieving plant information, monitoring energy production, and managing device settings. This tutorial will guide you through using the Growatt API with a Python wrapper.

## Using the Growatt API

To get started with the Growatt API, you'll need to create a Python script that interfaces with the API. This tutorial assumes you have basic knowledge of Python and HTTP requests.

### Installation

First, ensure you have the [`Growatt library`](https://github.com/brandonbondig/growatt-api) installed. You can install it using pip:

```bash
pip install growatt-api
```

### Login via the Wrapper

To create an instance of the Growatt client, you'll need to use the `login` method provided:

```python
from growatt import Growatt

api = Growatt()
api.login("test@user.com", "pass123")
```

After a successful login, a session is created, giving you access to various methods to interact with the Growatt API and retrieve information about your solar panel system.

### Retrieve Plant List

Once logged in, you can retrieve the list of plants associated with your account using the `get_plants` method:

```python
plant_list = api.get_plants()
print(plant_list)
```

This will return a list of dictionaries, each containing details about a plant. For example:

```python
[
    {
        'timezone': '2',
        'id': '2074603',
        'plantName': 'Sample Plant'
    }
]
```

### Retrieve Plant Information

To get detailed information about a specific plant, use the `get_plant` method by providing the plant ID:

```python
plant_id = "1234567"
plant_info = api.get_plant(plant_id)
print(plant_info)
```

This will return a dictionary containing detailed information about the plant, such as location, power data, and more. For example:

```python
{
    'country': 'Denmark',
    'formulaCo2': '0.0',
    'accountName': 'example@example.com',
    'city': 'Sample City',
    'timezone': '2',
    'co2': '1234',
    'creatDate': '2023-01-01',
    'formulaCoal': '0.0',
    'designCompany': '0',
    'fixedPowerPrice': '1.2',
    ...
}
```

### Retrieve MIX id's

The retrieve the MIX id's associated with the plantId given, use the `get_mix_ids` method.

```python
plantId = "1234567"
mix_ids = api.get_mix_ids(plantId)

print(mix_status_data)
```

This will return a dictionary containing MIX ids which can be used to retrieve realtime data from the panels.

### Retrieve MIX Status Data

To get the current status and operational data of a MIX device, use the `get_mix_status` method by providing the plant ID and the MIX device serial number:

```python
mix_sn = "MIXSNTEST"
mix_status_data = api.get_mix_status(plant_id, mix_sn)
print(mix_status_data)
```

This will return a dictionary containing MIX device status and operational data. For example:

```json
{
    "pdisCharge1": 0.0,
    "uwSysWorkMode": "5",
    "pactouser": 0.0,
    "vBat": "53.1",
    "vAc1": "238.7",
    "priorityChoose": "0",
    "lost": "mix.status.normal",
    ...
}
```

### Retrieve MIX Total Data

To get the total operational data of a MIX device, use the `get_mix_total` method by providing the plant ID and the MIX device serial number, like with the method above:

```python
mix_sn = "MIXSNTEST"
mix_total_data = api.get_mix_total(plant_id, mix_sn)
print(mix_total_data)
```

This will return a dictionary containing the total MIX device data. For example:

```json
{
  "eselfToday": "12.5",
  "gridPowerTotal": "2625.8",
  "eselfTotal": "3169.8",
  "elocalLoadToday": "13.1",
  "gridPowerToday": "0.6",
  "elocalLoadTotal": "5795.6",
  "eexTotal": "0",
  "photovoltaicRevenueToday": "19.4",
  "eexToday": "0",
  "etoGridToday": "5.8",
  "edischarge1Total": "1494.5",
  "photovoltaicRevenueTotal": "6704.3",
  "unit": "D.Kr",
  "edischarge1Today": "7.7",
  "epvToday": "16.2",
  "epvTotal": "5586.9",
  "etogridTotal": "2310.9"
}
```

### Summary

To summarize, the growatt-api wrapper is useful for many things not available through the standard application provided. Tasks such as automatic power switching when wattage gets low, is a project that you can follow at the following blog here.
