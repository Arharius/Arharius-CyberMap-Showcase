# Architecture

CyberMap Showcase is intentionally self-contained and synthetic.

## Data flow

```text
seededRandom
   |
   v
createSyntheticFixtures
   |
   v
CyberEvent schema validation
   |
   v
snapshot / presentation mapping
   |
   +--> KPI strip
   +--> filters
   +--> event feed + inspector
   +--> MapLibre + deck.gl layers
```

## Offline map policy

The map style is built from inline procedural geometry. It does not depend on remote tiles, sprites, glyphs, terrain, or a hosted basemap. A request transform fails closed if a future change attempts to introduce an external map resource.

## Data policy

All events use `data_mode=SIMULATED`, `provenance_class=SIMULATED`, and neutral demo targets. Test-only documentation addresses such as `192.0.2.1`, `example.com`, and `example.invalid` are reserved example values rather than operational indicators.

## Scope

This public showcase contains the visualization layer only. Internal project orchestration, private research notes, production integrations, target inventories, and operational data are intentionally excluded.
