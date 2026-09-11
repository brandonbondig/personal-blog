---
author: Brandon Bondig
pubDatetime: 2026-09-10T09:30:00Z
title: "Baseway: Database-Per-Tenant Managed Postgres for EU SaaS Teams"
slug: baseway-database-per-tenant-managed-postgres
featured: true
draft: false
tags:
  - postgres
  - database-per-tenant
  - multi-tenant
  - saas
  - devops
  - hetzner
  - gdpr
  - data-residency
description: Baseway is managed PostgreSQL for database-per-tenant SaaS — per-tenant point-in-time recovery, PgBouncer pooling, flat pricing, EU-only infrastructure.
---

![Baseway header](../../assets/images/baseway-header.png)

[Baseway](https://baseway.dev) is managed PostgreSQL for SaaS teams that give every customer their own database. It runs database-per-tenant fleets on Hetzner metal, restores a single tenant to any second with pgBackRest, puts a PgBouncer pooler on every instance, and keeps every byte inside the EU. The tagline on the site says it plainly: **the managed Postgres Hetzner never had**.

This post explains the problem it solves, how the architecture actually works, and who should be using it.

## Table of contents

## The multi-tenancy problem nobody warns you about

Every B2B SaaS eventually has to answer one question: **where does tenant data live?**

There are three usual answers, and each one has a tax.

| Model                       | Isolation                                   | Noisy-neighbour risk | Per-tenant restore     | Operational cost    |
| --------------------------- | ------------------------------------------- | -------------------- | ---------------------- | ------------------- |
| Shared tables + `tenant_id` | Weakest — one bad `WHERE` clause leaks data | High                 | Effectively impossible | Lowest              |
| Schema-per-tenant           | Medium                                      | High                 | Awkward                | Medium              |
| Database-per-tenant         | Strongest                                   | Contained            | Natural                | Highest — until now |

Most teams start with a `tenant_id` column because it is the cheapest thing to build. Then an enterprise prospect asks for a signed answer on data isolation, or a customer deletes three months of records by accident and wants _their_ data back — not a full-cluster rollback that would clobber everyone else — and suddenly the cheap model is the expensive one.

Database-per-tenant fixes all of that. Isolation is enforced by Postgres itself rather than by your ORM. A tenant's backup is genuinely their backup. `DROP DATABASE` is a complete, auditable offboarding.

The reason people avoid it is that **running the fleet is miserable**. A hundred tenants is a hundred databases to provision, monitor, back up, pool connections for, and restore individually. That is the job Baseway takes over.

## What Baseway actually is

The unit of the system is a **cell**: one PostgreSQL 17 instance on Hetzner metal, holding many tenant databases, with one Kubernetes namespace per organisation.

The key property is that adding a tenant is _a row, not a migration_. You call the control plane, it places the tenant on a cell, and you get a connection string back. No Terraform run, no new instance to name, no new thing to monitor.

Underneath, Baseway is deliberately built from parts you can reason about: **Hetzner Cloud, PostgreSQL 17, pgBackRest, PgBouncer, k3s, Prisma, BullMQ, Ansible, Caddy, Better Auth, and Vector**. There is no proprietary storage layer and no exotic consensus protocol. If you have operated Postgres before, you already know most of this stack — which matters a great deal on the day something breaks.

## Per-tenant point-in-time recovery, down to the second

This is the feature that justifies the whole architecture.

pgBackRest does continuous WAL archiving with a stanza per cluster, and Baseway verifies the repository is healthy _before_ it touches anything. When you ask for a restore, it runs in two stages:

**1. Restore the cell to a scratch location.**

```bash
pgbackrest --stanza=$CLUSTER_ID info

pgbackrest --stanza=$CLUSTER_ID \
  --type=time \
  --target="2026-08-23 14:32:00+02" \
  --target-action=promote \
  --pg1-path=/scratch/restore \
  restore
```

The live cell is never touched. What comes back is the whole instance, rewound to your target time, sitting somewhere harmless.

**2. Extract the single tenant and reload it.**

pgBackRest restores _instances_; what you actually want is _one database_. Baseway closes that gap: it pulls the one database out of the scratch copy and reloads it, so the tenant who made the mistake gets their data back and nobody else notices anything happened.

That second stage is the part teams underestimate when they plan to "just use pgBackRest ourselves." The tooling gives you an instance. The customer asked for a database.

Worth noting how this procedure came to exist: it was **run by hand against production first and written down as it actually ran**, and the automation is held to that document. That is the opposite of the usual order, and it is why the runbook matches reality.

## Connectivity: a pooler on every cell, a control plane that never dials in

Three design decisions here are worth calling out, because they are the ones that tend to bite people who roll their own.

**PgBouncer per cell.** A pooler sidecar sits beside every instance. Postgres connection slots are a finite, expensive resource, and without pooling you spend them on framework overhead instead of on tenants. Putting the pooler on the cell rather than in a central tier means one tenant's connection storm cannot starve an unrelated fleet.

**Agents dial out only.** Data servers long-poll the control plane over HTTPS using per-server bearer tokens. The control plane _never_ opens a connection to a data server. Your database hosts need no inbound ports and no public address — which removes an entire category of exposure from the threat model.

**Verified TLS to the tenant.** Endpoints look like `prefix.region.baseway.tech` on port 5432, routed by SNI to the cell holding the database, with `verify-full` supported properly:

```bash
psql "postgresql://app:$PGPASSWORD@wispy-meadow-4f2ab91c.fsn1.baseway.tech\
/tenant_8412?sslmode=verify-full&sslrootcert=system"

psql (17.11)
SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384)
tenant_8412=> select count(*) from invoices;
 count
-------
  4128
(1 row)
```

You pick the tenant with the database name. Nothing else in the connection string changes.

## Importing an existing Postgres database

You do not have to start green-field. Paste a connection string and Baseway runs a seven-step, checkpointed import: measure the source, size the cluster from that measurement, create the cell, create the target databases, start the copy, watch it, finalise.

Two details are worth knowing before you run one:

- **The copy runs as a Kubernetes Job in your own namespace**, so an agent restart or a host reboot does not lose it.
- **It is a snapshot, and the product says so.** `pg_dump` into `pg_restore`; writes that reach the source after the import begins are not copied, and the dashboard tells you that rather than implying a live migration.

That second point is a good example of the product's temperament. It would be easy to describe an import as a migration and let customers discover the difference in production.

## Observability: numbers the system can prove

Baseway has an engineering convention that I wish more infrastructure products had:

> Never show the customer a number the system cannot prove. A stale number presented as current is the same failure as an invented one.

In practice that means CPU and memory are sampled from the cell itself and **timestamped**, degrading to "how long ago this was seen" when sampling stops, instead of quietly showing you last hour's figure as if it were live. Every state change is written to an activity log against the organisation, the actor, and the command that caused it. And where the system cannot prove a count, the dashboard says so rather than rendering a confident zero.

The same idea runs through the data model. Baseway stores **desired** state (what you asked for) separately from **observed** state (what the agent last saw). "Degraded" is never written down anywhere — it is the computed disagreement between the two. A status field that can drift from reality is a status field that will eventually lie to you.

## The correctness work behind it

Managed database products live or die on what happens when something fails midway. Baseway's approach is that **multi-step operations are sagas**: a state machine with checkpointed steps, compensations, and per-step timeouts. Agents replay commands, sagas replay steps, and everything is idempotent — so nothing double-provisions.

The public site lists what was actually tested, with the evidence, rather than adjectives:

- The worker boots against a dead catalog database — logs degraded mode and keeps ticking instead of exiting.
- An agent survives a dead control plane — backoff observed at 1.2s → 1.8s → 3.8s → 7.6s, jittered. It never exits; it waits.
- Unknown commands never crash an agent — an unhandled command and a malformed payload both fail cleanly as `unsupported_command` and polling continues.
- Commands are idempotent on replay — a completed command reset to pending ran a second time and the agent adopted the existing container. Attempts 1 → 2, containers still 1.
- Leases hand out work exactly once — three queued commands, two workers, limit two: leased 2 → 1 → 0, then reclaimed 3 after expiry.
- The periodic sweep is the safety net — with the tick queue disabled entirely, 0 tick jobs consumed and 5 sweep advances still carried the saga to success. A lost notification costs time, never correctness.
- Jobs run on Postgres with **no Redis at all** — BullMQ on its Postgres backend, verified by grepping the lockfile for zero matches.

That last one is a nice piece of operational thinking. Every additional stateful system in a managed-database product is another thing that can be down while you are trying to fix a customer's database. Running the job queue on the Postgres you already operate removes a dependency instead of adding one.

## EU-only infrastructure and data residency

Everything runs on Hetzner in the EU, and **nothing leaves the EU**. For European SaaS companies this is not a nice-to-have — it is the line item in the security questionnaire that decides whether the deal closes.

Combined with database-per-tenant isolation, it gives you an unusually strong answer to the two questions enterprise buyers actually ask:

1. _Where is our data?_ — In the EU, on named infrastructure, with a published subprocessor list.
2. _Is it mixed with other customers' data?_ — No. Separate database, separate credentials, separate backup, separate restore.

Answering both of those without hand-waving is worth real money at the point of sale.

## Pricing

Baseway charges **flat pricing** rather than metering you per query, per connection, or per compute-second. The appeal of flat pricing for a database-per-tenant fleet is obvious: your cost scales with the capacity you provisioned, not with a usage curve you cannot predict at the point you sign the customer. Current figures are on [baseway.dev](https://baseway.dev).

## What is on the roadmap

Two pieces of feasibility work are done and documented but **not shipped yet** — flagging them because the difference matters:

- **Instant database branching.** Same-node ZFS copy-on-write snapshots of a cell, so a branch is created without a dump, restore, or full data copy — Postgres then does ordinary crash recovery against the cloned WAL. In local testing, creating a writable clone of a ~1.3 GB fixture took single-digit milliseconds, with the clone answering `SELECT 1` within a couple of seconds. Production NVMe performance and CSI integration are still release gates.
- **Selectable major versions.** PostgreSQL 16, 17 and 18 at cluster creation, with rehearsable major-version upgrades performed on an isolated clone before a scheduled cutover — rather than an in-place upgrade you cannot practise.

## Who Baseway is for

Baseway is a good fit if you are:

- A **B2B SaaS team** that already runs database-per-tenant, or knows it should and has been putting it off because of the operational cost.
- Selling into **regulated or EU-sensitive markets** where data residency is a procurement requirement.
- Tired of a per-usage bill that makes a growing tenant fleet financially unpredictable.
- Running on Hetzner (or wanting Hetzner economics) but unwilling to be the one carrying the pager for Postgres.

It is probably _not_ for you if you have one shared database with a `tenant_id` column and no intention of changing that — the architecture's advantages simply do not apply.

## Try it

You can spin up a cluster on Hetzner, import an existing database from a connection string, and restore any tenant to any second at **[baseway.dev](https://baseway.dev)**.

If you enjoy this kind of infrastructure writing, you might also like my posts on [self-hosting a reverse proxy](/posts/self-hosting-reverse-proxy) and [self-hosting an LLM on RunPod](/posts/self-host-your-own-llm-on-runpod).
