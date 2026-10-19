(function () {
  document.querySelectorAll('.camp-memories').forEach(function (section) {
    var track = section.querySelector('.camp-memories-track');
    var buttons = section.querySelectorAll('[data-memories-direction]');
    if (!track || buttons.length !== 2) return;
    function update() {
      buttons.forEach(function (button) { button.hidden = track.scrollWidth <= track.clientWidth + 2; });
      buttons[0].disabled = track.scrollLeft <= 2;
      buttons[1].disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    }
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var card = track.querySelector('.camp-memory');
        var distance = card.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
        track.scrollBy({ left: Number(button.dataset.memoriesDirection) * distance,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      });
    });
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
