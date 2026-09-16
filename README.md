# Blinds and Curtains Card

A visual cover control card for Home Assistant. Blinds roll down, curtains slide
sideways, and each cover is drawn over a window that can be shaped to match the
real one.

![Preview](images/blinds-preview.png)

Fork of [Lovelace Blind Card Enhanced](https://github.com/flect41/lovelace-blind-card-enhanced)
by flect41, itself a fork of [Blind Card](https://github.com/tungmeister/hass-blind-card)
by tungmeister.

The upstream card always moves the sheet downward — its `style` option changes
only the picture drawn behind an always-vertical blind. This fork gives covers a
real direction of travel, which is what a curtain needs.

---

## Features

- **Four directions of travel** — down, right-to-left, left-to-right, and
  centre-opening (two panels meeting in the middle)
- Drag-to-set position with a live percentage readout; centre-opening curtains
  can be dragged from either edge
- Window backgrounds shaped to the real opening: one, two or three panes, or a
  window-plus-door combination
- Fluid sizing — the picture fills its card and caps at the style's design width
- Per-entity colours, inverted percentage and inverted commands
- Several covers on one card

## Installation

### HACS (custom repository)

1. HACS → three-dot menu → Custom repositories
2. Add `alex-sever-h/blinds-and-curtains-card`, category **Dashboard**
3. Install, then hard-refresh the browser

### Manual

Copy `blinds-and-curtains-card.js` into `config/www/` and add a dashboard
resource pointing at `/local/blinds-and-curtains-card.js`, type **module**.

## Configuration

```yaml
type: custom:blinds-and-curtains-card
title: Living Room
entities:
  - entity: cover.livingroom_blinds
    name: Blinds
    style: triple_window
    motion: down
  - entity: cover.livingroom_curtains
    name: Curtains
    style: triple_window
    motion: center
```

### Card options

| option | type | default | description |
|---|---|---|---|
| `type` | string | — | `custom:blinds-and-curtains-card` |
| `entities` | list | — | one entry per cover |
| `title` | string | — | card header |

### Per-entity options

| option | type | default | description |
|---|---|---|---|
| `entity` | string | — | a `cover.*` entity |
| `name` | string | friendly name | label shown on the card |
| `motion` | string | `rtl` | direction of travel — see below |
| `style` | string | `roller` | window background — see below |
| `blind_color` | hex | `#4a4a4a` | sheet colour |
| `buttons_position` | `left`/`right` | `left` | which side the buttons sit on |
| `title_position` | `top`/`bottom` | `top` | label above or below |
| `invert_percentage` | bool | `false` | flip the position scale |
| `invert_commands` | bool | `false` | swap the open and close buttons |

### `motion`

| value | behaviour |
|---|---|
| `down` | vertical, exterior roller — the sheet hangs in front of the whole window, covering the frame |
| `rtl` | one panel parked right, closing leftward |
| `ltr` | one panel parked left, closing rightward |
| `center` | two panels, one from each edge, meeting in the middle; a drag handle on each |

### `style`

Added in this fork:

| value | window drawn |
|---|---|
| `double_window` | two panes, one mullion |
| `triple_window` | three panes, two mullions |
| `window_door` | wide short window left, tall door right, heads aligned |

Inherited from upstream: `roller`, `single_door`, `split_window`,
`sliding_left`, `sliding_right`.

The background is independent of `motion` — any window shape can be paired with
any direction of travel.

## Requirements

The cover entity needs `set_cover_position` support (`supported_features` bit 4)
for the drag handle to do anything. Open, close and stop work regardless.

## Licence

Apache-2.0, inherited from upstream. See `LICENSE`, and `NOTICE` for the list of
modifications made in this fork.
