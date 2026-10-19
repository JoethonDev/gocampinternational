(function () {
  var rows = document.getElementById('memory-rows');
  var template = document.getElementById('memory-template');
  var nextIndex = rows.children.length;
  function update() {
    var cards = Array.from(rows.children);
    cards.forEach(function (card, index) {
      card.querySelector('[data-memory-action="up"]').disabled = index === 0;
      card.querySelector('[data-memory-action="down"]').disabled = index === cards.length - 1;
    });
    document.getElementById('add-memory').disabled = cards.length >= 100;
  }
  document.getElementById('add-memory').addEventListener('click', function () {
    if (rows.children.length >= 100) return;
    rows.insertAdjacentHTML('beforeend', template.innerHTML.replace(/__INDEX__/g, String(nextIndex++)));
    rows.lastElementChild.querySelector('textarea').focus();
    update();
  });
  rows.addEventListener('click', function (event) {
    var button = event.target.closest('[data-memory-action]');
    if (!button) return;
    var row = button.closest('[data-memory-row]');
    if (button.dataset.memoryAction === 'remove') row.remove();
    if (button.dataset.memoryAction === 'up' && row.previousElementSibling) rows.insertBefore(row, row.previousElementSibling);
    if (button.dataset.memoryAction === 'down' && row.nextElementSibling) rows.insertBefore(row.nextElementSibling, row);
    update();
  });
  update();
})();
