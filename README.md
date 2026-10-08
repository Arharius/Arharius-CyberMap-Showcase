# CyberMap Showcase

A portfolio version of **CyberMap** — an interactive cyber-event visualization interface built with React, TypeScript, MapLibre, deck.gl, Zustand, and Vite.

> **SIMULATED — NOT REAL ATTACK DATA**

This repository contains only synthetic/demo data and a standalone visualization layer. It does **not** include production feeds, private infrastructure, real target inventories, internal orchestration material, credentials, or operational security data.

## What it demonstrates

- deterministic synthetic cyber-event generation;
- an offline-first map layer with no external tile dependency;
- animated event visualization with deck.gl;
- filtering, event selection, KPI summaries, and event inspection;
- reproducible simulation fixtures and schema validation;
- responsive presentation-oriented UI;
- automated tests and production build checks.

## Tech stack

- React 19
- TypeScript
- Vite
- MapLibre GL
- deck.gl
- Zustand
- Vitest

## Local run

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Tests:

```bash
npm test
```

## Safety / data policy

CyberMap Showcase is a visualization demo. All event records are generated locally from deterministic fixtures.

The showcase intentionally contains:

- no live threat intelligence feed;
- no real IP addresses or hostnames;
- no real organization target list;
- no credentials or secrets;
- no malware execution;
- no offensive automation.

The map uses procedural/offline geometry and the event fixtures use neutral synthetic targets.

## Architecture

```text
Synthetic fixture generator
        |
        v
CyberEvent schema + validation
        |
        v
Presentation snapshot
        |
        +--> KPI / filters
        +--> event feed / inspector
        +--> MapLibre + deck.gl visualization
```

The original private development repository is kept separate from this public portfolio edition.

## Status

Portfolio showcase. Product development is archived; this repository exists as a clean demonstration of the implemented visualization and engineering approach.
