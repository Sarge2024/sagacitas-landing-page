# Design System Document: The Industrial Architect

## 1. Overview & Creative North Star
**Creative North Star: "The Digital Architect"**
This design system moves Sagacitas Consulting away from "generic corporate blue" and into the realm of high-end, industrial precision. It treats digital space as physical architecture—relying on structural depth, tonal layering, and an editorial typographic scale to convey authoritative intelligence.

To break the "standard template" feel, we employ **Intentional Asymmetry**. Hero sections should utilize "offset" layouts where text and imagery overlap slightly across background shifts. This creates a bespoke, high-touch experience that suggests a consultant's meticulous eye for detail. The goal is a UI that feels constructed, not just rendered.

---

## 2. Colors & Surface Philosophy
The palette is rooted in a deep, authoritative `primary` (#002630) and anchored by a sophisticated range of `surface` tones.

### The "No-Line" Rule
Designers are strictly prohibited from using 1px solid borders to define sections. Content boundaries must be achieved through:
*   **Background Shifts:** Moving from `surface` (#f8fafb) to `surface-container-low` (#f2f4f5).
*   **Tonal Nesting:** A card using `surface-container-lowest` (#ffffff) sitting inside a `surface-container` (#eceeef) wrapper.

### The Glass & Gradient Rule
To inject "visual soul" into a cold industrial aesthetic:
*   **Floating Elements:** Use Glassmorphism for navigation bars or floating modals. Apply `surface` at 70% opacity with a `backdrop-blur` of 20px.
*   **Signature Textures:** For high-impact CTAs, use a subtle linear gradient (135°) from `primary` (#002630) to `primary_container` (#003d4c). This creates a "metallic luster" feel appropriate for a high-tech consultancy.

---

## 3. Typography: Editorial Authority
We use a dual-font strategy to balance industrial strength with modern technological fluidity.

*   **Display & Headlines (Manrope):** Chosen for its geometric precision. Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to create an "Editorial Masthead" effect. Headlines should be bold and unapologetic, often serving as the primary visual element in a section.
*   **Body & Labels (Inter):** The workhorse for reliability. Inter’s high x-height ensures legibility in complex data environments. Use `body-lg` (1rem) for standard reading and `label-md` (0.75rem) for technical metadata.
*   **Hierarchy Note:** Always pair a `headline-lg` with a wide-margin `body-md`. The contrast between the massive headline and the functional body text mimics high-end consultancy reports.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are largely replaced by **Tonal Layering**, mimicking the overlapping planes seen in the Sagacitas logo.

*   **The Layering Principle:** Depth is "stacked." Place `surface_container_highest` (#e1e3e4) elements beneath `surface_container_low` (#f2f4f5) elements to create a recessed or elevated effect without using lines.
*   **Ambient Shadows:** If a card must float, use an "Ambient Shadow": `box-shadow: 0 20px 40px rgba(25, 28, 29, 0.06)`. The shadow color must be a tint of `on_surface` (#191c1d), never pure black.
*   **Ghost Borders:** For accessibility on interactive inputs, use `outline_variant` (#c0c8cb) at 20% opacity. This provides a "suggestion" of a border that vanishes into the white space.

---

## 5. Components
Each component must reflect the "Industrial Architect" aesthetic: clean, sharp, and intentional.

### Buttons (The Action Anchors)
*   **Primary:** `primary` (#002630) background with `on_primary` (#ffffff) text. Use `roundedness-sm` (0.125rem) for a sharp, technical feel.
*   **Tertiary/Ghost:** No background. Use `on_tertiary_fixed_variant` (#00504a) for text. On hover, apply a `surface_variant` (#e1e3e4) background at 40% opacity.

### Inputs & Fields
*   **Style:** No 4-sided borders. Use a `surface_container_high` (#e6e8e9) background with a 2px bottom-accent in `primary`.
*   **State:** Error states must use `error` (#ba1a1a) for the bottom accent and helper text.

### Cards & Lists
*   **Rule:** Dividers are forbidden. Separate list items using `spacing-md` and subtle background toggles between `surface` and `surface_container_lowest`.
*   **Asymmetric Cards:** For "Services" sections, use cards of varying heights (e.g., 400px vs 440px) to break the grid and create a custom, gallery-style layout.

### Contextual Accents (Technology)
Use `tertiary_fixed` (#79f7ea) for "actionable technology" indicators—small pips, active toggle states, or progress bars. This "Mint/Tech" accent should be used sparingly (less than 5% of the screen) to maintain its impact.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use massive amounts of whitespace (`surface`). If a section feels crowded, double the padding.
*   **Do** overlap elements. Let the Sagacitas logo "float" over a transition between two background colors.
*   **Do** use the `roundedness-sm` scale. Sharp corners convey industrial precision; overly rounded corners feel "consumer" and soft.

### Don't:
*   **Don't** use 1px solid black or grey borders. They clutter the UI and feel dated.
*   **Don't** use standard "drop shadows" (e.g., 0 2px 4px). They lack the sophistication of tonal layering.
*   **Don't** use the orange/mint accents for large areas. They are "technological sparks," not primary brand colors. Use them to guide the eye to the most important action.