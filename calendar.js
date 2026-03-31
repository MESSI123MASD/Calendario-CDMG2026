// Calendario 2026 con soporte para eventos recurrentes
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FIRST_DAY_OF_WEEK_2026 = [4, 0, 0, 3, 5, 1, 3, 6, 2, 4, 0, 2];

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

// Función para expandir eventos recurrentes
// Expande eventos recurrentes según el tipo
function expandRecurringEvent(event) {
  // Si no hay recurrencia, devolver solo el evento original
  if (!event.recurrence) return [event];

  let recurrence = event.recurrence;
  let type, interval, weekday, week;

  // Si recurrence es un objeto (nuevo formato)
  if (typeof recurrence === 'object') {
    type = recurrence.type;
    interval = recurrence.interval || 1;
    weekday = recurrence.weekday;
    week = recurrence.week;
  } else {
    // Mantener compatibilidad con strings simples
    type = recurrence;
    interval = 1;
    weekday = event.weekday;
    week = event.week;
  }

  // --- Caso weekly ---
  if (type === 'weekly') {
    const startDate = parseDate(event.inicio);
    if (!startDate) return [event];
    const endDate = parseDate(event.fin) || startDate;
    const durationDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    const expanded = [];
    let current = new Date(startDate);
    const endOfYear = new Date(currentYear, 11, 31);
    while (current <= endOfYear) {
      const formattedStart = current.toISOString().slice(0,10).replace(/-/g, '');
      const formattedEnd = new Date(current.getTime() + durationDays * 86400000).toISOString().slice(0,10).replace(/-/g, '');
      expanded.push({ ...event, inicio: formattedStart, fin: formattedEnd });
      current.setDate(current.getDate() + 7);
    }
    return expanded;
  }

  // --- Caso monthly_weekday (n-ésimo día de la semana, con intervalo) ---
  if (type === 'monthly_weekday') {
    // Validar que tengamos los datos necesarios
    if (weekday === undefined || week === undefined) {
      console.warn(`Evento "${event.titulo}" tiene recurrence monthly_weekday pero faltan weekday o week.`);
      return [event];
    }

    const startDate = parseDate(event.inicio);
    if (!startDate) return [event];

    const endDate = parseDate(event.fin) || startDate;
    const durationDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    const expanded = [];
    const startYear = new Date(startDate).getFullYear();
    const endYear = currentYear;
    const startMonth = new Date(startDate).getMonth();

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        // Aplicar intervalo: solo meses que estén a interval meses del mes de inicio
        if (interval > 1) {
          const diffMonths = month - startMonth;
          // Si el mes es anterior al inicio, se salta
          if (diffMonths < 0) continue;
          if (diffMonths % interval !== 0) continue;
        }

        const date = getNthWeekdayOfMonth(year, month, weekday, week);
        if (date && date >= new Date(startDate) && date <= new Date(endYear, 11, 31)) {
          const formattedStart = date.toISOString().slice(0,10).replace(/-/g, '');
          const formattedEnd = new Date(date.getTime() + durationDays * 86400000).toISOString().slice(0,10).replace(/-/g, '');
          expanded.push({ ...event, inicio: formattedStart, fin: formattedEnd });
          console.log(`Expandiendo: ${event.titulo} en ${formattedStart}`); // Log para depurar
        }
      }
    }
    return expanded;
  }

  // --- Caso monthly_last_weekday (último día de la semana, con intervalo) ---
  if (type === 'monthly_last_weekday') {
    if (weekday === undefined) {
      console.warn(`Evento "${event.titulo}" tiene recurrence monthly_last_weekday pero falta weekday.`);
      return [event];
    }

    const startDate = parseDate(event.inicio);
    if (!startDate) return [event];

    const endDate = parseDate(event.fin) || startDate;
    const durationDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);
    const expanded = [];
    const startYear = new Date(startDate).getFullYear();
    const endYear = currentYear;
    const startMonth = new Date(startDate).getMonth();

    for (let year = startYear; year <= endYear; year++) {
      for (let month = 0; month < 12; month++) {
        if (interval > 1) {
          const diffMonths = month - startMonth;
          if (diffMonths < 0) continue;
          if (diffMonths % interval !== 0) continue;
        }

        const date = getLastWeekdayOfMonth(year, month, weekday);
        if (date && date >= new Date(startDate) && date <= new Date(endYear, 11, 31)) {
          const formattedStart = date.toISOString().slice(0,10).replace(/-/g, '');
          const formattedEnd = new Date(date.getTime() + durationDays * 86400000).toISOString().slice(0,10).replace(/-/g, '');
          expanded.push({ ...event, inicio: formattedStart, fin: formattedEnd });
          console.log(`Expandiendo: ${event.titulo} en ${formattedStart}`);
        }
      }
    }
    return expanded;
  }

  // Si llegamos aquí, tipo no reconocido
  console.warn(`Tipo de recurrencia no soportado: ${type}`);
  return [event];
}
// Función auxiliar: obtiene la fecha del n-ésimo día de la semana en un mes
function getNthWeekdayOfMonth(year, month, weekday, weekNumber) {
  // month: 0-11, weekday: 0-6 (domingo a sábado)
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  let targetDay = 1 + (weekday - firstWeekday + 7) % 7; // primer día de la semana objetivo
  targetDay += (weekNumber - 1) * 7;
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  if (targetDay > lastDayOfMonth) return null;
  return new Date(year, month, targetDay);
}

// Función auxiliar: obtiene la fecha del último día de la semana en un mes
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();
  // La diferencia correcta: desde el último día hasta el día buscado
  let offset = (lastWeekday - weekday + 7) % 7;
  return new Date(year, month, lastDay.getDate() - offset);
}
async function loadEvents() {
  try {
    const response = await fetch('events.json');
    const events = await response.json();

    // Expandir todos los eventos recurrentes
    let allExpanded = [];
    events.forEach(ev => {
      const expanded = expandRecurringEvent(ev);
      allExpanded.push(...expanded);
    });

    allEvents = allExpanded;
    eventsByDate.clear();
    allEvents.forEach(event => {
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

// ... (el resto del código, searchInput, renderCalendar, etc. se mantiene igual)
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

