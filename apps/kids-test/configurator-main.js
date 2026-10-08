async function loadOptions() {
  const [products, groups] = await Promise.all([
    fetch('data/product_options.json').then((r) => r.json()),
    fetch('data/group_options.json').then((r) => r.json()),
  ]);
  return { products, groups };
}

// One accordion item per product option, headed by its enhanced description
function renderProductOptions(accordion, products) {
  for (const option of products) {
    const item = document.createElement('kd-accordion-item');
    // Kept for wiring the item to its group_options later
    item.dataset.groupId = option.groupId;

    const header = document.createElement('span');
    header.slot = 'header';
    // textContent, not innerHTML: the description is data, not markup
    header.textContent = option.EnhancedDescription;

    item.append(header);
    accordion.append(item);
  }
}

// Loaded only by configurator.html; the guard keeps it safe if the markup changes
const accordion = document.querySelector('.drawer-content kd-accordion');
loadOptions().then(({ products }) => renderProductOptions(accordion, products));
