/* One selection controller shared by the master programs list and dashboard cards.
   Selections persist through client-side filtering but are cleared on page reload. */
document.querySelectorAll('[data-bulk-list]').forEach(root => {
  const formId = root.dataset.bulkForm;
  const form = document.getElementById(formId);
  if (!form) return;
  const inputs = Array.from(root.querySelectorAll('.bulk-item-select'));
  const selectVisible = root.querySelector('.bulk-select-visible');
  const count = root.querySelector('.bulk-selected-count');
  const submit = form.querySelector('button[type=submit]');
  const action = form.querySelector('select[name=status]');
  function refresh() {
    const selected = inputs.filter(input => input.checked).length;
    if (count) count.textContent = selected + ' selected';
    if (submit) submit.disabled = selected === 0 || !action?.value;
    const visible = inputs.filter(input => !input.closest('[data-bulk-row]')?.classList.contains('d-none'));
    if (selectVisible) {
      selectVisible.checked = visible.length > 0 && visible.every(input => input.checked);
      selectVisible.indeterminate = visible.some(input => input.checked) && !selectVisible.checked;
    }
  }
  selectVisible?.addEventListener('change', () => {
    inputs.forEach(input => {
      if (!input.closest('[data-bulk-row]')?.classList.contains('d-none')) input.checked = selectVisible.checked;
    });
    refresh();
  });
  inputs.forEach(input => input.addEventListener('change', refresh));
  action?.addEventListener('change', refresh);
  form.addEventListener('submit', ev => {
    refresh();
    if (!inputs.some(input => input.checked) || !action?.value) { ev.preventDefault(); return; }
    const label = action.options[action.selectedIndex]?.textContent?.trim() || action.value;
    const count = inputs.filter(input => input.checked).length;
    if (!confirm('Apply "' + label + '" to ' + count + ' selected item(s)?')) ev.preventDefault();
  });
  root.addEventListener('bulk:filtered', refresh);
  refresh();
});
