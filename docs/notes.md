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