(() => {
  const calendar = document.querySelector('[data-events-calendar]');
  if (!calendar) return;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[char]);
  const formatDate = (date) => new Intl.DateTimeFormat('en-CA', {
    month: 'long', day: 'numeric', year: 'numeric'
  }).format(new Date(`${date}T12:00:00`));

  function renderMonth(year, month, eventsByDate) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let days = '<div class="events-calendar__weekdays">';
    days += weekdays.map(day => `<span class="events-calendar__weekday">${day}</span>`).join('');
    days += '</div><div class="events-calendar__days">';
    days += '<span class="events-calendar__blank"></span>'.repeat(firstDay);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const events = eventsByDate.get(key) || [];
      if (events.length) {
        const names = events.map(event => event.title).join(', ');
        days += `<button class="events-calendar__day events-calendar__day--event" type="button" data-event-date="${key}" aria-label="${escapeHtml(`${day}: ${names}`)}" title="${escapeHtml(names)}">${day}</button>`;
      } else {
        days += `<span class="events-calendar__day">${day}</span>`;
      }
    }
    return `<article class="events-calendar__month"><h4>${monthNames[month]}</h4>${days}</div></article>`;
  }

  function render(events) {
    const year = new Date().getFullYear();
    const eventsThisYear = events.filter(event => event.date && event.date.startsWith(`${year}-`));
    const eventsByDate = new Map();
    eventsThisYear.forEach(event => {
      const current = eventsByDate.get(event.date) || [];
      current.push(event);
      eventsByDate.set(event.date, current);
    });

    const months = monthNames.map((_, month) => renderMonth(year, month, eventsByDate)).join('');
    const list = eventsThisYear.length ? eventsThisYear.map(event => `
      <a class="events-calendar__event" href="${escapeHtml(event.url)}" target="_blank" rel="noopener">
        <span><span class="events-calendar__event-title">${escapeHtml(event.title)}</span><span class="events-calendar__event-meta">${escapeHtml(formatDate(event.date))}${event.time ? ` · ${escapeHtml(event.time)}` : ''}</span></span>
        <span class="events-calendar__event-arrow" aria-hidden="true">↗</span>
      </a>`).join('') : '<p class="events-calendar__empty">No Simply Events dates are scheduled for this year yet.</p>';

    calendar.innerHTML = `<div class="events-calendar__heading"><h3>${year} event calendar</h3><p class="events-calendar__count">${eventsThisYear.length} upcoming ${eventsThisYear.length === 1 ? 'event' : 'events'}</p></div><div class="events-calendar__months">${months}</div><div class="events-calendar__event-list">${list}</div>`;
    calendar.querySelectorAll('[data-event-date]').forEach(button => {
      button.addEventListener('click', () => {
        const event = (eventsByDate.get(button.dataset.eventDate) || [])[0];
        if (event?.url) window.open(event.url, '_blank', 'noopener');
      });
    });
  }

  fetch('api/events_feed.php', { headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : Promise.reject(response))
    .then(data => render(Array.isArray(data.events) ? data.events : []))
    .catch(() => {
      calendar.innerHTML = '<p class="events-calendar__error">The calendar is temporarily unavailable. Please check back shortly.</p>';
    });
})();
