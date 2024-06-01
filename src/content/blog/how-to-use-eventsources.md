---
author: Brandon Bondig
pubDatetime: 2024-05-28T15:22:00Z
modDatetime:
title: Using EventSource in JavaScript
slug: using-eventsource-in-javascript
featured: true
draft: false
tags:
  - javascript
  - web development
  - eventsource
description: Learn how to use EventSource in JavaScript to enable server-sent events in your web applications.
---

In this blog post, we'll explore how to use the `EventSource` interface in JavaScript to handle server-sent events (SSE). Server-sent events allow servers to push updates to clients in real-time over a single HTTP connection, making them ideal for use cases like live updates, notifications, and real-time data feeds.

## Table of contents

1. [What is EventSource?](#what-is-eventsource)
2. [Setting up the Server](#setting-up-the-server)
3. [Creating the Client](#creating-the-client)
4. [Handling Events](#handling-events)
5. [Error Handling](#error-handling)
6. [Closing the Connection](#closing-the-connection)
7. [Sample Project](#sample-project)

## What is EventSource?

`EventSource` is a web API that enables web applications to receive real-time updates from a server. It is part of the HTML5 specification and allows servers to push updates to clients over a persistent HTTP connection. This is particularly useful for applications that require real-time data, such as live sports scores, stock tickers, or chat applications.

## Setting up the Server

To use `EventSource`, you first need to set up a server that can send events to the client. Below is an example using Node.js with the `express` framework.

1. **Install Dependencies**:

   ```bash
   npm install express
   ```

2. **Create the Server**:

   ```javascript
   const express = require("express");
   const app = express();
   const PORT = 3000;

   app.get("/events", (req, res) => {
     res.setHeader("Content-Type", "text/event-stream");
     res.setHeader("Cache-Control", "no-cache");
     res.setHeader("Connection", "keep-alive");

     setInterval(() => {
       res.write(`data: ${new Date().toLocaleTimeString()}\n\n`);
     }, 1000);

     req.on("close", () => {
       console.log("Client disconnected");
     });
   });

   app.listen(PORT, () => {
     console.log(`Server running at http://localhost:${PORT}`);
   });
   ```

This server sends the current time to clients every second.

## Creating the Client

To create a client that listens for events from the server, you can use the `EventSource` constructor in JavaScript.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EventSource Example</title>
  </head>
  <body>
    <h1>Server Time</h1>
    <div id="time"></div>

    <script>
      const eventSource = new EventSource("http://localhost:3000/events");

      eventSource.onmessage = event => {
        document.getElementById("time").innerText = event.data;
      };

      eventSource.onerror = error => {
        console.error("EventSource failed:", error);
      };
    </script>
  </body>
</html>
```

This client connects to the server and displays the time sent by the server.

## Handling Events

The `EventSource` interface provides several event handlers:

- `onmessage`: Fired when a message is received.
- `onopen`: Fired when the connection is opened.
- `onerror`: Fired when an error occurs.

You can handle these events as follows:

```javascript
eventSource.onopen = () => {
  console.log("Connection opened");
};

eventSource.onmessage = event => {
  console.log("Message:", event.data);
};

eventSource.onerror = event => {
  console.error("Error:", event);
};
```

## Error Handling

To handle errors, you can use the `onerror` event. This event is triggered when there is a problem with the connection.

```javascript
eventSource.onerror = error => {
  console.error("EventSource failed:", error);
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log("Connection closed");
  }
};
```

## Closing the Connection

To close the connection, use the `close` method:

```javascript
eventSource.close();
console.log("Connection closed");
```

## Sample Project

Here is a complete example combining all the above sections.

### Server (Node.js):

```javascript
const express = require("express");
const app = express();
const PORT = 3000;

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  setInterval(() => {
    res.write(`data: ${new Date().toLocaleTimeString()}\n\n`);
  }, 1000);

  req.on("close", () => {
    console.log("Client disconnected");
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
```

### Client (HTML):

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EventSource Example</title>
  </head>
  <body>
    <h1>Server Time</h1>
    <div id="time"></div>

    <script>
      const eventSource = new EventSource("http://localhost:3000/events");

      eventSource.onopen = () => {
        console.log("Connection opened");
      };

      eventSource.onmessage = event => {
        document.getElementById("time").innerText = event.data;
      };

      eventSource.onerror = error => {
        console.error("EventSource failed:", error);
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log("Connection closed");
        }
      };
    </script>
  </body>
</html>
```

With these steps, you should be able to set up and use `EventSource` in your JavaScript projects to receive real-time updates from the server.
