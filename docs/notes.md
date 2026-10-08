XS: 2px (Checkboxes, badges)
S: 4px (Small buttons, input fields)
M: 8px (Standard cards, dropdown menus)
L: 16px (Modals, large containers)
Full: 9999px (Pill-shaped tags or profile circles

$$\text{Inner Radius} = \text{Outer Radius} - \text{Padding}$$If a large promo card has a border radius of 24px and an internal padding of 16px, any button nestled flush against that corner needs a radius of exactly 8px to look visually perfect.

web components have a flash of unstyled content and that issue needs to be solved with a script at the very beginning of the page load

Tailwind Token,rem Value,Pixel Equivalent (at 16px root),Common Use Case
p-1,0.25rem,4px,"Tight spacing, badge padding"
p-2,0.5rem,8px,"Small buttons, card item spacing"
p-4,1rem,16px,"Standard button padding, list items"
p-6,1.5rem,24px,"Card padding, small container padding"
p-8,2rem,32px,"Main section padding, large hero layout"

This is more of a design question than something to dig through code for, so here's the short answer:

Yes — fade is the standard pattern, but the mechanics matter more than the fade itself:

Don't wait for "fully loaded" to start the transition. Trigger the fade the moment your app is interactive (critical data/assets ready), not when everything (analytics, lazy images, etc.) is done. Waiting for 100% makes loads feel slower than they are.

Cross-fade, don't just fade-out-then-in. Mount the real app underneath the cover while it's still loading (opacity 0 or behind it), then fade the cover's opacity to 0 over ~200-300ms while the app is already rendered. Avoids a blank flash between "cover gone" and "app visible."

Fade + slight scale/blur reads more polished than opacity alone — e.g. cover fades out while scaling to 1.02 or blurring slightly, gives a subtle "reveal" feel rather than a flat crossfade. Optional, not required.

Remove from DOM after the transition, not before. Use transitionend (or a timeout matching your duration) to set display: none / unmount — don't rely on opacity alone, since a transparent-but-present cover still blocks clicks/scroll unless you also toggle pointer-events: none immediately when the fade starts.

Respect prefers-reduced-motion — swap the fade for an instant or near-instant (~50ms) opacity change.

Minimum display time guard is worth adding if load can be very fast — a cover that flashes for 80ms then vanishes feels glitchier than no cover at all. Common pattern: show cover only if load exceeds ~150-200ms, and once shown, keep it for a minimum ~300-400ms so it doesn't feel like a flicker.

Typical duration: 200-400ms ease-out for the fade itself.

Given you're mid-way on a kd-progress-bar and starting a loader component — do you want this loader to be a full-screen "cover" (splash-style, blocks the whole app) or a component-scoped loading state? That changes whether pointer-events/z-index/unmount logic needs to live at the app-shell level or can be local to the component.



# Components left to maked:
- Toast -> finalize the closing as a button of a vector graphic instead of an x
- text input
- slider input
- color picker
- copy button
- progress buttons
- select component
- switch input
- text area
- buttons need to be based on rem for height



## Notes on shadows
- kd-shadow-s	Small shadow for subtle elevation (e.g., cards, inputs)	
- kd-shadow-m	Medium shadow for moderate elevation (e.g., dropdowns, popovers)	
- kd-shadow-l	Large shadow for high elevation (e.g., dialogs, drawers)

# notes on headers
headers will always be 64 pixels for us

for example

The 2 Core Tests to Decide Between 300 and 400
To place your color accurately, evaluate it against two technical standards:Test 1: The WCAG Contrast Rule (3:1 vs. 4.5:1)This is the most objective test. Calculate the contrast ratio of your color against a white background (#FFFFFF):If contrast is between 2.0:1 and 3.0:1 It belongs at brand-300UI Role: Too light for solid text or primary buttons. It is used for decorative graphics, subtle borders, card outlines, or disabled/passive states.If contrast is between 3.0:1 and 4.5:1 It belongs at brand-400UI Role: Meets WCAG AA for large UI elements and graphical components (like input borders, active toggles, icons, or primary buttons that use black text).

The next thing you learn is that all the dynanic logic part exists during theme creation not during theme interpretation

for controls rad = 0.375 * 1rem
for panels rad = 0.75 * 1 rem


## Notes on Padding

3. Spatial Layout Systems (The 8pt Grid)
Modern UI design systems enforce consistent internal padding and spacing using an 8pt (or 4pt) spatial grid system. All padding, margin, and control dimensions should be multiples of 8 (or 4 for smaller components):

Internal Control Padding (Inside a button or input):

Compact: 4px vertical / 8px horizontal

Standard: 8px vertical / 16px horizontal

Large/Touch: 12px vertical / 24px horizontal

External Control Spacing (Between adjacent buttons/inputs):

Tight (Related items, e.g., icon + text): 4px – 8px

Standard (Sibling controls, e.g., Cancel vs. Save): 12px – 16px

Loose (Distinct form sections or button groups): 24px – 32px

4. Gestalt Law of Proximity
The spacing between controls conveys their functional relationship:

Padding within a group (e.g., between "Submit" and "Cancel") should always be significantly smaller than the padding between separate groups (e.g., between the form fields and the action buttons).
Always keep space between control groups at least 1.5× to 2× larger than the space between controls within the same group.

buttons have 6 states:
default 
hover
focus state
pressed state
loading state
disabled state

## WIP
- colors are not finalized for example warning color badges do not have the appropriate amount of context with it's background
- I am missing 2 button variants filled and outlined-filled and my color systems needs more depth for to handle contrast appropriately




## Feedback from Claude on UX
Fix first
The "Incomplete" badge has white text on yellow, about 1.7:1 contrast. The WCAG minimum for text is 4.5:1. The contrast helper itself is correct. The problem is that kd-badge measures its background during the first render and gets the wrong colour. After the page loaded, I switched the badge's variant away and back to warning, and it re-measured and chose black. So any solid badge can end up with the wrong text colour on first load. kd-button measures its colour the same way, so it may be affected too; I only checked the badge. I haven't found the cause yet. A likely suspect is transition: all on the badge's inner element, but that's a guess.
The status disagrees with the selection. Ballistic Blue is already selected under Fabric, yet the header says "Incomplete". Either the default selection or the status is wrong, and users will doubt both.
The heading order is wrong. kd-accordion-item puts its header in an <h3>, and the panel then contains an <h2>Fabric</h2>. That repeats the accordion label in large type and puts a higher-level heading inside a lower-level one. Remove the <h2>, or make it a small label such as "Choose a fabric".
Layout and hierarchy
The selected option isn't named anywhere. Swatches are only images, so users can't see what "Ballistic Blue" is called. Show the current choice under the grid ("Ballistic Blue") and in the accordion header ("Fabric · Ballistic Blue"). That also lets a collapsed section show its state without a badge.
The status markers are inconsistent. Fabric uses a text pill and Frame uses an icon-only check. Use one pattern for every section, either both icons or both short text. Icon-only status also needs hidden text so screen-reader users hear it.
The footer gives every action the same weight, and the main button is in the wrong place. Five equal outlined icon buttons sit before "Get Quote", which is at the far left on desktop. On a phone it drops to its own line, still on the left. Put "Get Quote" on the right, below the options panel, as the end of the flow. Group the four secondary actions (image, PDF, AR, share) so they read as one cluster. On a phone, make "Get Quote" full width.
The "+" button's meaning isn't visible. A brand-coloured outlined "+" next to the project folder only explains itself in a tooltip, and phones have no hover. Give it a label such as "Add to project", or merge it with the project button.
The top-left menu icon has no label or purpose. It's an unlabeled icon-only button in a corner, and it doesn't line up with the drawer's header row. Give it an aria-label and a tooltip, or remove it if it's a placeholder.
Visual polish
--kd-color-brand is pure #0000ff. It's the strongest colour on the page and looks like a default value. If it's a placeholder, generate-color-scale.js can produce a proper brand scale.
The viewer area is empty. Even in a test page, an outline of the product plus its name and price would show whether the layout balances against the drawer. Right now nothing on the left holds the eye.
Small clean-ups in the page's CSS:
Two body rules set conflicting font sizes (var(--kd-font-size-md) and 16px).
<link rel="script" href="main.js"> isn't a valid link type, and the plugin already adds the real script tag, so delete it.
The inline style="display:flex; width:100%" on the headers could be a class.