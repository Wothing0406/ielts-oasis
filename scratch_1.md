# `react-doctor/prefer-module-scope-pure-function`

Hoist the pure helper to module scope (above the component) so it isn't reallocated each render: const formatName = (user) => ...

- **Category:** Architecture
- **Severity:** warn
- **Source:** oxlint-plugin-react-doctor
- **Framework:** global
- **Enabled when:** always

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires on a named non-PascalCase function binding declared inside a component or custom-hook body — a VariableDeclarator whose init is an ArrowFunctionExpression or FunctionExpression (incl. async/generator), or a FunctionDeclaration — whose closureCaptures resolve only to its own params, module imports, module-scope consts, or globals (console, setTimeout, Math, fetch resolve to no symbol and so pass), i.e. it captures NO binding inside the component body scope. The ONLY CallExpression exclusion is the VariableDeclarator init guard, which returns early when a binding's own init is a CallExpression — so const f = useCallback(...) / const f = useMemo(...) and a const X = memo(...) binding are skipped because their init is the call itself; there is NO skip for a helper defined INSIDE a memo()- or forwardRef()-wrapped named function component, so const App = memo(function App(){ const formatName = ... }) and forwardRef(function Input(){ const validate = ... }) DO fire (the wrapper call is traversed transparently and the inner helper is flagged). MemberExpression assignments (Component.helper = ...) and PascalCase bindings (handled by no-nested-component-definition) are skipped. False positive to suppress: the helper actually does close over local state — it reads a useState value or setter (increment = () => setCount(count + 1)), a prop (getCount = () => items.length), or another local helper that itself captures state (doubleCount calls getCount which reads count); or the enclosing PascalCase function is really an object-returning factory/adapter (DailyVideoApiAdapter, AIHandlePlugin returning { ... }) not a component, or a plain non-component function like makeApi.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Move the function out of the component to module scope (above the component declaration) since it references no local state, turning a per-render allocation into a one-time module binding: lift const formatName = (user) => user.firstName + " " + user.lastName above function App() unchanged, and if it needs render-time values pass them as explicit parameters rather than closing over them. Only confirm after verifying every identifier the body uses is a param, a module import/const, or a global; if it touches props or useState values, leave it in place.
