---
author: Sat Naing
pubDatetime: 2024-06-01T21:30:00Z
modDatetime:
title: Using the 'TooGoodToGo' API to Reserve Bags
slug: using-the-tgtg-api-to-reserve-bags
featured: true
draft: false
tags:
  - Too Good To Go
  - web development
  - API
description: Learn how to use the Too Good To Go (TGTG) API to reserve bags of surplus food from local stores and restaurants.
---

Learn how to use the Too Good To Go (TGTG) API to reserve bags of surplus food from local stores and restaurants.

## Table of contents

## What is Too Good To Go?

Too Good To Go is a mobile app that allows users to purchase bags of surplus food from local stores and restaurants at discounted prices. The app connects users with businesses that have excess food inventory and helps reduce food waste by offering these items at a reduced cost. Users can browse available bags in their area, reserve them through the app, and pick them up at the designated time.

## The Too Good To Go API

TooGoodToGo does not provide an official public API for developers to access their services. However, there are unofficial APIs available that allow developers to interact with the platform programmatically. These APIs provide endpoints for searching for stores, viewing bag details, and reserving bags.

On of which acts as a wrapper around the official Too Good To Go API, providing a more user-friendly interface for developers to interact with the platform. In this tutorial, we'll be using [tgtg-python](https://github.com/ahivert/tgtg-python) made by [ahivert](https://github.com/ahivert) to interact with the Too Good To Go API and reserve bags of surplus food.

## Using tgtg-python

To get started with tgtg-python, you'll need to install the package using pip. Open your terminal and run the following command:

```bash
pip install tgtg
```

Once installed, you'll have to import the package, and build the client with your email, that is associated with your Too Good To Go account.

```python
from tgtg import TgtgClient

client = TgtgClient(email="<your_email>")
credentials = client.get_credentials()
```

You should receive and email from Too Good To Go with a verification button. The client will wait until its validated.

To better streamline the process, you can add the bags you want to reserve to your favories, via the app, and then use the following method to fetch the favorites.

```python
favorites = client.get_favorites()
```

The favorties will be a list of dictionaries, each containing the details of the bags you've added to your favorites. You can then use the `create_order` method to reserve a bag within the list, using its `product_id`.

```python
order = client.create_order(favorites[0]['product_id'])
```

Finally, to ensure you don't miss out on the bag, we'll add a timer to reserve the bag at the exact time it becomes available.

```python
import time

# Reserve the bag at 12:00 PM
target_time = datetime(hour=12, minute=0, second=0)
now = datetime.now()

    # If the target time has already passed, set it to the next day
    if now > target_time:
        target_time += timedelta(days=1)
    wait_seconds = (target_time - now).total_seconds()

    # Wait until the target time
    time.sleep(wait_seconds)

    # Place the order and pay
    order = client.create_order(favorites[0]['product_id'])
    order_status = client.get_order_status(order['id'])

    print(order_status)
```

Once the timer has elapsed, the bag will be reserved.

## How do i buy the reserved bag?

As you have probably noticed, the `create_order` method does not automatically purchase the bag. Instead, it reserves the bag for you, and theres no way to automatically purchase the bag.

A clever workaround is to reserve the bag for a limited time, then drop the reservation and quickly buy it in the app. This can be done to by setting a timer to reserve the bag for a short period of time, then manually purchasing the bag in the app.

Like this:

```python
import time

# Reserve the bag at 12:00 PM
target_time = datetime(hour=12, minute=0, second=0)
now = datetime.now()

    # If the target time has already passed, set it to the next day
    if now > target_time:
        target_time += timedelta(days=1)
    wait_seconds = (target_time - now).total_seconds()

    # Wait until the target time
    time.sleep(wait_seconds)

    # Place the order and pay
    order = client.create_order(favorites[0]['product_id'])
    order_status = client.get_order_status(order['id'])
    print(f"Order status: {order_status}")

    # 2 minutes
    time.sleep(120)

    # Aborts the order
    abort_order(order['id'])
    print("Order aborted")
```

This will reserve the bag for 2 minutes, then abort the order. You can then quickly purchase the bag in the app. This will ensure that scouted bags are not lost to other users.
