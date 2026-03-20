// Configuration & State
const state = {
  currentDate: new Date(),
  language: localStorage.getItem('app-lang') || 'as',
  theme: localStorage.getItem('app-theme') || 'light',
  events: JSON.parse(localStorage.getItem('app-events') || '[]'),
  editingEventId: null
};

// Date Utilities (from date-utils.ts)
const ASSAMESE_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ASSAMESE_MONTHS = [
  'ব’হাগ (Bohag)', 'জেঠ (Jeth)', 'আহাৰ (Ahaar)', 'শাওণ (Saon)',
  'ভাদ (Bhado)', 'আহিন (Ahin)', 'কাতি (Kati)', 'আঘোণ (Aghon)',
  'পুহ (Puh)', 'মাঘ (Magh)', 'ফাগুন (Phagun)', 'চ’ত (Chot)'
];
const ASSAMESE_WEEKDAYS = ['দেওবাৰ', 'সোমবাৰ', 'মঙ্গলবাৰ', 'বুধবাৰ', 'বৃহস্পতিবাৰ', 'শুক্ৰবাৰ', 'শনিবাৰ'];
const ENGLISH_MONTHS = [
  'Bohag', 'Jeth', 'Ahaar', 'Saon',
  'Bhado', 'Ahin', 'Kati', 'Aghon',
  'Puh', 'Magh', 'Phagun', 'Chot'
];
const ENGLISH_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toAssameseNumeral(num) {
  if (num === null || num === undefined) return '';
  return num.toString().split('').map(char => {
    const digit = parseInt(char, 10);
    return isNaN(digit) ? char : ASSAMESE_DIGITS[digit];
  }).join('');
}

function getAssameseDateApprox(date) {
  const month = date.getMonth();
  const day = date.getDate();
  let asMonthIdx = 0;
  let asDay = 1;

  if ((month === 3 && day >= 14) || (month === 4 && day <= 14)) { asMonthIdx = 0; asDay = month === 3 ? day - 13 : day + 17; }
  else if ((month === 4 && day >= 15) || (month === 5 && day <= 15)) { asMonthIdx = 1; asDay = month === 4 ? day - 14 : day + 16; }
  else if ((month === 5 && day >= 16) || (month === 6 && day <= 16)) { asMonthIdx = 2; asDay = month === 5 ? day - 15 : day + 15; }
  else if ((month === 6 && day >= 17) || (month === 7 && day <= 16)) { asMonthIdx = 3; asDay = month === 6 ? day - 16 : day + 15; }
  else if ((month === 7 && day >= 17) || (month === 8 && day <= 16)) { asMonthIdx = 4; asDay = month === 7 ? day - 16 : day + 15; }
  else if ((month === 8 && day >= 17) || (month === 9 && day <= 17)) { asMonthIdx = 5; asDay = month === 8 ? day - 16 : day + 14; }
  else if ((month === 9 && day >= 18) || (month === 10 && day <= 16)) { asMonthIdx = 6; asDay = month === 9 ? day - 17 : day + 14; }
  else if ((month === 10 && day >= 17) || (month === 11 && day <= 15)) { asMonthIdx = 7; asDay = month === 10 ? day - 16 : day + 14; }
  else if ((month === 11 && day >= 16) || (month === 0 && day <= 14)) { asMonthIdx = 8; asDay = month === 11 ? day - 15 : day + 16; }
  else if ((month === 0 && day >= 15) || (month === 1 && day <= 13)) { asMonthIdx = 9; asDay = month === 0 ? day - 14 : day + 17; }
  else if ((month === 1 && day >= 14) || (month === 2 && day <= 14)) { asMonthIdx = 10; asDay = month === 1 ? day - 13 : day + 15; }
  else if ((month === 2 && day >= 15) || (month === 3 && day <= 13)) { asMonthIdx = 11; asDay = month === 2 ? day - 14 : day + 17; }

  const asYear = date.getFullYear() + (month > 3 || (month === 3 && day >= 14) ? -593 : -594);
  return { monthIndex: asMonthIdx, day: asDay, year: asYear };
}

// Pre-seeded Festivals (from festivals.ts)
function getAssameseFestivals(year) {
  return [
    { id: `fest-${year}-1`, name: "Rongali Bihu (Bohag Bihu)", nameAssamese: "ৰঙালী বিহু (বহাগ বিহু)", gregorianDate: `${year}-04-14`, category: "festival" },
    { id: `fest-${year}-2`, name: "Bihu Sanmilan", nameAssamese: "বিহু সন্মিলন", gregorianDate: `${year}-04-15`, category: "festival" },
    { id: `fest-${year}-3`, name: "Bhogali Bihu (Magh Bihu)", nameAssamese: "ভোগালী বিহু (মাঘ বিহু)", gregorianDate: `${year}-01-14`, category: "festival" },
    { id: `fest-${year}-4`, name: "Kongali Bihu (Kati Bihu)", nameAssamese: "কঙালী বিহু (কাতি বিহু)", gregorianDate: `${year}-10-18`, category: "festival" },
    { id: `fest-${year}-5`, name: "Assamese New Year", nameAssamese: "অসমীয়া নৱবৰ্ষ", gregorianDate: `${year}-04-14`, category: "festival" },
    { id: `fest-${year}-6`, name: "Durga Puja", nameAssamese: "দুৰ্গা পূজা", gregorianDate: `${year}-10-12`, category: "festival" },
    { id: `fest-${year}-7`, name: "Diwali", nameAssamese: "দীপাৱলী", gregorianDate: `${year}-11-01`, category: "festival" },
    { id: `fest-${year}-8`, name: "Eid ul-Fitr", nameAssamese: "ঈদ-উল-ফিতৰ", gregorianDate: `${year}-03-31`, category: "festival" },
    { id: `fest-${year}-9`, name: "Christmas", nameAssamese: "বৰদিন", gregorianDate: `${year}-12-25`, category: "festival" },
    { id: `fest-${year}-10`, name: "Republic Day", nameAssamese: "গণৰাজ্য দিৱস", gregorianDate: `${year}-01-26`, category: "festival" },
    { id: `fest-${year}-11`, name: "Independence Day", nameAssamese: "স্বাধীনতা দিৱস", gregorianDate: `${year}-08-15`, category: "festival" },
    { id: `fest-${year}-12`, name: "Tithi Bihu", nameAssamese: "তিথি বিহু", gregorianDate: `${year}-04-16`, category: "festival" },
  ];
}

// Localization
const i18n = {
  en: {
    'app.title': 'Assamese Calendar', 'app.subtitle': "",
    'app.title_pt1': 'Assamese', 'app.title_pt2': 'Calendar',
    'nav.menu': 'MENU', 'nav.calendar': 'Calendar', 'nav.events': 'My Events', 'nav.translator': 'Assamese Translator',
    'events.subtitle': '',
    'btn.add_event': 'Add Event', 'btn.today': 'Today', 'btn.save': 'Save', 'btn.cancel': 'Cancel',
    'lbl.upcoming': 'Upcoming Events', 'lbl.no_events': 'No upcoming events', 'lbl.today': 'Today',
    'motif.title': 'Assamese New Year', 'motif.desc': 'Assamese New Year approaches in Bohag',
    'form.title': 'Event Title', 'form.date': 'Date', 'form.time': 'Time', 'form.category': 'Category',
    'form.desc': 'Description', 'form.notify': 'Enable Notifications',
    'toast.created': 'Event created successfully', 'toast.updated': 'Event updated', 'toast.deleted': 'Event deleted'
  },
  as: {
    'app.title': 'অসমীয়া কেলেণ্ডাৰ', 'app.subtitle': '',
    'app.title_pt1': 'অসমীয়া', 'app.title_pt2': 'কেলেণ্ডাৰ',
    'nav.menu': 'MENU', 'nav.calendar': 'কেলেণ্ডাৰ', 'nav.events': 'মোৰ অনুষ্ঠানবোৰ', 'nav.translator': 'অসমীয়া অনুবাদক',
    'events.subtitle': '',
    'btn.add_event': 'নতুন অনুষ্ঠান', 'btn.today': 'আজি', 'btn.save': 'সংৰক্ষণ কৰক', 'btn.cancel': 'বাতিল',
    'lbl.upcoming': 'আগন্তুক অনুষ্ঠান', 'lbl.no_events': 'কোনো অনুষ্ঠান নাই', 'lbl.today': 'আজি',
    'motif.title': 'অসমীয়া নৱবৰ্ষ', 'motif.desc': 'বহাগ মাহত অসমীয়া নৱবৰ্ষ আহি আছে',
    'form.title': 'শিৰোনাম', 'form.date': 'তাৰিখ', 'form.time': 'সময়', 'form.category': 'শ্ৰেণী',
    'form.desc': 'বিৱৰণ', 'form.notify': 'জাননী সক্ৰিয় কৰক',
    'toast.created': 'অনুষ্ঠান সফলতাৰে সৃষ্টি কৰা হৈছে', 'toast.updated': 'অনুষ্ঠান সলনি কৰা হৈছে', 'toast.deleted': 'অনুষ্ঠান বিলোপ কৰা হৈছে'
  }
};

function translatePage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (i18n[state.language][key]) el.textContent = i18n[state.language][key];
  });
  const langText = document.getElementById('lang-text');
  if (langText) langText.textContent = state.language.toUpperCase();
}

function toggleLanguage() {
  state.language = state.language === 'en' ? 'as' : 'en';
  localStorage.setItem('app-lang', state.language);
  translatePage();
  if (typeof renderTodayCard === 'function') renderTodayCard();
  renderCalendarGrid();
  renderUpcomingEvents();
  if (typeof renderEventsPageGrid === 'function') renderEventsPageGrid();
}

function applyTheme() {
  if (state.theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.querySelector('.theme-icon-moon').classList.add('hidden');
    document.querySelector('.theme-icon-sun').classList.remove('hidden');
  } else {
    document.documentElement.classList.remove('dark');
    document.querySelector('.theme-icon-moon').classList.remove('hidden');
    document.querySelector('.theme-icon-sun').classList.add('hidden');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  localStorage.setItem('app-theme', state.theme);
  applyTheme();
}

// Database Wrapper
const DB = {
  save() { localStorage.setItem('app-events', JSON.stringify(state.events)); },
  create(event) {
    event.id = 'evt-' + Date.now();
    state.events.push(event);
    this.save();
    return event;
  },
  update(id, data) {
    const idx = state.events.findIndex(e => e.id === id);
    if (idx > -1) { state.events[idx] = { ...state.events[idx], ...data }; this.save(); }
  },
  delete(id) {
    state.events = state.events.filter(e => e.id !== id);
    this.save();
  }
};

// Toast Notifications
function showToast(message, isError = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'destructive' : ''}`;
  toast.innerHTML = `<i data-lucide="${isError ? 'alert-circle' : 'check-circle'}" class="w-5 h-5"></i> <span>${message}</span>`;
  container.appendChild(toast);
  lucide.createIcons();
  setTimeout(() => toast.style.opacity = '0', 3000);
  setTimeout(() => toast.remove(), 3300);
}

// Dates Formatting
function formatDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function formatMonthYear(date) {
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// Rendering
function renderCalendarGrid() {
  if (!document.getElementById('calendar-title')) return;
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const todayDateStr = formatDateString(new Date());

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const endDate = new Date(lastDayOfMonth);
  if (endDate.getDay() !== 6) endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const approxAsDate = getAssameseDateApprox(state.currentDate);
  const asMonthName = state.language === 'as' ? ASSAMESE_MONTHS[approxAsDate.monthIndex] : ENGLISH_MONTHS[approxAsDate.monthIndex];
  const enMonthName = formatMonthYear(state.currentDate);

  document.getElementById('calendar-title').textContent = state.language === 'as' ? asMonthName : enMonthName;
  document.getElementById('calendar-subtitle').textContent = state.language === 'as' ? enMonthName : ASSAMESE_MONTHS[approxAsDate.monthIndex];

  // Weekdays
  const weekdaysGrid = document.getElementById('weekdays-grid');
  weekdaysGrid.innerHTML = '';
  const weekdays = state.language === 'as' ? ASSAMESE_WEEKDAYS : ENGLISH_WEEKDAYS;
  weekdays.forEach((day, i) => {
    const el = document.createElement('div');
    el.className = `weekday-header ${i === 0 ? 'weekday-sunday' : ''}`;
    el.textContent = state.language === 'as' ? day : day.substring(0, 3);
    weekdaysGrid.appendChild(el);
  });

  // Days
  const daysGrid = document.getElementById('days-grid');
  daysGrid.innerHTML = '';

  const allFestivals = getAssameseFestivals(year);
  let iterDate = new Date(startDate);

  while (iterDate <= endDate) {
    const isCurrentMonth = iterDate.getMonth() === month;
    const dateStr = formatDateString(iterDate);
    const isToday = dateStr === todayDateStr;
    const currentIterDate = new Date(iterDate); // clone for click handler

    const dayEl = document.createElement('div');
    dayEl.className = `calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;

    // Day Headers
    const asDate = getAssameseDateApprox(iterDate);
    const asDayStr = state.language === 'as' ? toAssameseNumeral(asDate.day) : asDate.day.toString();
    const enDayStr = iterDate.getDate().toString();

    dayEl.innerHTML = `
      <div class="day-header">
        <span class="day-secondary ${isToday ? 'text-primary' : ''}">${enDayStr}</span>
        <span class="day-primary ${state.language === 'as' ? 'font-assamese' : ''} ${isToday ? 'today' : ''}">${asDayStr}</span>
      </div>
      <div class="events-container"></div>
    `;

    // Click on Day to create event
    dayEl.addEventListener('click', () => {
      openEventDialog(null, currentIterDate);
    });

    const eventsContainer = dayEl.querySelector('.events-container');

    // Festivals
    allFestivals.filter(f => f.gregorianDate === dateStr).forEach(fest => {
      const b = document.createElement('div');
      b.className = 'event-badge event-festival';
      b.textContent = '🎉 ' + (state.language === 'as' ? fest.nameAssamese : fest.name);
      eventsContainer.appendChild(b);
    });

    // User Events
    state.events.filter(e => e.eventDate === dateStr).forEach(evt => {
      const b = document.createElement('div');
      b.className = 'event-badge event-user';
      let icon = '✅';
      if (evt.category === 'meeting') icon = '👥';
      else if (evt.category === 'birthday') icon = '🎂';
      b.textContent = `${icon} ${evt.title}`;

      // Stop propagation so clicking event edits it
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        openEventDialog(evt);
      });
      eventsContainer.appendChild(b);
    });

    daysGrid.appendChild(dayEl);
    iterDate.setDate(iterDate.getDate() + 1);
  }
}

function renderUpcomingEvents() {
  const container = document.getElementById('upcoming-events-container');
  if (!container) return;
  container.innerHTML = '';
  const nowStr = formatDateString(new Date());

  const upcoming = [...state.events]
    .filter(e => e.eventDate >= nowStr)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  if (upcoming.length === 0) {
    container.innerHTML = `
      <div class="upcoming-empty">
        <i data-lucide="calendar-days" class="w-10 h-10 mb-2 opacity-20"></i>
        <p>${i18n[state.language]['lbl.no_events']}</p>
      </div>`;
  } else {
    upcoming.forEach(evt => {
      const el = document.createElement('div');
      el.className = 'upcoming-item';
      const isToday = evt.eventDate === nowStr;

      const evtDateObj = new Date(evt.eventDate);
      const enDateStr = evtDateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const asDateStr = `${toAssameseNumeral(evtDateObj.getDate())} ${evtDateObj.toLocaleString('en-US', { month: 'short' })}`;

      el.innerHTML = `
        <div class="upcoming-header">
          <div class="flex items-center gap-2 overflow-hidden">
            <h4 class="upcoming-title">${evt.title}</h4>
            ${isToday ? `<span class="badge-today flex-shrink-0">${i18n[state.language]['lbl.today']}</span>` : ''}
          </div>
          <button class="icon-button mini-btn text-muted-foreground hover:text-destructive shrink-0 del-upcoming-evt" title="Delete">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
        <div class="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <i data-lucide="calendar-days" class="w-4 h-4"></i>
          <span>${state.language === 'as' ? asDateStr : enDateStr}</span>
        </div>
        ${evt.category ? `<div class="upcoming-category">${evt.category}</div>` : ''}
      `;
      el.addEventListener('click', () => openEventDialog(evt));

      const delBtn = el.querySelector('.del-upcoming-evt');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DB.delete(evt.id);
        if (typeof renderEventsPageGrid === 'function') renderEventsPageGrid();
        renderCalendarGrid();
        renderUpcomingEvents();
      });

      container.appendChild(el);
    });
  }
  lucide.createIcons();
}

function renderEventsPageGrid() {
  const container = document.getElementById('events-page-grid');
  const emptyState = document.getElementById('events-empty-state');
  if (!container) return;

  container.innerHTML = '';
  const sortedEvents = [...state.events].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));

  if (sortedEvents.length === 0) {
    emptyState.classList.remove('hidden');
    emptyState.classList.add('flex');
  } else {
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');

    sortedEvents.forEach(evt => {
      const el = document.createElement('div');
      el.className = 'event-card';

      const evtDateObj = new Date(evt.eventDate);
      const enDateStr = evtDateObj.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const asDateStr = `${toAssameseNumeral(evtDateObj.getDate())} ${evtDateObj.toLocaleString('en-US', { month: 'short' })}, ${toAssameseNumeral(evtDateObj.getFullYear())}`;

      el.innerHTML = `
        <div class="event-card-header">
          <h3 class="event-card-title">${evt.title}</h3>
          <div class="event-actions">
            <button class="icon-button mini-btn text-muted-foreground hover:text-primary edit-evt" title="Edit">
              <i data-lucide="edit-2" class="w-4 h-4"></i>
            </button>
            <button class="icon-button mini-btn text-muted-foreground hover:text-destructive del-evt" title="Delete">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
        
        <div class="event-date-row">
          <div class="event-date-pill">
            <i data-lucide="calendar" class="w-4 h-4"></i>
            <span>${state.language === 'as' ? asDateStr : enDateStr}</span>
          </div>
          ${evt.eventTime ? `<div class="event-date-pill"><i data-lucide="clock" class="w-4 h-4"></i> <span>${evt.eventTime}</span></div>` : ''}
        </div>
        
        <div class="event-card-footer">
          ${evt.category ? `<div class="event-category-pill">${evt.category}</div>` : '<div></div>'}
          ${evt.notificationsEnabled ? `<span class="event-alert-status"><span class="pulsing-dot"></span> Alerts On</span>` : ''}
        </div>
      `;
      el.addEventListener('click', () => openEventDialog(evt));

      const editBtn = el.querySelector('.edit-evt');
      const delBtn = el.querySelector('.del-evt');
      editBtn.addEventListener('click', (e) => { e.stopPropagation(); openEventDialog(evt); });
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        DB.delete(evt.id);
        renderEventsPageGrid();
        renderCalendarGrid();
        renderUpcomingEvents();
      });

      container.appendChild(el);
    });
  }
  lucide.createIcons();
}

// Dialog Logic
function openEventDialog(event = null, dateObj = null) {
  state.editingEventId = event ? event.id : null;
  const dialog = document.getElementById('event-dialog');
  const form = document.getElementById('event-form');
  const delBtn = document.getElementById('btn-delete-event');
  const title = document.getElementById('dialog-title');

  if (event) {
    title.textContent = "Edit Event";
    form['event-title'].value = event.title;
    form['event-date'].value = event.eventDate;
    form['event-time'].value = event.eventTime || '';
    form['event-category'].value = event.category || 'other';
    form['event-desc'].value = event.description || '';
    form['event-notify'].checked = event.notificationsEnabled || false;
    delBtn.classList.remove('hidden');
  } else {
    title.textContent = i18n[state.language]['btn.add_event'];
    form.reset();
    form['event-date'].value = dateObj ? formatDateString(dateObj) : formatDateString(new Date());
    delBtn.classList.add('hidden');
  }

  dialog.classList.remove('hidden');
}

function closeEventDialog() {
  document.getElementById('event-dialog').classList.add('hidden');
}

// Today Card Rendering
function renderTodayCard() {
  const todayNumEl = document.getElementById('today-day-number');
  const todayDateEl = document.getElementById('today-full-date');
  const todayAsDateEl = document.getElementById('today-assamese-date');
  const todayWeekdayEl = document.getElementById('today-weekday');
  if (!todayNumEl) return;

  const now = new Date();

  // English Date formats
  const enDayNum = now.getDate();
  const enMonthStr = now.toLocaleString('en-US', { month: 'long' });
  const enYearStr = now.getFullYear();
  const enWeekdayStr = now.toLocaleString('en-US', { weekday: 'long' });

  // Assamese Date formats
  const asApprox = getAssameseDateApprox(now);
  const asDayNum = asApprox.day;
  const asMonthStrAs = ASSAMESE_MONTHS[asApprox.monthIndex].split(' ')[0];
  const asMonthStrEn = ASSAMESE_MONTHS[asApprox.monthIndex].split(' ')[1].replace(/[()]/g, '');
  const asWeekdayStr = ASSAMESE_WEEKDAYS[now.getDay()];

  if (state.language === 'as') {
    todayNumEl.textContent = toAssameseNumeral(asDayNum);
    todayDateEl.innerHTML = `<span style="font-size: 1.1em;">${toAssameseNumeral(asDayNum)} ${asMonthStrAs}</span> <span style="font-size: 0.75em; font-weight: 500; opacity: 0.85; margin-left: 8px;">( ${toAssameseNumeral(asApprox.year)} ভাস্কৰাব্দ )</span>`;
    todayAsDateEl.textContent = `${toAssameseNumeral(enDayNum)} ${enMonthStr} ${toAssameseNumeral(enYearStr)}`;
    todayWeekdayEl.textContent = asWeekdayStr;
    todayDateEl.classList.remove('font-display');
    todayDateEl.classList.add('font-assamese');
    todayWeekdayEl.classList.add('font-assamese');
  } else {
    todayNumEl.textContent = asDayNum;
    todayDateEl.innerHTML = `<span style="font-size: 1.1em;">${asDayNum} ${asMonthStrEn}</span> <span style="font-size: 0.75em; font-weight: 500; opacity: 0.85; margin-left: 8px;">( ${asApprox.year} Bhaskarabda )</span>`;
    todayAsDateEl.textContent = `${enDayNum} ${enMonthStr} ${enYearStr}`;
    todayWeekdayEl.textContent = enWeekdayStr;
    todayDateEl.classList.remove('font-assamese');
    todayDateEl.classList.add('font-display');
    todayWeekdayEl.classList.remove('font-assamese');
  }
}

// Initialization and Listeners
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  applyTheme();
  translatePage();
  if (typeof renderTodayCard === 'function') renderTodayCard();
  renderCalendarGrid();
  renderUpcomingEvents();
  if (typeof renderEventsPageGrid === 'function') renderEventsPageGrid();

  // Navigation Listeners
  const langBtn = document.getElementById('lang-toggle-btn');
  if (langBtn) langBtn.addEventListener('click', toggleLanguage);

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const addBtn = document.getElementById('add-event-btn');
  if (addBtn) addBtn.addEventListener('click', () => openEventDialog(null, new Date()));

  const addBtnEvt = document.getElementById('add-event-btn-events');
  if (addBtnEvt) addBtnEvt.addEventListener('click', () => openEventDialog(null, new Date()));

  const todayBtn = document.getElementById('btn-today');
  if (todayBtn) todayBtn.addEventListener('click', () => { state.currentDate = new Date(); renderCalendarGrid(); });

  const prevBtn = document.getElementById('btn-prev-month');
  if (prevBtn) prevBtn.addEventListener('click', () => { state.currentDate.setMonth(state.currentDate.getMonth() - 1); renderCalendarGrid(); });

  const nextBtn = document.getElementById('btn-next-month');
  if (nextBtn) nextBtn.addEventListener('click', () => { state.currentDate.setMonth(state.currentDate.getMonth() + 1); renderCalendarGrid(); });

  // Dialog Listeners
  const dialogCloseBtn = document.getElementById('dialog-close-btn');
  if (dialogCloseBtn) dialogCloseBtn.addEventListener('click', closeEventDialog);
  const cancelEventBtn = document.getElementById('btn-cancel-event');
  if (cancelEventBtn) cancelEventBtn.addEventListener('click', closeEventDialog);

  const eventForm = document.getElementById('event-form');
  if (eventForm) eventForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('event-title').value,
      eventDate: document.getElementById('event-date').value,
      eventTime: document.getElementById('event-time').value,
      category: document.getElementById('event-category').value,
      description: document.getElementById('event-desc').value,
      notificationsEnabled: document.getElementById('event-notify').checked
    };

    if (data.notificationsEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    if (state.editingEventId) {
      DB.update(state.editingEventId, data);
    } else {
      DB.create(data);
    }

    closeEventDialog();
    renderCalendarGrid();
    renderUpcomingEvents();
    if (typeof renderEventsPageGrid === 'function') renderEventsPageGrid();
  });

  const deleteEventBtn = document.getElementById('btn-delete-event');
  if (deleteEventBtn) deleteEventBtn.addEventListener('click', () => {
    if (state.editingEventId) {
      DB.delete(state.editingEventId);
      closeEventDialog();
      renderCalendarGrid();
      renderUpcomingEvents();
      if (typeof renderEventsPageGrid === 'function') renderEventsPageGrid();
    }
  });

  // Background notifications check tick
  setInterval(() => {
    if (Notification.permission === 'granted') {
      const now = new Date();
      const nowTimeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
      const nowDateStr = formatDateString(now);

      state.events.forEach(evt => {
        if (evt.notificationsEnabled && evt.eventDate === nowDateStr && evt.eventTime === nowTimeStr) {
          // Check if not already notified to prevent spam (in a real app we track this in localStorage)
          new Notification('Reminder: ' + evt.title, { body: evt.description });
        }
      });
    }
  }, 60000);
});
