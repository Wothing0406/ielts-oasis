# `react-doctor/control-has-associated-label`

Give every interactive control an accessible label via visible text, aria-label, aria-labelledby, or an associated label.

- **Category:** Accessibility
- **Severity:** warn
- **Source:** oxlint-plugin-react-doctor
- **Framework:** global
- **Enabled when:** always
- **Documentation:** <https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/control-has-associated-label>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires on an interactive control that has no accessible name. The firing set is the native interactive elements (button, select, textarea, summary, input unless type="hidden", a[href]/area[href], img[usemap], menuitem, option, datalist, th, td, tr, audio, embed, video) plus any DOM element or configured controlComponent carrying an interactive role (button, checkbox, link, switch, tab, etc.). A control passes only when it has a labelling prop (alt, aria-label, aria-labelledby, or a custom labelAttribute), visible text or an {expression} child within depth 5, a wrapping <label>, or a <label htmlFor> matching its id; it skips link, canvas, aria-hidden controls, and test/story/cypress files. False NEGATIVE (not positive): a spread {...props} and ANY {expression} child are unconditionally counted as a label, so a control that is actually unlabelled at runtime can silently pass.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Give the control a real accessible name: prefer visible text children (<button>Save</button>), or for an icon-only control add aria-label="Save". You can also associate a <label> — wrap the control (<label>Name <input /></label>) or point it via htmlFor/id (<label htmlFor="name">Name</label><input id="name" />). Note that title is NOT an accepted label here, and beware that a spread {...props} or a non-text {expression} child silently satisfies the check even when no real label is supplied, so confirm the name actually reaches the DOM. See https://oxc.rs/docs/guide/usage/linter/rules/jsx_a11y/control-has-associated-label
