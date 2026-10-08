You don't have to fix these. They show up only in development, and the components behave correctly.

What they mean: Lit warns you when a component changes one of its reactive properties inside updated() or firstUpdated(). That change makes the component render a second time right after it finished rendering. Lit's production build doesn't include these warnings, so npm run build won't show them.

Why your components do it: they need the rendered DOM before they know the value, so this is the case the warning text allows for ("unless the next update can only be scheduled as a side effect of the previous update"):

Component	Property set after render	Why it needs the DOM
kd-badge	textColor (kd-badge.ts:167)	Reads the computed background color to pick a contrasting text color
kd-button	textColor, hasIcon, hasLabel, hasBadge (kd-button.ts:279-332)	Same color lookup, plus checks which slots have content
kd-dialog	hasFooter (kd-dialog.ts:306, kd-dialog.ts:453)	Checks whether the footer slot has content
What it costs: each instance renders twice when it first appears. kd-badge and kd-button also run getComputedStyle, which forces the browser to calculate layout. With a few components you won't notice anything. A configurator that shows hundreds of buttons or badges would pay a small cost at startup.

If you want to remove the warnings, the cheapest fix is for textColor: don't store it as @state. Write the color straight onto the element, which needs no second render:


private updateContrastColor() {
  if (this.appearance !== "solid") { this.badgeEl.style.removeProperty("color"); return; }
  this.badgeEl.style.color = getContrastTextColor(getComputedStyle(this.badgeEl).backgroundColor);
}
The slot checks (hasIcon, hasLabel, hasBadge, hasFooter) are a reasonable use of a second render. To silence those, you could drop the calls in firstUpdated and rely on the @slotchange handlers you already have. Before relying on that, check in your target browsers that slotchange fires for content that was slotted from the start.

Do you want me to make the textColor change in kd-badge and kd-button?