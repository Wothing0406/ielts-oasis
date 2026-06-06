# `react-doctor/no-array-index-as-key`

Use a stable unique identifier: `key={item.id}` or `key={item.slug}` — index keys break on reorder/filter

- **Category:** Correctness
- **Severity:** warn
- **Source:** oxlint-plugin-react-doctor
- **Framework:** global
- **Enabled when:** always

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Rule flags JSX key={...} whose expression resolves to an iteration index named i, idx, or index — directly, inside a template literal, via .toString(), through String(i) or Number(i), or via '' + i string coercion. Static placeholder lists built from Array.from({length}) or new Array(N) are already excluded. False positive: append-only logs whose rows have no per-item identity and never reorder or filter.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Use a stable per-item identifier: key={item.id}, key={item.slug}, or any field that uniquely identifies the row across renders. If items truly lack an id, derive one (content hash, crypto.randomUUID() cached on the item) — never the index alone, because reordering reassigns React state across the wrong DOM nodes. See https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key
