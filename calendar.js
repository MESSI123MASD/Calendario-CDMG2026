// Calendario 2026 corregido - primer día de semana exacto (0=Dom)
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FIRST_DAY_OF_WEEK_2026 = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2]; // User's exact calendar: Mar1=Dom=0, Mar7=Sáb=6

let currentMonthIndex = 0;
let currentYear = 2026;
let eventsByDate = new Map();
let allEvents = [];

const calendarEl = document.querySelector('.calendar');
const monthTitleEl = document.querySelector('.month-title');
const prevBtn = document.querySelector('.prev-month');
const nextBtn = document.querySelector('.next-month');

function parseDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.length === 8) return dateStr.slice(0,4) + '-' + dateStr.slice(4,6) + '-' + dateStr.slice(6,8);
  if (dateStr.includes('T')) return dateStr.slice(0,10);
  return null;
}

async function loadEvents() {
  try {
    const response = await fetch('events.json');
    const events = await response.json();
    allEvents = events;
    eventsByDate.clear();
    events.forEach(event => {
      const dateKey = parseDate(event.inicio);
      if (dateKey) {
        let arr = eventsByDate.get(dateKey) || [];
        arr.push({titulo: event.titulo, calendario: event.calendario});
        eventsByDate.set(dateKey, arr);
      }
    });
    eventsByDate.forEach(arr => arr.sort((a,b) => a.titulo.localeCompare(b.titulo)));

    renderCalendar();
  } catch(e) { console.error(e); }
}

let searchTerm = '';

const searchInput = document.querySelector('.search-input');
const globalResults = document.getElementById('globalSearchResults');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchTerm = e.target.value.toLowerCase();
    renderCalendar();
    updateGlobalSearch();
  });
}

function updateGlobalSearch() {
  if (!searchTerm) {
    globalResults.style.display = 'none';
    return;
  }
  const matches = allEvents.filter(e => e.titulo.toLowerCase().includes(searchTerm));
  globalResults.innerHTML = '';
  const byDate = {};
  matches.forEach(e => {
    const dateKey = parseDate(e.inicio);
    if (dateKey && !byDate[dateKey]) byDate[dateKey] = [];
    const calId = e.calendario.match(/Calendario(\d)/)?.[1] || '1';
    byDate[dateKey]?.push({titulo: e.titulo, calId});
  });
  Object.keys(byDate).sort().forEach(date => {
    const dateDiv = document.createElement('div');
    dateDiv.style.marginBottom = '10px';
    dateDiv.innerHTML = `<strong>${date}</strong>`;
    byDate[date].sort((a,b) => a.titulo.localeCompare(b.titulo)).forEach(ev => {
      const evDiv = document.createElement('div');
      evDiv.className = `event cal${ev.calId}`;
      evDiv.style.fontSize = '12px';
      evDiv.style.margin = '2px 0';
      evDiv.textContent = ev.titulo;
      dateDiv.appendChild(evDiv);
    });
    globalResults.appendChild(dateDiv);
  });
  globalResults.style.display = Object.keys(byDate).length ? 'block' : 'none';
}

function renderCalendar() {
  const monthName = MONTH_NAMES[currentMonthIndex];
  const daysInMonth = DAYS_IN_MONTH[currentMonthIndex];
  const fDow = FIRST_DAY_OF_WEEK_2026[currentMonthIndex];

  monthTitleEl.textContent = `${monthName} ${currentYear}`;

  document.querySelectorAll('.day:not(.day-name)').forEach(d => d.remove());

  Array(fDow).fill(0).forEach(() => {
    const d = document.createElement('div');
    d.className = 'day prev-month';
    calendarEl.appendChild(d);
  });

  for(let day=1; day<=daysInMonth; day++) {
    const dayEl = document.createElement('div');
    dayEl.className = 'day';
    const monthStr = (currentMonthIndex+1).toString().padStart(2,'0');
    const dayStr = day.toString().padStart(2,'0');
    const key = `${currentYear}-${monthStr}-${dayStr}`;
    dayEl.innerHTML = `<div class="date">${day}</div>`;
    
    const dayEvents = eventsByDate.get(key) || [];
    const filteredEvents = searchTerm ? dayEvents.filter(ev => ev.titulo.toLowerCase().includes(searchTerm)) : dayEvents;
    
    filteredEvents.forEach(ev => {
      const eEl = document.createElement('div');
      const calId = ev.calendario.match(/Calendario(\d)/)?.[1] || '1';

      eEl.className = `event cal${calId}`;
      eEl.textContent = ev.titulo;
      dayEl.appendChild(eEl);
    });
    
    calendarEl.appendChild(dayEl);
  }

  const totalCells = fDow + daysInMonth;
  Array(42 - totalCells).fill(0).forEach(() => {
    const d = document.createElement('div');
    d.className = 'day next-month';
    calendarEl.appendChild(d);
  });
}

prevBtn.onclick = () => { currentMonthIndex = (currentMonthIndex - 1 + 12) % 12; renderCalendar(); };
nextBtn.onclick = () => { currentMonthIndex = (currentMonthIndex + 1) % 12; renderCalendar(); };

document.addEventListener('DOMContentLoaded', loadEvents);

