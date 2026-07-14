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