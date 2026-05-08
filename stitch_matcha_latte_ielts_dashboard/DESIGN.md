---
name: Matcha Latte Study System
colors:
  surface: '#fff8f6'
  surface-dim: '#fbd1c4'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2da'
  surface-container-highest: '#ffdbd0'
  on-surface: '#2c160e'
  on-surface-variant: '#43493d'
  inverse-surface: '#442a22'
  inverse-on-surface: '#ffede8'
  outline: '#73796c'
  outline-variant: '#c3c8ba'
  surface-tint: '#44682f'
  primary: '#44682f'
  on-primary: '#ffffff'
  primary-container: '#a7d08c'
  on-primary-container: '#375a23'
  inverse-primary: '#a9d28e'
  secondary: '#516161'
  on-secondary: '#ffffff'
  secondary-container: '#d4e6e5'
  on-secondary-container: '#576867'
  tertiary: '#625f50'
  on-tertiary: '#ffffff'
  tertiary-container: '#c9c4b2'
  on-tertiary-container: '#545143'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c5efa8'
  primary-fixed-dim: '#a9d28e'
  on-primary-fixed: '#082100'
  on-primary-fixed-variant: '#2d4f1a'
  secondary-fixed: '#d4e6e5'
  secondary-fixed-dim: '#b8cac9'
  on-secondary-fixed: '#0e1e1e'
  on-secondary-fixed-variant: '#3a4a49'
  tertiary-fixed: '#e8e2d0'
  tertiary-fixed-dim: '#ccc6b5'
  on-tertiary-fixed: '#1e1c11'
  on-tertiary-fixed-variant: '#4a4739'
  background: '#fff8f6'
  on-background: '#2c160e'
  surface-variant: '#ffdbd0'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Lexend
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  title-sm:
    fontFamily: Lexend
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Lexend
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 2rem
  element-gap: 1rem
  section-margin: 4rem
  layout_model: fixed-grid
  columns: '12'
  gutter: 24px
---

## Brand & Style
This design system centers on a **Minimalist-Cozy** aesthetic, specifically tailored for the IELTS learning journey. It balances the professional rigor of academic preparation with the soothing, approachable atmosphere of a neighborhood cafe. 

The personality is "The Encouraging Mentor"—organized and disciplined, yet soft and forgiving. The visual style leans into a **Soft-Tactile Minimalism**, utilizing generous negative space to reduce cognitive load during intense study sessions. Key brand identifiers include the "Matcha" mascot (bears and organic tea leaf motifs) which serve as progress indicators and celebratory cues.

## Colors
The palette is inspired by the layers of a matcha latte. 
- **Matcha Primary (#A7D08C)** is used for primary actions, success states, and progress bars.
- **Matcha Soft (#E0F2F1)** serves as a cooling secondary background to provide visual rest from the warmth of the cream.
- **Cream Yellow (#FFF9E6)** is the default surface color, mimicking the texture of steamed milk and reducing eye strain compared to pure white.
- **Latte Brown (#5D4037)** replaces standard blacks for all typography and iconography to maintain a soft, high-contrast legibility that feels organic.

## Typography
The system uses a dual-font approach to maximize readability and friendliness.
- **Lexend** is utilized for headlines, titles, and navigational labels. Its hyper-legible design, originally created to reduce reading stress, makes it ideal for IELTS instructions and section headers.
- **Quicksand** is used for all body text and long-form reading passages. Its rounded terminals complement the overall "cute" aesthetic and provide a rhythmic, easy-to-read flow for complex study materials.

## Layout & Spacing
The layout follows a **Fixed Grid** model for desktop to maintain a "journal" or "workbook" feel, centering the content to allow the eye to focus. A generous 8px base unit (the "Bean" unit) dictates all padding and margins. 

Information is organized into "Learning Zones" with wide margins (64px+) to prevent the interface from feeling cluttered. Gutters are kept wide (24px) to ensure that even when columns are packed with text, the "Matcha" airiness is preserved.

## Elevation & Depth
In alignment with the minimalist theme, this system avoids traditional heavy shadows. Instead, it uses **Tonal Layering** and **Soft Insets**:
- **Depth Levels:** Hierarchy is created by stacking `Cream Yellow` surfaces on `Matcha Soft` backgrounds.
- **Shadows:** When necessary, use extremely diffused, low-opacity shadows tinted with `Latte Brown` (e.g., `rgba(93, 64, 55, 0.08)`) to make cards appear as if they are floating gently on milk foam.
- **Active States:** Instead of raising elements, use a "pressed" effect (inner shadows) to mimic the tactile feel of soft stationery.

## Shapes
The shape language is the core of the "cute" aesthetic. Standard corners are replaced with **Hyper-Rounded** geometries.
- **Large Containers:** Use `4xl` (2rem) for standard cards and study modules.
- **Feature Hero Blocks:** Use `5xl` (3rem) to create a bubbly, friendly entry point.
- **Interactive Elements:** Buttons and Chips always use a `pill-shape` radius to reinforce the soft, approachable vibe. 
- **Icons:** All iconography must feature rounded caps and corners to match the Quicksand typeface.

## Components
- **Primary Buttons:** Pill-shaped, filled with `Matcha Primary`, text in `Latte Brown`. Use a slight "bounce" hover animation.
- **Study Cards:** `Cream Yellow` background with `4xl` corners. Include a subtle `Latte Brown` 1px border at 10% opacity for definition.
- **Vocabulary Chips:** Small pill-shaped containers using `Matcha Soft` background and `Lexend` bold labels.
- **Input Fields:** Extra padded with `5xl` rounded corners. The focus state should change the border from a light latte tint to a solid `Matcha Primary`.
- **Mascot Indicators:** Small "Bear" or "Leaf" icons that appear next to completed tasks or at the end of progress bars.
- **Progress Bars:** Thick, pill-shaped tracks in `Matcha Soft` with the active progress in `Matcha Primary`, often ending with a leaf-shaped cap.
- **Checkboxes:** Rounded squares (8px radius) that fill with a matcha leaf icon when selected.