const fs = require('fs');
const calendarios = [ /* paste the calendars array from zoho-to-json.js */ ];
// Enhanced to expand RRULE cycles for 2026

async function expandEvent(start, rrule, title, cal) {
  // Simple weekly/monthly expander for 2026
  // Parse RRULE:FREQ=WEEKLY;BYDAY=WE for Miércoles de Misiones etc.
  const startDate = new Date(start.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
  const events = [];
  const endYear = new Date('2027-01-01');
  
  if (rrule && rrule.includes('WEEKLY')) {
    for (let d = new Date(startDate); d < endYear; d.setDate(d.getDate() + 7)) {
      if (d.getFullYear() === 2026) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2,'0');
        const day = String(d.getDate()).padStart(2,'0');
        events.push({calendario: cal, titulo: title, inicio: `${y}${m}${day}`, fin: ''});
      }
    }
  }
  return events;
}

// Get full events with cycles
async function getFullEvents() {
  const allEvents = [];
  for (const cal of calendarios) {
    const res = await fetch(cal.url);
    const text = await res.text();
    const blocks = text.split('BEGIN:VEVENT');
    blocks.forEach(block => {
      const titleMatch = block.match(/SUMMARY:(.*?)\\n/);
      const startMatch = block.match(/DTSTART;VALUE=DATE:(\d{8})/) || block.match(/DTSTART:(\d{8})/);
      const rruleMatch = block.match(/RRULE:(.*?)$/m);
      if (titleMatch && startMatch) {
        const title = titleMatch[1].trim();
        const start = startMatch[1];
        const rrule = rruleMatch ? rruleMatch[1] : null;
        // Add base event
        allEvents.push({calendario: cal.nombre, titulo, inicio: start, fin: '', descripcion: ''});
        // Expand if RRULE
        if (rrule) {
          const expanded = expandEvent(start, rrule, title, cal.nombre);
          allEvents.push(...expanded);
        }
      }
    });
  }
  return allEvents;
}

async function saveExpanded() {
  const events = await getFullEvents();
  fs.writeFileSync('events-full.json', JSON.stringify(events, null, 2));
  console.log(`Expanded: ${events.length} eventos (incluye ciclos 2026)`);
}

saveExpanded();

