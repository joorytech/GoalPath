---
name: GoalPath Lavender
colors:
  surface: '#fff7fc'
  surface-dim: '#e8d3ef'
  surface-bright: '#fff7fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fdefff'
  surface-container: '#fae8ff'
  surface-container-high: '#f7e1fe'
  surface-container-highest: '#f1dbf8'
  on-surface: '#23162b'
  on-surface-variant: '#4c444f'
  inverse-surface: '#392b41'
  inverse-on-surface: '#fcecff'
  outline: '#7d7480'
  outline-variant: '#cec3d1'
  surface-tint: '#774b99'
  primary: '#542a76'
  on-primary: '#ffffff'
  primary-container: '#6d428f'
  on-primary-container: '#e3bbff'
  inverse-primary: '#e1b6ff'
  secondary: '#744d97'
  on-secondary: '#ffffff'
  secondary-container: '#d9acfe'
  on-secondary-container: '#613b84'
  tertiary: '#004640'
  on-tertiary: '#ffffff'
  tertiary-container: '#006058'
  on-tertiary-container: '#6fdcce'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f2daff'
  primary-fixed-dim: '#e1b6ff'
  on-primary-fixed: '#2e004e'
  on-primary-fixed-variant: '#5d337f'
  secondary-fixed: '#f1dbff'
  secondary-fixed-dim: '#deb7ff'
  on-secondary-fixed: '#2d014f'
  on-secondary-fixed-variant: '#5b357d'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#fff7fc'
  on-background: '#23162b'
  surface-variant: '#f1dbf8'
  surface-lavender-light: '#E1CCE8'
  surface-lavender-deep: '#CCADD9'
  action-purple-primary: '#6D428F'
  action-purple-dark: '#532D75'
  progress-teal: '#0D9488'
  accent-amber: '#F59E0B'
typography:
  display-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 52px
  headline-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: IBM Plex Sans Arabic
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  gutter: 24px
  margin-mobile: 16px
  container-max: 1280px
---

## Brand & Style
The design system is anchored in a **Modern Minimalist** aesthetic with a strong emphasis on **Functional Professionalism**. It is designed to feel like an intelligent co-pilot—unobtrusive when you are focused, yet motivating and clear when providing AI-driven insights. 

The visual narrative prioritizes high readability and cognitive ease, utilizing ample whitespace to reduce stress. The updated color palette introduces a "Serene Tech" feel, replacing cold grays with calming lavender shades and deep purple accents. This shift softens the enterprise feel of the product while maintaining the reliability and structure of a professional coach. Key characteristics include high-contrast interactive elements, a structured RTL-first layout, and a soft, layered surface architecture that creates a sense of organized calm.

## Colors
The palette is centered on **Deep Purple** shades for actions and **Lavender** tones for surfaces. The Primary Action color (`#6D428F`) provides a sense of sophisticated wisdom and authority. 

**Surface Palette:** The background utilizes a tiered system of Lavenders. `#E1CCE8` serves as the primary workspace background, while `#CCADD9` is used for containers and structural division to provide subtle depth without harsh contrast.

**Accent Palette:** **Vibrant Teal** (`#0D9488`) remains the "Progress" color, used for achievement indicators and positive signals. **Soft Amber** (`#F59E0B`) acts as a motivational accent for AI-generated tips and "nudges." Text is set in a very dark purple-tinted slate to maintain WCAG AAA compliance while harmonizing with the lavender theme.

## Typography
The typography system relies on **IBM Plex Sans Arabic** for its clarity in professional contexts. It balances modern engineering with traditional Arabic script calligraphic roots, ensuring it feels native to RTL users.

- **Headlines:** Bold and authoritative, using tighter line-heights to create strong visual anchors for goal titles.
- **Body:** Open and airy with a generous line-height to ensure AI-generated descriptions and summaries are easy to parse.
- **Labels:** Utilizes medium weights for metadata like "Target Date" to ensure legibility at smaller sizes.

## Layout & Spacing
The layout follows an **8px grid system** to maintain mathematical harmony across the interface.

- **Desktop:** Employs a 12-column fixed grid with a maximum width of 1280px. A permanent sidebar (280px) houses navigation on the right side for RTL support.
- **Mobile:** Uses a fluid 4-column grid with 16px side margins. Key actions are moved to a fixed bottom navigation bar.
- **RTL Logic:** All horizontal spacing, icons with directionality, and progress bar fills must be mirrored. Progress bars fill from right to left.

## Elevation & Depth
This design system uses **Tonal Layering** combined with **Ambient Shadows** to define hierarchy.

1.  **Level 0 (Base):** `#E1CCE8` - The main canvas background.
2.  **Level 1 (Cards):** Pure white `#FFFFFF` or very light lavender `#F3EBF7` with a very soft, diffused shadow (`0px 4px 20px rgba(83, 45, 117, 0.08)`).
3.  **Level 2 (Modals):** Pure white with a more defined shadow tinted by the secondary action color to maintain the warmth of the palette.

Interactive elements use a slight "lift" on hover, emphasizing the tactile nature of the UI without breaking the minimalist aesthetic.

## Shapes
The shape language is characterized by **Soft Geometric** forms that complement the friendly lavender tones.

- **Primary Cards:** Use a `1rem` (16px) radius for a modern feel.
- **AI Insights/Banners:** Use a `1.5rem` (24px) radius to distinguish "Smart" content.
- **Buttons:** Use a `0.75rem` (12px) radius for professional accessibility.
- **Progress Trackers:** Containers should be fully rounded (pill-shaped).

## Components

- **Goal Cards:** Core component featuring title, AI badges, and progress bars. The progress bar uses the Teal accent on a muted lavender track.
- **Buttons:** 
    - *Primary:* Deep Purple (`#6D428F`) background with white text. 
    - *Secondary:* Teal outline with teal text for achievement actions.
    - *AI-Action:* Soft Amber subtle background with Deep Purple text.
- **Bottom Navigation:** High-contrast icons. Active state uses a Deep Purple underline.
- **Input Fields:** Borders set in `#CCADD9`. On focus, the border transitions to Primary Purple (`#6D428F`) with a soft glow.
- **AI "Pulse":** A small, animated teal glow used alongside AI-generated suggestions to signal active processing.