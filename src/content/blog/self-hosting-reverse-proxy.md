---
author: Brandon Bondig
pubDatetime: 2024-06-03T14:31:00Z
modDatetime: 2024-06-03T22:01:46Z
title: Self Hosting Reverse Proxy with Fast Reverse Proxy (FRP)
slug: self-hosting-reverse-proxy
featured: true
draft: false
tags:
  - Cloudfront
  - reverse-proxy
  - self-hosting
  - tunneling
description: Create a self-hosted reverse proxy to tunnel traffic to your local development environment without using Cloudfront.
---

Fast Reverse Proxy (FRP) is a self-hosted reverse proxy that allows you to tunnel traffic to your local development environment. This mitigates the need to open ports on your router or use a service like Cloudfront to expose your local server to the internet.

## Table of contents

## What is a Reverse Proxy?

A reverse proxy is a server that sits between a client and one or more servers. It intercepts requests from clients and forwards them to the appropriate server. Reverse proxies are commonly used to improve performance, security, and reliability by distributing client requests across multiple servers.

In this article, we'll focus on setting up a reverse proxy to tunnel traffic between local envirements, but the same principles can be applied to a VPS or cloud server.

## Setup Fast Reverse Proxy (FRP)

First of, you'll need to download the FRP binary from the [official website](https://github.com/fatedier/frp/releases).
Choose the appropriate version for your operating system and architecture.

We will use the `linux_amd64` version for this tutorial.

Then extract the downloaded file and navigate to the extracted directory.

```bash
Desktop % tar -xvf frp_0.58.1_linux_amd64.tar.gz &&

cd frp_0.58.1_linux_amd64
```

Once extracted, you'll have two files: `frpc` and `frps`.

- `frpc` is the client that runs on your local machine.
- `frps` is the server that runs on your VPS or cloud server.

## Setting up the Server

First, we'll set up the server on your VPS or cloud server.

1. Copy the `frps` file and the `frps.toml` configuration file to your server.
   The `frps.toml` file contains the configuration settings for the server.

```bash
bindPort = 7000
```

This `bindPort` setting specifies the port that the server listens on.

2. Start the server by running the following command:

```bash
./frps -c frps.toml
```

The server should now be running and listening on port 7000.

3. On the client side, copy the `frpc` file and the `frpc.toml` configuration file to your local machine.
4. `frpc.toml` needs to be configured with the server's IP address and port.

```bash
serverAddr = "192.168.1.50"
serverPort = 7000

[[proxies]]
name = "test-tcp"
type = "tcp"
localIP = "localhost"
localPort = 22
remotePort = 6000
```

- `serverAddr` and `serverPort` specify the IP address and port of the VPS.
- `localIP` and `localPort` specify the IP address and port of the local server.
  and should be set to `localhost` and the port of the service you want to expose.
- `remotePort` specifies the port on the server that a client can connect to.

5. Start the client by running the following command:

```bash
./frpc -c frpc.toml
```

The client should now be running and connected to the server.

## Conclusion

Once the server and client are set up, you can access the client server through the remote server's IP, in this case, `192.168.1.50:6000`, which will tunnel traffic to the local client server on `port 22`.
