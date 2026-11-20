import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';

const STORAGE_KEY = 'studymate.savedPlans.v1';
const COMPLETION_KEY = 'studymate.completedTasks.v1';
const ACTIVE_PLAN_KEY = 'studymate.activePlanId.v1';
const TIMETABLE_KEY = 'studymate.weeklyTimetable.v1';
const EXAMS_KEY = 'studymate.exams.v1';
const THEME_KEY = 'studymate.theme.v1';
const SUBJECT_LIBRARY_KEY = 'studymate.subjectLibrary.v1';
const STUDY_START_TIME_KEY = 'studymate.studyStartTime.v1';
const STUDY_END_TIME_KEY = 'studymate.studyEndTime.v1';
const QUOTE_ROTATION_KEY = 'studymate.quoteRotationMode.v1';
const TASK_NOTES_KEY = 'studymate.taskNotes.v1';
const STUDY_LOGS_KEY = 'studymate.studyLogs.v1';
const TASK_PRIORITIES_KEY = 'studymate.taskPriorities.v1';
const WEAK_TOPICS_KEY = 'studymate.weakTopics.v1';
const QUIZ_HISTORY_KEY = 'studymate.quizHistory.v1';
const DIFFICULTY_RATINGS_KEY = 'studymate.difficultyRatings.v1';
const BACKUP_VERSION = 1;
const WEEKDAYS = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];
const PERIOD_COUNT = 7;
const initialSubjects = 'C++ Programming, Engineering Mathematics, Digital Fundamentals';

const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'It always seems impossible until it is done.', author: 'Nelson Mandela' },
  { text: 'Focus on progress, not perfection.', author: 'Unknown' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Unknown' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'Don\'t watch the clock; do what it does. Keep going.', author: 'Sam Levenson' },
  { text: 'The harder you work for something, the greater you\'ll feel when you achieve it.', author: 'Unknown' },
  { text: 'Push yourself, because no one else is going to do it for you.', author: 'Unknown' },
  { text: 'Great things never came from comfort zones.', author: 'Unknown' },
  { text: 'Dream it. Wish it. Do it.', author: 'Unknown' },
  { text: 'The key to success is to focus on goals, not obstacles.', author: 'Unknown' },
  { text: 'You don\'t have to be great to start, but you have to start to be great.', author: 'Zig Ziglar' },
  { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
  { text: 'Education is the most powerful weapon you can use to change the world.', author: 'Nelson Mandela' },
  { text: 'The beautiful thing about learning is that no one can take it away from you.', author: 'B.B. King' },
  { text: 'An investment in knowledge pays the best interest.', author: 'Benjamin Franklin' },
  { text: 'Tell me and I forget. Teach me and I remember. Involve me and I learn.', author: 'Benjamin Franklin' },
  { text: 'Learning is not attained by chance; it must be sought for with ardor and diligence.', author: 'Abigail Adams' },
  { text: 'The mind is not a vessel to be filled but a fire to be ignited.', author: 'Plutarch' },
  { text: 'Strive for progress, not perfection.', author: 'Unknown' },
  { text: 'Wake up with determination. Go to bed with satisfaction.', author: 'Unknown' },
  { text: 'Do something today that your future self will thank you for.', author: 'Unknown' },
  { text: 'Little things make big days.', author: 'Unknown' },
  { text: 'It\'s going to be hard, but hard does not mean impossible.', author: 'Unknown' },
  { text: 'Your limitation — it\'s only your imagination.', author: 'Unknown' },
  { text: 'Sometimes later becomes never. Do it now.', author: 'Unknown' },
  { text: 'Great souls have wills; feeble ones have only wishes.', author: 'Chinese Proverb' },
  { text: 'Opportunities don\'t happen. You create them.', author: 'Chris Grosser' },
  { text: 'Try to be a rainbow in someone\'s cloud.', author: 'Maya Angelou' },
  { text: 'First, have a definite, clear practical ideal — a goal, an objective.', author: 'Aristotle' },
  { text: 'What you get by achieving your goals is not as important as what you become.', author: 'Henry David Thoreau' },
];

const templates = [
  {
    id: 'exam', icon: '▤', title: 'Exam revision', description: 'Prepare for internal or semester exams',
    subjects: initialSubjects, hours: '2', days: '3', goal: 'Prepare steadily for upcoming internal exams',
    deadlines: 'Mathematics internal — add your exam date\nC++ practice — arrays and loops',
  },
  {
    id: 'language', icon: '文', title: 'Language practice', description: 'Build a steady daily learning habit',
    subjects: 'German A1 vocabulary, greetings, basic grammar, listening and speaking', hours: '1', days: '5',
    goal: 'Build a consistent German A1 practice routine', deadlines: '',
  },
  {
    id: 'cert', icon: '✦', title: 'Certification prep', description: 'Break a certification into clear sessions',
    subjects: 'AWS Cloud concepts, core services, security, pricing and billing', hours: '2', days: '7',
    goal: 'Prepare for an entry-level cloud certification', deadlines: '',
  },
  {
    id: 'dsa', icon: '{ }', title: 'Coding practice', description: 'Structure your DSA and problem-solving time',
    subjects: 'C++ fundamentals, arrays, strings, searching, sorting, problem solving', hours: '1.5', days: '5',
    goal: 'Build problem-solving skills through consistent C++ practice', deadlines: '',
  },
];

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null');
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeSavedPlans(value, limit = 12) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.plan === 'string')
    .slice(0, limit)
    .map((item) => ({
      id: item.id.slice(0, 100),
      createdAt: typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt)) ? item.createdAt : new Date().toISOString(),
      subjects: typeof item.subjects === 'string' ? item.subjects.slice(0, 4000) : '',
      hours: Number.isFinite(Number(item.hours)) && Number(item.hours) >= 0.5 && Number(item.hours) <= 16 ? Number(item.hours) : 2,
      days: [3, 5, 7].includes(Number(item.days)) ? Number(item.days) : 3,
      deadlines: typeof item.deadlines === 'string' ? item.deadlines.slice(0, 3000) : '',
      goal: typeof item.goal === 'string' ? item.goal.slice(0, 500) : '',
      plan: item.plan.slice(0, 200000),
      model: typeof item.model === 'string' ? item.model.slice(0, 100) : 'unknown',
      lastRescheduledAt: typeof item.lastRescheduledAt === 'string' && !Number.isNaN(Date.parse(item.lastRescheduledAt)) ? item.lastRescheduledAt : undefined,
    }));
}

function getInitialActivePlan() {
  const plans = normalizeSavedPlans(readStorage(STORAGE_KEY, []));
  const activeId = readStorage(ACTIVE_PLAN_KEY, null);
  return plans.find((item) => item.id === activeId) || plans[0] || null;
}

function createDefaultTimetable() {
  return {
    periods: Array.from({ length: PERIOD_COUNT }, (_, index) => ({
      id: index + 1,
      label: `Period ${index + 1}`,
      start: '',
      end: '',
    })),
    days: WEEKDAYS.map((day) => ({
      ...day,
      slots: Array.from({ length: PERIOD_COUNT }, () => ''),
    })),
  };
}

function normalizeTimetable(value) {
  const defaults = createDefaultTimetable();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const savedPeriods = Array.isArray(value.periods) ? value.periods : [];
  const savedDays = Array.isArray(value.days) ? value.days : [];
  const validTime = (time) => {
    if (typeof time !== 'string' || !/^\d{2}:\d{2}$/.test(time)) return '';
    const [hour, minute] = time.split(':').map(Number);
    return hour <= 23 && minute <= 59 ? time : '';
  };
  return {
    periods: defaults.periods.map((period, index) => {
      const saved = savedPeriods[index] && typeof savedPeriods[index] === 'object' ? savedPeriods[index] : {};
      return {
        ...period,
        label: `Period ${index + 1}`,
        start: validTime(saved.start),
        end: validTime(saved.end),
      };
    }),
    days: defaults.days.map((day, index) => {
      const saved = savedDays.find((item) => item && item.id === day.id) || savedDays[index] || {};
      const slots = Array.isArray(saved.slots) ? saved.slots : [];
      return {
        ...day,
        slots: Array.from({ length: PERIOD_COUNT }, (_, periodIndex) => {
          const subject = slots[periodIndex];
          return typeof subject === 'string' ? subject.slice(0, 100) : '';
        }),
      };
    }),
  };
}

function getTimetableTimeWarnings(periods) {
  const warnings = {};
  const toMinutes = (value) => {
    if (!/^\d{2}:\d{2}$/.test(value || '')) return null;
    const [hours, minutes] = value.split(':').map(Number);
    return hours <= 23 && minutes <= 59 ? hours * 60 + minutes : null;
  };
  const ranges = [];
  periods.forEach((period, index) => {
    if (!period.start || !period.end) return;
    const start = toMinutes(period.start);
    const end = toMinutes(period.end);
    if (start == null || end == null || end <= start) {
      warnings[index] = 'End must be after start';
      return;
    }
    ranges.push({ index, start, end, label: period.label });
  });
  for (let i = 0; i < ranges.length; i += 1) {
    for (let j = i + 1; j < ranges.length; j += 1) {
      const a = ranges[i];
      const b = ranges[j];
      if (a.start < b.end && b.start < a.end) {
        warnings[a.index] = `Overlaps ${b.label}`;
        warnings[b.index] = `Overlaps ${a.label}`;
      }
    }
  }
  return warnings;
}

function makeTimetableContext(timetable) {
  const warnings = getTimetableTimeWarnings(timetable.periods);
  const lines = [];
  for (const day of timetable.days) {
    const entries = [];
    timetable.periods.forEach((period, index) => {
      const subject = day.slots[index]?.trim();
      if (subject && period.start && period.end && !warnings[index]) {
        entries.push(`${period.label} (${period.start}–${period.end}): ${subject}`);
      }
    });
    if (entries.length) lines.push(`${day.label}: ${entries.join('; ')}`);
  }
  return lines.join('\n');
}

function csvCell(value) {
  let text = String(value ?? '');
  // Prefix formula-like values so opening the exported CSV in spreadsheet apps cannot execute them.
  if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw new Error(`The local API returned an unreadable response (HTTP ${response.status}). Restart node server.js and try again.`); }
  }
  if (!response.ok) throw new Error(data.error || `The local API returned HTTP ${response.status}.`);
  return data;
}

function cleanInline(value) {
  return String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\((?:<)?https?:\/\/[^)>]+(?:>)?\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function makeTask(text, dayIndex, blockIndex, taskIndex) {
  const normalized = cleanInline(text).replace(/^[-*+\s]+/, '').replace(/^\d+[.)]\s*/, '').trim();
  if (!normalized) return null;
  const durationMatch = normalized.match(/\(([^)]*(?:minutes?|mins?|hours?|hrs?|h)\s*[^)]*)\)/i);
  const duration = durationMatch ? durationMatch[1].trim() : '';
  const title = normalized
    .replace(/\s*\([^)]*(?:minutes?|mins?|hours?|hrs?)\s*[^)]*\)\s*/i, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const taskTitle = title || normalized;
  const slug = taskTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32) || 'task';
  return {
    id: `d${dayIndex}-b${blockIndex}-t${taskIndex}-${slug}`,
    title: taskTitle,
    duration,
    details: [],
    isBreak: /\b(break|rest|lunch|snack|walk|stretch)\b/i.test(taskTitle),
  };
}

function parseStudyPlan(markdown) {
  const lines = String(markdown || '').replace(/\r/g, '').split('\n');
  const outputDays = [];
  let currentDay = null;
  let currentBlock = null;

  const createDay = (number, title) => {
    const day = { number, title: title || 'Focus and practice', blocks: [] };
    outputDays.push(day);
    currentDay = day;
    currentBlock = null;
  };

  const createBlock = (time) => {
    if (!currentDay) createDay(1, 'Your study plan');
    const block = {
      id: `d${currentDay.number}-b${currentDay.blocks.length + 1}`,
      time: time || 'Flexible study session',
      tasks: [],
    };
    currentDay.blocks.push(block);
    currentBlock = block;
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || /^([-*_]\s*){3,}$/.test(trimmed)) continue;
    const isHeading = /^#{1,6}\s/.test(trimmed);
    const unheaded = trimmed.replace(/^#{1,6}\s*/, '').trim();
    const plain = cleanInline(unheaded);
    if (!plain) continue;

    const dayMatch = plain.match(/^(?:day|session|week day)\s*(\d+)\s*[:：.\-–—]?\s*(.*)$/i);
    if (dayMatch && (isHeading || /^day\s*\d/i.test(plain))) {
      const requestedNumber = Number(dayMatch[1]);
      const existingDay = outputDays.find((day) => day.number === requestedNumber);
      if (existingDay) {
        // Small local models sometimes repeat a day heading. Merge repeated headings
        // into the same visual day instead of showing duplicate Day 1 cards.
        currentDay = existingDay;
        currentBlock = null;
        if (dayMatch[2] && (!existingDay.title || existingDay.title === 'Focus and practice')) existingDay.title = dayMatch[2];
      } else {
        createDay(requestedNumber, dayMatch[2] || 'Focus and practice');
      }
      continue;
    }

    const timePattern = /\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\s*(?:-|–|—|to)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\b/i;
    if (timePattern.test(plain) && (isHeading || plain.length < 75)) {
      createBlock(plain);
      continue;
    }

    if (isHeading) {
      // Ignore generic headings such as “Study plan” but keep it as a day title if no day exists yet.
      if (!currentDay && !/^(study plan|plan overview|weekly overview|notes?)$/i.test(plain)) createDay(1, plain);
      continue;
    }

    if (/^(tip|note|adjustment|if you miss|suggestion)\s*:/i.test(plain)) {
      if (!currentDay) createDay(1, 'Plan notes');
      if (!currentBlock) createBlock('Plan note');
      const note = makeTask(plain, currentDay.number, currentDay.blocks.length, currentBlock.tasks.length + 1);
      if (note) currentBlock.tasks.push(note);
      continue;
    }

    const bulletMatch = rawLine.match(/^(\s*)(?:[-*+•]\s+|\d+[.)]\s+)(.*)$/);
    if (bulletMatch) {
      if (!currentDay) createDay(1, 'Study sessions');
      if (!currentBlock) createBlock('Study session');
      const indent = bulletMatch[1].length;
      const bulletText = cleanInline(bulletMatch[2]);
      if (indent >= 2 && currentBlock.tasks.length && !currentBlock.tasks[currentBlock.tasks.length - 1].isBreak) {
        currentBlock.tasks[currentBlock.tasks.length - 1].details.push(bulletText);
      } else {
        const task = makeTask(bulletText, currentDay.number, currentDay.blocks.length, currentBlock.tasks.length + 1);
        if (task) currentBlock.tasks.push(task);
      }
      continue;
    }

    // A plain paragraph is useful as a task if the current session has no tasks yet; otherwise it is detail text.
    if (!currentDay) createDay(1, 'Study sessions');
    if (!currentBlock) createBlock('Study session');
    if (currentBlock.tasks.length) currentBlock.tasks[currentBlock.tasks.length - 1].details.push(plain);
    else {
      const task = makeTask(plain, currentDay.number, currentDay.blocks.length, 1);
      if (task) currentBlock.tasks.push(task);
    }
  }

  const usableDays = outputDays
    .map((day) => ({ ...day, blocks: day.blocks.filter((block) => block.tasks.length > 0) }))
    .filter((day) => day.blocks.length > 0);
  if (usableDays.length) return usableDays;

  const fallbackTasks = lines
    .map((line) => cleanInline(line.replace(/^\s*[-*+#\d.)]+\s*/, '')))
    .filter(Boolean)
    .slice(0, 60)
    .map((text, index) => makeTask(text, 1, 1, index + 1))
    .filter(Boolean);
  return fallbackTasks.length
    ? [{ number: 1, title: 'Your study plan', blocks: [{ id: 'd1-b1', time: 'Study sessions', tasks: fallbackTasks }] }]
    : [];
}

function formatPlanText(days) {
  return days.map((day) => {
    const lines = [`DAY ${day.number} — ${day.title}`];
    for (const block of day.blocks) {
      lines.push('', block.time);
      for (const task of block.tasks) {
        const cleanDuration = task.duration ? task.duration.replace(/^\(|\)$/g, '').trim() : '';
        lines.push(`${task.isBreak ? 'BREAK' : '•'} ${task.title}${cleanDuration ? ` (${cleanDuration})` : ''}`);
        task.details.forEach((detail) => lines.push(`  ${detail}`));
      }
    }
    return lines.join('\n');
  }).join('\n\n');
}

function localDateKey(date = new Date()) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(value) {
  if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const fallback = new Date();
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function dayDifference(fromDate, toDate) {
  const from = parseLocalDate(fromDate);
  const to = parseLocalDate(toDate);
  return Math.round((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / 86400000);
}

function dateForPlanDay(startDate, dayNumber) {
  const date = parseLocalDate(startDate);
  date.setDate(date.getDate() + Math.max(0, Number(dayNumber || 1) - 1));
  return localDateKey(date);
}

function normalizeExams(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === 'object' && typeof item.id === 'string' && typeof item.title === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') && localDateKey(parseLocalDate(item.date)) === item.date)
    .slice(0, 500)
    .map((item) => ({
      id: item.id.slice(0, 100),
      title: item.title.slice(0, 160),
      subject: typeof item.subject === 'string' ? item.subject.slice(0, 120) : '',
      date: item.date,
      notes: typeof item.notes === 'string' ? item.notes.slice(0, 1000) : '',
      createdAt: typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt)) ? item.createdAt : new Date().toISOString(),
    }));
}

function parseManualDeadlineEntries(text, todayKey) {
  const monthNumbers = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
    dec: 12, december: 12,
  };
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 40);
  const results = [];
  const makeDateKey = (year, month, day) => {
    if (![year, month, day].every(Number.isInteger)) return '';
    const candidate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return localDateKey(parseLocalDate(candidate)) === candidate ? candidate : '';
  };

  lines.forEach((line, index) => {
    let dateKey = '';
    let dateMatch = line.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
    if (dateMatch) dateKey = makeDateKey(Number(dateMatch[1]), Number(dateMatch[2]), Number(dateMatch[3]));

    if (!dateKey) {
      dateMatch = line.match(/\b(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](20\d{2}))?\b/);
      if (dateMatch) {
        // Numeric dates are interpreted as DD/MM, matching the expected Indian locale.
        const year = Number(dateMatch[3] || todayKey.slice(0, 4));
        dateKey = makeDateKey(year, Number(dateMatch[2]), Number(dateMatch[1]));
      }
    }

    if (!dateKey) {
      dateMatch = line.match(/\b(\d{1,2})\s+(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?(?:\s+(20\d{2}))?\b/i);
      if (dateMatch) {
        dateKey = makeDateKey(Number(dateMatch[3] || todayKey.slice(0, 4)), monthNumbers[dateMatch[2].toLowerCase()], Number(dateMatch[1]));
      }
    }

    if (!dateKey) {
      dateMatch = line.match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?(?:\s+(20\d{2}))?\b/i);
      if (dateMatch) {
        dateKey = makeDateKey(Number(dateMatch[3] || todayKey.slice(0, 4)), monthNumbers[dateMatch[1].toLowerCase()], Number(dateMatch[2]));
      }
    }

    if (dateKey && dateKey >= todayKey) {
      const title = line
        .replace(/\b20\d{2}-\d{1,2}-\d{1,2}\b/, '')
        .replace(/\b\d{1,2}[\/.\-]\d{1,2}(?:[\/.\-]20\d{2})?\b/, '')
        .replace(/\b\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)[.,]?(?:\s+20\d{2})?\b/i, '')
        .replace(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?[,]?(?:\s+20\d{2})?\b/i, '')
        .replace(/[—–|,:;]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
      results.push({
        id: `manual-deadline-${index}-${dateKey}`,
        title: (title || line).slice(0, 160),
        subject: '',
        date: dateKey,
        notes: line.slice(0, 1000),
      });
    }
  });
  return results;
}

function parseDurationMinutes(task) {
  const source = `${task?.duration || ''} ${task?.title || ''}`;
  const match = source.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/i);
  if (!match) return 30;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return 30;
  return Math.max(15, Math.round(/^(h|hr|hrs|hour|hours)$/i.test(match[2]) ? amount * 60 : amount));
}

function toMinutesOfDay(time) {
  if (!/^\d{2}:\d{2}$/.test(time || '')) return null;
  const [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function parseClockRange(value) {
  const text = String(value || '');
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!match) return null;
  const convert = (rawHour, rawMinute, meridiem, inherited) => {
    let hour = Number(rawHour);
    const minute = Number(rawMinute || 0);
    const period = (meridiem || inherited || '').toLowerCase().replaceAll('.', '');
    if (minute > 59 || hour > 24) return null;
    if (period === 'pm' && hour < 12) hour += 12;
    if (period === 'am' && hour === 12) hour = 0;
    if (!period && hour === 24) return minute === 0 ? 1440 : null;
    if (hour > 23) return null;
    return hour * 60 + minute;
  };
  const start = convert(match[1], match[2], match[3], match[6]);
  const end = convert(match[4], match[5], match[6], match[3]);
  return start != null && end != null && end > start ? { start, end } : null;
}

function formatClock(minutes) {
  const safe = Math.max(0, Math.min(1439, minutes));
  const hour24 = Math.floor(safe / 60);
  const minute = safe % 60;
  const suffix = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function timeToMinutes(val) {
  if (!val || typeof val !== 'string') return null;
  const match = val.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

function minutesToTimeInput(minutes) {
  if (minutes == null) return '09:00';
  const safe = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function extractBlockTimeAndLabel(timeStr) {
  const clean = String(timeStr || '').replace(/^#{1,6}\s*/, '').trim();
  const range = parseClockRange(clean);
  let label = '';
  const match = clean.match(/\b\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\s*(?:-|–|—|to)\s*\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?\b\s*[:·•|—–-]?\s*(.*)$/i);
  if (match && match[1]) {
    label = match[1].replace(/^[·•|—–-]\s*/, '').trim();
  }
  return {
    startMinutes: range?.start ?? (9 * 60),
    endMinutes: range?.end ?? (10 * 60 + 30),
    label,
  };
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
}

const AUDIO_DB_NAME = 'StudyMateAudioDB';
const AUDIO_DB_VERSION = 1;
const AUDIO_STORE_NAME = 'focusTracks';

function openAudioDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }
    const request = window.indexedDB.open(AUDIO_DB_NAME, AUDIO_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
        db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getAllCustomTracks() {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE_NAME, 'readonly');
      const store = tx.objectStore(AUDIO_STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

async function saveCustomTrack(track) {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AUDIO_STORE_NAME);
    const request = store.put(track);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteCustomTrack(id) {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(AUDIO_STORE_NAME, 'readwrite');
    const store = tx.objectStore(AUDIO_STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTrackTime(seconds) {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 1.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.5);
    });
  } catch {
    /* web audio optional */
  }
}

function sendNotification(title, options = {}) {
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
    } catch {
      /* notifications optional */
    }
  }
}

function triggerConfetti() {
  if (typeof window === 'undefined') return;
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#7c6cf0', '#9d8df1', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#f43f5e', '#a855f7'];
  const pieces = [];
  const count = 100;

  for (let i = 0; i < count; i += 1) {
    pieces.push({
      x: window.innerWidth * (0.2 + Math.random() * 0.6),
      y: window.innerHeight * 0.4,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 1.25) * 15,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 14,
      opacity: 1,
      decay: Math.random() * 0.012 + 0.008,
    });
  }

  let animId = null;
  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = 0;

    for (const p of pieces) {
      if (p.opacity > 0) {
        active += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.36;
        p.vx *= 0.985;
        p.rotation += p.rotationSpeed;
        p.opacity = Math.max(0, p.opacity - p.decay);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }

    if (active > 0) {
      animId = requestAnimationFrame(render);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (animId) cancelAnimationFrame(animId);
    }
  }

  render();
}

function getSubjectColor(subject) {
  const text = String(subject || '').trim().toLowerCase();
  if (!text) return null;
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 37 + text.charCodeAt(i)) % 360;
  }
  return {
    bgLight: `hsl(${hash}, 75%, 95%)`,
    borderLight: `hsl(${hash}, 60%, 80%)`,
    textLight: `hsl(${hash}, 85%, 25%)`,
    bgDark: `hsl(${hash}, 50%, 16%)`,
    borderDark: `hsl(${hash}, 45%, 32%)`,
    textDark: `hsl(${hash}, 80%, 82%)`,
  };
}

const TIMETABLE_PRESETS = [
  {
    id: 'standard',
    label: 'Standard College (9 AM – 4 PM)',
    periods: [
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:15', end: '12:15' },
      { start: '12:15', end: '13:15' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:00' },
    ],
  },
  {
    id: 'morning',
    label: 'Morning Shift (8 AM – 1:30 PM)',
    periods: [
      { start: '08:00', end: '08:45' },
      { start: '08:50', end: '09:35' },
      { start: '09:40', end: '10:25' },
      { start: '10:45', end: '11:30' },
      { start: '11:35', end: '12:20' },
      { start: '12:25', end: '13:10' },
      { start: '13:10', end: '13:50' },
    ],
  },
  {
    id: 'evening',
    label: 'Evening / Study Sessions (4 PM – 10 PM)',
    periods: [
      { start: '16:00', end: '16:45' },
      { start: '17:00', end: '17:45' },
      { start: '18:00', end: '18:45' },
      { start: '19:00', end: '19:45' },
      { start: '20:15', end: '21:00' },
      { start: '21:00', end: '21:45' },
      { start: '21:45', end: '22:30' },
    ],
  },
];

function generateIcs(days, planTitle = 'StudyMate Study Plan') {
  const pad = (n) => String(n).padStart(2, '0');
  const formatIcsDate = (date, minutes) => {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(Math.floor(minutes / 60));
    const min = pad(minutes % 60);
    return `${y}${m}${d}T${h}${min}00`;
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//StudyMate//Study Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${planTitle.replace(/[,;\n\r]/g, ' ')}`,
  ];

  days.forEach((day) => {
    const dateObj = parseLocalDate(day.dateKey);
    day.blocks.forEach((block) => {
      const range = parseClockRange(block.time);
      if (!range) return;
      const startIso = formatIcsDate(dateObj, range.start);
      const endIso = formatIcsDate(dateObj, range.end);
      const summary = block.tasks.map((t) => (t.isBreak ? 'Break' : t.title)).join('; ') || 'Study Session';
      const description = block.tasks
        .map((t) => `${t.isBreak ? '[Break]' : '[Task]'} ${t.title}${t.details?.length ? ` - ${t.details.join(' ')}` : ''}`)
        .join('\\n');

      lines.push(
        'BEGIN:VEVENT',
        `UID:studymate-${day.dateKey}-${block.id}-${range.start}@studymate.local`,
        `DTSTAMP:${formatIcsDate(new Date(), new Date().getHours() * 60 + new Date().getMinutes())}Z`,
        `DTSTART:${startIso}`,
        `DTEND:${endIso}`,
        `SUMMARY:${summary.replace(/[,;\n\r]/g, ' ')}`,
        `DESCRIPTION:${description.replace(/[\r\n]+/g, '\\n')}`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

function App() {
  const [initialActivePlan] = useState(() => getInitialActivePlan());
  const [subjects, setSubjects] = useState(() => initialActivePlan?.subjects || initialSubjects);
  const [hours, setHours] = useState(() => String(initialActivePlan?.hours ?? 2));
  const [days, setDays] = useState(() => String(initialActivePlan?.days ?? 3));
  const [deadlines, setDeadlines] = useState(() => initialActivePlan?.deadlines || '');
  const [goal, setGoal] = useState(() => initialActivePlan?.goal || 'Prepare steadily for upcoming internal exams');
  const [plan, setPlan] = useState(() => initialActivePlan?.plan || '');
  const [currentPlanId, setCurrentPlanId] = useState(() => initialActivePlan?.id || null);
  const [savedPlans, setSavedPlans] = useState(() => normalizeSavedPlans(readStorage(STORAGE_KEY, [])));
  const [completedByPlan, setCompletedByPlan] = useState(() => {
    const value = readStorage(COMPLETION_KEY, {});
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  });
  const [timetable, setTimetable] = useState(() => normalizeTimetable(readStorage(TIMETABLE_KEY, null)));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [refineRequest, setRefineRequest] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [modelStatus, setModelStatus] = useState('checking');
  const [modelMessage, setModelMessage] = useState('Checking your local AI…');
  const [modelName, setModelName] = useState('llama3.2:1b');
  const [taskFilter, setTaskFilter] = useState('all');
  const [taskSearch, setTaskSearch] = useState('');
  const [viewMode, setViewMode] = useState('timeline');
  const [focusOpen, setFocusOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(true);
  const [now, setNow] = useState(() => new Date());
  const [exams, setExams] = useState(() => normalizeExams(readStorage(EXAMS_KEY, [])));
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examNotes, setExamNotes] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(() => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(() => localDateKey(new Date()));
  const [backupMessage, setBackupMessage] = useState('');
  const [scheduleNotice, setScheduleNotice] = useState('');
  const [darkMode, setDarkMode] = useState(() => readStorage(THEME_KEY, 'light') === 'dark');
  const [subjectLibrary, setSubjectLibrary] = useState(() => {
    const saved = readStorage(SUBJECT_LIBRARY_KEY, null);
    return Array.isArray(saved) ? saved.filter((s) => typeof s === 'string' && s.trim()) : [];
  });
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [studyStartTime, setStudyStartTime] = useState(() => readStorage(STUDY_START_TIME_KEY, '07:00'));
  const [studyEndTime, setStudyEndTime] = useState(() => readStorage(STUDY_END_TIME_KEY, '22:00'));
  const [quoteRotationMode, setQuoteRotationMode] = useState(() => readStorage(QUOTE_ROTATION_KEY, '12h'));
  const [quoteManualOffset, setQuoteManualOffset] = useState(0);
  const [editingBlockKey, setEditingBlockKey] = useState(null);
  const [editStartTime, setEditStartTime] = useState('09:00');
  const [editEndTime, setEditEndTime] = useState('10:30');
  const [editBlockLabel, setEditBlockLabel] = useState('');
  const [taskNotes, setTaskNotes] = useState(() => {
    const saved = readStorage(TASK_NOTES_KEY, {});
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  });
  const [activeNoteTaskId, setActiveNoteTaskId] = useState(null);
  const [pomodoroMode, setPomodoroMode] = useState('focus');
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerTotal, setTimerTotal] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [autoCompleteOnTimer, setAutoCompleteOnTimer] = useState(true);
  const [notificationsAllowed, setNotificationsAllowed] = useState(() => typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted');
  const [studyLogs, setStudyLogs] = useState(() => {
    const saved = readStorage(STUDY_LOGS_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [manualLogDate, setManualLogDate] = useState(() => localDateKey(new Date()));
  const [manualLogSubject, setManualLogSubject] = useState('');
  const [manualLogMinutes, setManualLogMinutes] = useState('45');
  const [manualLogNotes, setManualLogNotes] = useState('');
  const [taskPriorities, setTaskPriorities] = useState(() => {
    const saved = readStorage(TASK_PRIORITIES_KEY, {});
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  });
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [ambientType, setAmbientType] = useState('rain'); // 'rain' | 'ocean' | 'binaural' | 'whitenoise'
  const [ambientVolume, setAmbientVolume] = useState(0.35);
  const [soundTab, setSoundTab] = useState('ambient'); // 'ambient' | 'library'
  const [customTracks, setCustomTracks] = useState([]);
  const [activeTrackId, setActiveTrackId] = useState(null);
  const [isTrackPlaying, setIsTrackPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [trackDuration, setTrackDuration] = useState(0);
  const [isLoopTrack, setIsLoopTrack] = useState(true);
  const [audioUploadLoading, setAudioUploadLoading] = useState(false);
  const [audioStatusMessage, setAudioStatusMessage] = useState('');

  // ── AI Study Assistant ──────────────────────────────────────────────────────
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantQuestion, setAssistantQuestion] = useState('');
  const [assistantSubject, setAssistantSubject] = useState('');
  const [assistantAnswer, setAssistantAnswer] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantError, setAssistantError] = useState('');
  const [assistantHistory, setAssistantHistory] = useState([]);

  // ── AI Quiz Generator ───────────────────────────────────────────────────────
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizSubject, setQuizSubject] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [quizDifficulty, setQuizDifficulty] = useState('medium');
  const [quizType, setQuizType] = useState('mcq');
  const [quizCount, setQuizCount] = useState('5');
  const [quizOutput, setQuizOutput] = useState('');
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [parsedQuiz, setParsedQuiz] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizHistory, setQuizHistory] = useState(() => {
    const saved = readStorage(QUIZ_HISTORY_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });

  // ── PDF / Notes Analyzer ────────────────────────────────────────────────────
  const [notesAnalyzerOpen, setNotesAnalyzerOpen] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [notesSubject, setNotesSubject] = useState('');
  const [notesMode, setNotesMode] = useState('summary');
  const [notesAnalysis, setNotesAnalysis] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const notesFileInputRef = useRef(null);

  // ── Weak Topic Detection ────────────────────────────────────────────────────
  const [weakTopicsOpen, setWeakTopicsOpen] = useState(false);
  const [weakTopics, setWeakTopics] = useState(() => {
    const saved = readStorage(WEAK_TOPICS_KEY, []);
    return Array.isArray(saved) ? saved : [];
  });
  const [weakAnalysis, setWeakAnalysis] = useState('');
  const [weakLoading, setWeakLoading] = useState(false);
  const [weakError, setWeakError] = useState('');

  // ── Difficulty Ratings ──────────────────────────────────────────────────────
  const [difficultyRatings, setDifficultyRatings] = useState(() => {
    const saved = readStorage(DIFFICULTY_RATINGS_KEY, {});
    return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  });

  // ── Study Plan Explainer ────────────────────────────────────────────────────
  const [planExplainerOpen, setPlanExplainerOpen] = useState(false);
  const [planExplanation, setPlanExplanation] = useState('');
  const [planExplainerLoading, setPlanExplainerLoading] = useState(false);
  const [planExplainerError, setPlanExplainerError] = useState('');

  // ── Exam Readiness Score ────────────────────────────────────────────────────
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [readinessResult, setReadinessResult] = useState('');
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [readinessError, setReadinessError] = useState('');
  const [readinessExamDays, setReadinessExamDays] = useState('7');

  // ── Voice Task Entry ────────────────────────────────────────────────────────
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceError, setVoiceError] = useState('');
  const [voiceTargetField, setVoiceTargetField] = useState('subjects'); // 'subjects' | 'refine' | 'assistant'
  const voiceRecognitionRef = useRef(null);
  const voiceTranscriptRef = useRef('');

  // ── Active Feature Tab & AI Tools Modal ─────────────────────────────────────
  const [aiToolsTab, setAiToolsTab] = useState('assistant'); // 'assistant'|'quiz'|'notes'|'weak'|'readiness'
  const [aiModalOpen, setAiModalOpen] = useState(false);

  function openAiTool(tab = 'assistant') {
    setAiToolsTab(tab);
    setAiModalOpen(true);
  }

  const averageQuizScore = useMemo(() => {
    const scored = quizHistory.filter((q) => q.score != null);
    if (scored.length === 0) return 0;
    const sum = scored.reduce((acc, q) => acc + Number(q.score), 0);
    return Math.round(sum / scored.length);
  }, [quizHistory]);

  const customAudioRef = useRef(null);
  const currentObjectUrlRef = useRef(null);
  const audioFileInputRef = useRef(null);
  const customTracksRef = useRef([]);
  const activeTrackIdRef = useRef(null);
  const playCustomTrackRef = useRef(null);
  const ambientStateRef = useRef({
    ctx: null,
    sourceNode: null,
    filterNode: null,
    gainNode: null,
    osc1: null,
    osc2: null,
  });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);
  const commandInputRef = useRef(null);
  const restoreFileInput = useRef(null);
  const lastTodayKeyRef = useRef(localDateKey(new Date()));

  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => {
          if (!prev) {
            setCommandQuery('');
            setCommandSelectedIndex(0);
          }
          return !prev;
        });
        return;
      }

      if (e.key === '/' && !commandPaletteOpen) {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && !document.activeElement?.isContentEditable) {
          e.preventDefault();
          setCommandPaletteOpen(true);
          setCommandQuery('');
          setCommandSelectedIndex(0);
          return;
        }
      }

      if (e.key === 'Escape' && commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (commandPaletteOpen) {
      const timer = setTimeout(() => {
        commandInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [commandPaletteOpen]);

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedPlans)); } catch { /* optional local storage */ } }, [savedPlans]);
  useEffect(() => { try { localStorage.setItem(COMPLETION_KEY, JSON.stringify(completedByPlan)); } catch { /* optional local storage */ } }, [completedByPlan]);
  useEffect(() => { try { localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(currentPlanId)); } catch { /* optional local storage */ } }, [currentPlanId]);
  useEffect(() => { try { localStorage.setItem(TIMETABLE_KEY, JSON.stringify(timetable)); } catch { /* local saving is best effort if browser storage is unavailable */ } }, [timetable]);
  useEffect(() => { try { localStorage.setItem(EXAMS_KEY, JSON.stringify(exams)); } catch { /* backup/export remains available if storage is full */ } }, [exams]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try { localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light'); } catch { /* optional */ }
  }, [darkMode]);
  useEffect(() => { try { localStorage.setItem(SUBJECT_LIBRARY_KEY, JSON.stringify(subjectLibrary)); } catch { /* optional */ } }, [subjectLibrary]);
  useEffect(() => { try { localStorage.setItem(STUDY_START_TIME_KEY, studyStartTime); } catch { /* optional */ } }, [studyStartTime]);
  useEffect(() => { try { localStorage.setItem(STUDY_END_TIME_KEY, studyEndTime); } catch { /* optional */ } }, [studyEndTime]);
  useEffect(() => { try { localStorage.setItem(QUOTE_ROTATION_KEY, quoteRotationMode); } catch { /* optional */ } }, [quoteRotationMode]);
  useEffect(() => { try { localStorage.setItem(TASK_NOTES_KEY, JSON.stringify(taskNotes)); } catch { /* optional */ } }, [taskNotes]);
  useEffect(() => { try { localStorage.setItem(STUDY_LOGS_KEY, JSON.stringify(studyLogs)); } catch { /* optional */ } }, [studyLogs]);
  useEffect(() => { try { localStorage.setItem(TASK_PRIORITIES_KEY, JSON.stringify(taskPriorities)); } catch { /* optional */ } }, [taskPriorities]);
  useEffect(() => { try { localStorage.setItem(WEAK_TOPICS_KEY, JSON.stringify(weakTopics)); } catch { /* optional */ } }, [weakTopics]);
  useEffect(() => { try { localStorage.setItem(QUIZ_HISTORY_KEY, JSON.stringify(quizHistory)); } catch { /* optional */ } }, [quizHistory]);
  useEffect(() => { try { localStorage.setItem(DIFFICULTY_RATINGS_KEY, JSON.stringify(difficultyRatings)); } catch { /* optional */ } }, [difficultyRatings]);

  useEffect(() => {
    const audio = new Audio();
    customAudioRef.current = audio;

    const onTimeUpdate = () => {
      setTrackProgress(audio.currentTime || 0);
    };
    const onLoadedMetadata = () => {
      setTrackDuration(audio.duration || 0);
    };
    const onEnded = () => {
      if (!audio.loop) {
        const tracks = customTracksRef.current || [];
        const currentId = activeTrackIdRef.current;
        const curIdx = tracks.findIndex((t) => t.id === currentId);
        if (tracks.length > 1 && curIdx !== -1 && curIdx + 1 < tracks.length && playCustomTrackRef.current) {
          playCustomTrackRef.current(tracks[curIdx + 1]);
        } else {
          setIsTrackPlaying(false);
        }
      }
    };
    const onError = () => {
      setIsTrackPlaying(false);
      setAudioStatusMessage('Could not decode or play this audio track.');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    getAllCustomTracks().then((tracks) => {
      setCustomTracks(tracks);
    }).catch(() => {});

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      if (currentObjectUrlRef.current) {
        URL.revokeObjectURL(currentObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    customTracksRef.current = customTracks;
  }, [customTracks]);
  useEffect(() => {
    activeTrackIdRef.current = activeTrackId;
  }, [activeTrackId]);

  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (ambientStateRef.current.ctx) {
        try { ambientStateRef.current.ctx.close(); } catch { /* optional */ }
      }
    };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextNow = new Date();
      const nextTodayKey = localDateKey(nextNow);
      const previousTodayKey = lastTodayKeyRef.current;
      setNow(nextNow);
      if (nextTodayKey !== previousTodayKey) {
        // Keep the calendar following today's date only when the user had
        // selected the previous day; preserve intentional date selections.
        setSelectedCalendarDate((current) => current === previousTodayKey ? nextTodayKey : current);
        setCalendarMonth((current) => {
          const wasShowingPreviousCurrentMonth = current.getFullYear() === Number(previousTodayKey.slice(0, 4))
            && current.getMonth() === Number(previousTodayKey.slice(5, 7)) - 1;
          return wasShowingPreviousCurrentMonth ? new Date(nextNow.getFullYear(), nextNow.getMonth(), 1) : current;
        });
        lastTodayKeyRef.current = nextTodayKey;
      }
    }, 60000);
    return () => window.clearInterval(timer);
  }, []);

  async function checkConnection() {
    setModelStatus('checking');
    setModelMessage('Checking your local AI…');
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/health');
      if (data.model) setModelName(data.model);
      if (data.ollamaConnected && data.modelInstalled) {
        setModelStatus('connected');
        setModelMessage(`${data.model} is loaded and ready on this computer.`);
      } else if (!data.ollamaConnected) {
        setModelStatus('offline');
        setModelMessage('Ollama is not responding. Open Ollama and try again.');
      } else {
        setModelStatus('missing-model');
        setModelMessage(`${data.model} is not installed. Run ollama pull ${data.model}.`);
      }
    } catch {
      setModelStatus('offline');
      setModelMessage('The local API is not responding. Check that node server.js is running.');
    }
  }

  useEffect(() => { checkConnection(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  function addSubjectToLibrary(subject) {
    const clean = subject.trim().slice(0, 100);
    if (!clean || subjectLibrary.includes(clean)) return;
    setSubjectLibrary((prev) => [...prev, clean]);
  }

  function removeSubjectFromLibrary(subject) {
    setSubjectLibrary((prev) => prev.filter((s) => s !== subject));
  }

  function applySubjectChip(subject) {
    setSubjects((prev) => {
      const current = prev.trim();
      if (!current) return subject;
      if (current.toLowerCase().includes(subject.toLowerCase())) return prev;
      return `${current}, ${subject}`;
    });
  }

  function saveCurrentSubjectsToLibrary() {
    subjects.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).forEach(addSubjectToLibrary);
  }

  function makeSavedPlan(nextPlan, returnedModel = modelName) {
    const savedPlan = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      subjects: subjects.trim(),
      hours: Number(hours),
      days: Number(days),
      deadlines: deadlines.trim(),
      goal: goal.trim(),
      plan: nextPlan,
      model: returnedModel,
    };
    setPlan(nextPlan);
    setCurrentPlanId(savedPlan.id);
    setSavedPlans((current) => [savedPlan, ...current].slice(0, 12));
    setCompletedByPlan((current) => ({ ...current, [savedPlan.id]: {} }));
    setTaskFilter('all');
    setTaskSearch('');
    setScheduleNotice('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setCopied(false);
    setDownloaded(false);
    setTaskFilter('all');
    try {
      const classTimetable = makeTimetableContext(timetable);
      const examDeadlineContext = upcomingExams.slice(0, 8).map((exam) => `${exam.title}${exam.subject ? ` (${exam.subject})` : ''} — ${exam.date}${exam.notes ? ` — ${exam.notes}` : ''}`).join('\n').slice(0, 650);
      const combinedDeadlines = [deadlines.trim().slice(0, 2300), examDeadlineContext].filter(Boolean).join('\n').slice(0, 2950);
      const data = await requestJson('http://127.0.0.1:3001/api/study-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects, hours, days: Number(days), deadlines: combinedDeadlines, goal, classTimetable,
          difficultyHints: getDifficultyHintsForPlan(),
          currentDate: todayKey,
          currentDay: now.toLocaleDateString('en-US', { weekday: 'long' }),
          currentTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          studyStartTime,
          studyEndTime,
        }),
      });
      if (typeof data.plan !== 'string' || !data.plan.trim()) throw new Error('The AI returned an empty plan. Please try again.');
      makeSavedPlan(data.plan, data.model || modelName);
      setModelStatus('connected');
      setModelMessage(`${data.model || modelName} generated your study plan locally.`);
      document.getElementById('study-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      setError(err.message || 'Something went wrong. Check that the local API and Ollama are running.');
      if (err instanceof TypeError) { setModelStatus('offline'); setModelMessage('Could not reach the local API. Check both terminals.'); }
    } finally { setLoading(false); }
  }

  async function handleRefine(event) {
    event.preventDefault();
    if (!plan.trim() || !refineRequest.trim()) return;
    setRefining(true);
    setError('');
    try {
      const classTimetable = makeTimetableContext(timetable);
      const examDeadlineContext = upcomingExams.slice(0, 8).map((exam) => `${exam.title}${exam.subject ? ` (${exam.subject})` : ''} — ${exam.date}${exam.notes ? ` — ${exam.notes}` : ''}`).join('\n').slice(0, 650);
      const combinedDeadlines = [deadlines.trim().slice(0, 2300), examDeadlineContext].filter(Boolean).join('\n').slice(0, 2950);
      const data = await requestJson('http://127.0.0.1:3001/api/refine-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan, instruction: refineRequest, subjects, hours, days: Number(days), deadlines: combinedDeadlines, goal, classTimetable,
          difficultyHints: getDifficultyHintsForPlan(),
          currentDate: todayKey,
          currentDay: now.toLocaleDateString('en-US', { weekday: 'long' }),
          currentTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          studyStartTime,
          studyEndTime,
        }),
      });
      if (typeof data.plan !== 'string' || !data.plan.trim()) throw new Error('The AI returned an empty revision. Please try again.');
      makeSavedPlan(data.plan, data.model || modelName);
      setRefineRequest('');
      setModelStatus('connected');
      setModelMessage(`${data.model || modelName} updated your study plan locally.`);
    } catch (err) {
      setError(err.message || 'Could not revise the plan. Check that Ollama is running.');
    } finally { setRefining(false); }
  }

  const parsedDays = useMemo(() => parseStudyPlan(plan), [plan]);
  const currentCompletion = currentPlanId ? (completedByPlan[currentPlanId] || {}) : {};
  const currentPlanMeta = savedPlans.find((item) => item.id === currentPlanId) || (initialActivePlan?.id === currentPlanId ? initialActivePlan : null);
  const todayKey = localDateKey(now);
  const planStartKey = currentPlanMeta?.createdAt ? localDateKey(new Date(currentPlanMeta.createdAt)) : todayKey;
  const planDaysWithDates = useMemo(() => parsedDays.map((day) => ({ ...day, dateKey: dateForPlanDay(planStartKey, day.number) })), [parsedDays, planStartKey]);
  const allTasks = useMemo(() => planDaysWithDates.flatMap((day) => day.blocks.flatMap((block) => block.tasks.map((task) => ({ ...task, dayNumber: day.number, dayTitle: day.title, dayDate: day.dateKey, blockTime: block.time })))), [planDaysWithDates]);
  const trackableTasks = allTasks.filter((task) => !task.isBreak);
  const completedCount = trackableTasks.filter((task) => currentCompletion[task.id]).length;
  const progress = trackableTasks.length ? Math.round((completedCount / trackableTasks.length) * 100) : 0;
  const missedTasks = trackableTasks.filter((task) => task.dayDate < todayKey && !currentCompletion[task.id]);
  const uncompletedFuture = trackableTasks.filter((task) => !currentCompletion[task.id] && task.dayDate >= todayKey);
  const uncompletedAny = trackableTasks.filter((task) => !currentCompletion[task.id]);
  const sortTasksByPriority = (list) => {
    return [...list].sort((a, b) => {
      const pWeight = { high: 3, med: 2, low: 1 };
      const wa = pWeight[taskPriorities[a.id]] || 0;
      const wb = pWeight[taskPriorities[b.id]] || 0;
      return wb - wa;
    });
  };
  const currentFocusTask = sortTasksByPriority(uncompletedFuture)[0] || sortTasksByPriority(uncompletedAny)[0];

  const todayPlanDay = planDaysWithDates.find((day) => day.dateKey === todayKey);
  let todayTotalMinutes = 0;
  let todayRemainingMinutes = 0;
  let todayTotalTasks = 0;
  let todayRemainingTasksCount = 0;

  if (todayPlanDay) {
    const dayTasks = todayPlanDay.blocks.flatMap((b) => b.tasks).filter((t) => !t.isBreak);
    todayTotalTasks = dayTasks.length;
    dayTasks.forEach((t) => {
      const mins = parseDurationMinutes(t);
      todayTotalMinutes += mins;
      if (!currentCompletion[t.id]) {
        todayRemainingMinutes += mins;
        todayRemainingTasksCount += 1;
      }
    });
  }

  let planRemainingMinutes = 0;
  let planRemainingTasksCount = 0;
  trackableTasks.forEach((t) => {
    if (!currentCompletion[t.id]) {
      planRemainingMinutes += parseDurationMinutes(t);
      planRemainingTasksCount += 1;
    }
  });
  const planDayCount = parsedDays.length ? Math.max(...parsedDays.map((day) => Number(day.number) || 1)) : (Number(days) || 0);
  const studyStreak = useMemo(() => {
    const completedDateSet = new Set(
      allTasks.filter((t) => !t.isBreak && currentCompletion[t.id]).map((t) => t.dayDate),
    );
    let streak = 0;
    const checkDate = parseLocalDate(todayKey);
    for (let i = 0; i < 365; i += 1) {
      const dateKey = localDateKey(checkDate);
      if (!completedDateSet.has(dateKey)) break;
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    }
    return streak;
  }, [allTasks, currentCompletion, todayKey]);
  const quotePeriodIndex = useMemo(() => {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((parseLocalDate(localDateKey(now)) - startOfYear) / 86400000);
    if (quoteRotationMode === '12h') {
      // 12h periods: Slot 0 (00:00 - 11:59) and Slot 1 (12:00 - 23:59)
      const halfDay = now.getHours() >= 12 ? 1 : 0;
      return dayOfYear * 2 + halfDay;
    }
    // 24h daily periods: advances once every 24 hours at midnight
    return dayOfYear;
  }, [now, quoteRotationMode]);

  const lastPeriodRef = useRef(quotePeriodIndex);
  useEffect(() => {
    if (lastPeriodRef.current !== quotePeriodIndex) {
      lastPeriodRef.current = quotePeriodIndex;
      setQuoteManualOffset(0); // automatically advances to new quote when 12h or daily period turns
    }
  }, [quotePeriodIndex]);

  const activeQuoteIndex = Math.abs(quotePeriodIndex + quoteManualOffset) % QUOTES.length;
  const activeQuote = QUOTES[activeQuoteIndex];

  function nextQuote() {
    setQuoteManualOffset((prev) => prev + 1);
  }

  function startEditingBlock(dayNumber, block) {
    const blockKey = `${dayNumber}-${block.id}`;
    setEditingBlockKey(blockKey);
    const info = extractBlockTimeAndLabel(block.time);
    setEditStartTime(minutesToTimeInput(info.startMinutes));
    setEditEndTime(minutesToTimeInput(info.endMinutes));
    setEditBlockLabel(info.label);
  }

  function shiftEditTime(deltaMinutes) {
    const startMins = timeToMinutes(editStartTime) ?? (9 * 60);
    const endMins = timeToMinutes(editEndTime) ?? (10 * 60 + 30);
    const duration = Math.max(15, endMins - startMins);
    let newStart = startMins + deltaMinutes;
    let newEnd = newStart + duration;
    if (newStart < 0) {
      newStart = 0;
      newEnd = duration;
    } else if (newEnd > 1440) {
      newEnd = 1440;
      newStart = Math.max(0, 1440 - duration);
    }
    setEditStartTime(minutesToTimeInput(newStart));
    setEditEndTime(minutesToTimeInput(newEnd));
  }

  function saveEditedBlockTime(dayNumber, blockId) {
    const startMins = timeToMinutes(editStartTime);
    const endMins = timeToMinutes(editEndTime);
    if (startMins == null || endMins == null) {
      alert('Please enter a valid start and finish time.');
      return;
    }
    if (endMins <= startMins) {
      alert('Session finish time must be later than start time.');
      return;
    }
    const labelClean = editBlockLabel.trim();
    const timeFormatted = `${formatClock(startMins)} – ${formatClock(endMins)}${labelClean ? ` · ${labelClean}` : ''}`;

    const updatedDays = parsedDays.map((day) => {
      if (day.number !== dayNumber) return day;
      return {
        ...day,
        blocks: day.blocks.map((block) => {
          if (block.id !== blockId) return block;
          return { ...block, time: timeFormatted };
        }),
      };
    });

    const newPlanText = formatPlanText(updatedDays);
    setPlan(newPlanText);
    if (currentPlanId) {
      setSavedPlans((prev) => prev.map((p) => p.id === currentPlanId ? { ...p, plan: newPlanText } : p));
    }
    setEditingBlockKey(null);
  }

  function updateTaskDuration(taskId, newDuration) {
    const updatedDays = parsedDays.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => ({
        ...block,
        tasks: block.tasks.map((task) => {
          if (task.id !== taskId) return task;
          return { ...task, duration: newDuration };
        }),
      })),
    }));
    const newPlanText = formatPlanText(updatedDays);
    setPlan(newPlanText);
    if (currentPlanId) {
      setSavedPlans((prev) => prev.map((p) => p.id === currentPlanId ? { ...p, plan: newPlanText } : p));
    }
  }

  function cycleTaskDuration(taskId, currentDuration) {
    const standardOptions = ['15m', '25m', '30m', '45m', '60m', '90m'];
    const cleaned = (currentDuration || '').toLowerCase().replace(/\s*minutes?|\s*mins?/g, 'm').replace(/[^0-9m]/g, '').trim();
    const currentIndex = standardOptions.indexOf(cleaned);
    const nextDuration = currentIndex >= 0 ? standardOptions[(currentIndex + 1) % standardOptions.length] : '30m';
    updateTaskDuration(taskId, nextDuration);
  }

  function postponeTaskToTomorrow(taskId, currentDayNumber) {
    if (!currentPlanId || !parsedDays.length) return;

    let targetTask = null;
    for (const day of parsedDays) {
      if (day.number === currentDayNumber) {
        for (const block of day.blocks) {
          const found = block.tasks.find((t) => t.id === taskId);
          if (found) {
            targetTask = found;
            break;
          }
        }
      }
      if (targetTask) break;
    }

    if (!targetTask) return;

    const nextDayNumber = currentDayNumber + 1;
    const copiedDays = parsedDays.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => ({
        ...block,
        tasks: block.tasks.map((t) => ({ ...t, details: [...(t.details || [])] })),
      })),
    }));

    // Remove from source day
    const srcDay = copiedDays.find((d) => d.number === currentDayNumber);
    if (srcDay) {
      srcDay.blocks = srcDay.blocks.map((b) => ({
        ...b,
        tasks: b.tasks.filter((t) => t.id !== taskId),
      })).filter((b) => b.tasks.length > 0);
    }

    // Append to destination day
    let destDay = copiedDays.find((d) => d.number === nextDayNumber);
    if (!destDay) {
      destDay = {
        number: nextDayNumber,
        title: 'Extended Study & Catch-up',
        blocks: [],
      };
      copiedDays.push(destDay);
      copiedDays.sort((a, b) => a.number - b.number);
    }

    const newTaskId = `postponed-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const postponedTask = {
      ...targetTask,
      id: newTaskId,
      details: [...(targetTask.details || []), `Postponed from Day ${currentDayNumber}.`],
    };

    if (destDay.blocks.length > 0) {
      const lastBlock = destDay.blocks[destDay.blocks.length - 1];
      lastBlock.tasks.push(postponedTask);
    } else {
      destDay.blocks.push({
        id: `block-${nextDayNumber}-postponed-${Date.now()}`,
        time: '18:00 – 19:30 · Revision & catch-up',
        tasks: [postponedTask],
      });
    }

    // Transfer note and priority if set
    if (taskPriorities[targetTask.id]) {
      setTaskPriorities((prev) => ({ ...prev, [newTaskId]: taskPriorities[targetTask.id] }));
    }
    if (taskNotes[targetTask.id]) {
      setTaskNotes((prev) => ({ ...prev, [newTaskId]: taskNotes[targetTask.id] }));
    }

    const finalDays = copiedDays.filter((d) => d.blocks.length > 0);
    const newPlanText = formatPlanText(finalDays);
    setPlan(newPlanText);
    if (currentPlanId) {
      setSavedPlans((prev) => prev.map((p) => p.id === currentPlanId ? {
        ...p,
        plan: newPlanText,
        days: Math.max(Number(p.days) || 0, ...finalDays.map((d) => Number(d.number) || 0)),
      } : p));
    }
    setScheduleNotice(`Moved “${targetTask.title}” to Day ${nextDayNumber}.`);
  }

  const estimatedHours = (Number(hours) || 0) * planDayCount;
  const subjectCount = subjects.split(/[\n,]/).map((item) => item.trim()).filter(Boolean).length;
  const periodTimeWarnings = useMemo(() => getTimetableTimeWarnings(timetable.periods), [timetable.periods]);
  const currentWeekdayId = WEEKDAYS[(now.getDay() + 6) % 7].id;
  const sortedExams = useMemo(() => [...exams].sort((a, b) => a.date.localeCompare(b.date)), [exams]);
  const upcomingExams = sortedExams.filter((exam) => exam.date >= todayKey);
  const manualDeadlineEntries = useMemo(() => parseManualDeadlineEntries(deadlines, todayKey), [deadlines, todayKey]);
  const allKnownDeadlines = useMemo(() => [...upcomingExams, ...manualDeadlineEntries].sort((a, b) => a.date.localeCompare(b.date)), [upcomingExams, manualDeadlineEntries]);
  const examsByDate = useMemo(() => exams.reduce((map, exam) => { (map[exam.date] ||= []).push(exam); return map; }, {}), [exams]);
  const calendarCells = useMemo(() => {
    const first = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7;
    const total = Math.ceil((offset + daysInMonth) / 7) * 7;
    return Array.from({ length: total }, (_, index) => {
      const dayNumber = index - offset + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      return localDateKey(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber));
    });
  }, [calendarMonth]);
  const selectedDateExams = examsByDate[selectedCalendarDate] || [];

  function addStudyLog({ date, minutes, subject, notes, source = 'manual' }) {
    const mins = Math.max(1, Math.min(720, Number(minutes) || 30));
    const cleanDate = localDateKey(parseLocalDate(date || todayKey));
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: cleanDate,
      minutes: mins,
      subject: (subject || 'General Study').trim().slice(0, 100),
      notes: (notes || '').trim().slice(0, 500),
      source,
      createdAt: new Date().toISOString(),
    };
    setStudyLogs((prev) => [newLog, ...(Array.isArray(prev) ? prev : [])]);
    return newLog;
  }

  function deleteStudyLog(id) {
    setStudyLogs((prev) => (Array.isArray(prev) ? prev.filter((item) => item.id !== id) : []));
  }

  function handleManualLogSubmit(e) {
    e.preventDefault();
    const mins = parseInt(manualLogMinutes, 10);
    if (!mins || mins <= 0) {
      alert('Please enter a valid study duration in minutes.');
      return;
    }
    const subj = manualLogSubject.trim() || 'Self Study';
    addStudyLog({
      date: manualLogDate,
      minutes: mins,
      subject: subj,
      notes: manualLogNotes,
      source: 'manual',
    });
    setLogModalOpen(false);
    setManualLogNotes('');
  }

  const analyticsData = useMemo(() => {
    const dailyMap = {};

    const registerActivity = (dateKey, minutes, subject, title, source, notes, id) => {
      if (!dateKey || minutes <= 0) return;
      if (!dailyMap[dateKey]) dailyMap[dateKey] = { minutes: 0, items: [] };
      dailyMap[dateKey].minutes += minutes;
      dailyMap[dateKey].items.push({
        title: title || subject || 'Study Session',
        minutes,
        subject: (subject || 'General Study').trim(),
        source: source || 'manual',
        notes: notes || '',
        id,
      });
    };

    // 1. Process studyLogs
    for (const log of studyLogs) {
      if (log && log.date && Number(log.minutes) > 0) {
        registerActivity(log.date, Number(log.minutes), log.subject, log.subject, log.source || 'manual', log.notes, log.id);
      }
    }

    // 2. Process completed tasks across all saved plans
    for (const savedPlan of savedPlans) {
      const comp = completedByPlan[savedPlan.id];
      if (!comp || typeof comp !== 'object') continue;
      const parsed = parseStudyPlan(savedPlan.plan);
      const startKey = savedPlan.createdAt ? localDateKey(new Date(savedPlan.createdAt)) : todayKey;
      const planSubjList = savedPlan.subjects ? savedPlan.subjects.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : [];

      for (const day of parsed) {
        const dKey = dateForPlanDay(startKey, day.number);
        for (const block of day.blocks) {
          for (const task of block.tasks) {
            if (!task.isBreak && comp[task.id]) {
              const mins = parseDurationMinutes(task);
              const matchingSubj = planSubjList.find((s) => task.title.toLowerCase().includes(s.toLowerCase())) || planSubjList[0] || task.title;
              registerActivity(dKey, mins, matchingSubj, task.title, 'plan');
            }
          }
        }
      }
    }

    // 3. Totals and Subject aggregations
    let totalMinutes = 0;
    let totalSessions = 0;
    const subjectMinutesMap = {};

    for (const [, dayData] of Object.entries(dailyMap)) {
      totalMinutes += dayData.minutes;
      totalSessions += dayData.items.length;
      for (const item of dayData.items) {
        const subj = item.subject || 'General Study';
        subjectMinutesMap[subj] = (subjectMinutesMap[subj] || 0) + item.minutes;
      }
    }

    // 4. Current Streak calculation
    let currentStreak = 0;
    const todayMins = dailyMap[todayKey]?.minutes || 0;
    let checkDate = parseLocalDate(todayKey);
    if (todayMins === 0) {
      const yesterday = new Date(checkDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yKey = localDateKey(yesterday);
      if ((dailyMap[yKey]?.minutes || 0) > 0) {
        checkDate = yesterday;
      }
    }
    while (true) {
      const key = localDateKey(checkDate);
      if ((dailyMap[key]?.minutes || 0) > 0) {
        currentStreak += 1;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // 5. Longest Streak calculation
    const activeDates = Object.keys(dailyMap).filter((k) => dailyMap[k].minutes > 0).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate = null;
    for (const dStr of activeDates) {
      const currD = parseLocalDate(dStr);
      if (prevDate) {
        const diff = dayDifference(prevDate, currD);
        if (diff === 1) {
          tempStreak += 1;
        } else if (diff > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = currD;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }
    if (currentStreak > longestStreak) longestStreak = currentStreak;

    // 6. 16-Week Heatmap matrix (16 weeks x 7 days = 112 days ending on current week's Sunday)
    const todayObj = parseLocalDate(todayKey);
    const dayIndexMon0 = (todayObj.getDay() + 6) % 7;
    const daysUntilSunday = 6 - dayIndexMon0;
    const endOfWeekObj = new Date(todayObj);
    endOfWeekObj.setDate(todayObj.getDate() + daysUntilSunday);

    const startOfWindowObj = new Date(endOfWeekObj);
    startOfWindowObj.setDate(endOfWeekObj.getDate() - (16 * 7 - 1));

    const weeks = [];
    const monthHeaders = [];
    let lastSeenMonth = -1;

    for (let w = 0; w < 16; w += 1) {
      const weekDays = [];
      for (let d = 0; d < 7; d += 1) {
        const dayOffset = w * 7 + d;
        const cellDate = new Date(startOfWindowObj);
        cellDate.setDate(startOfWindowObj.getDate() + dayOffset);
        const cellKey = localDateKey(cellDate);
        const dayData = dailyMap[cellKey] || { minutes: 0, items: [] };
        const mins = dayData.minutes;
        let level = 0;
        if (mins >= 120) level = 4;
        else if (mins >= 60) level = 3;
        else if (mins >= 30) level = 2;
        else if (mins > 0) level = 1;

        if (d === 0) {
          const m = cellDate.getMonth();
          if (m !== lastSeenMonth) {
            monthHeaders.push({
              colIndex: w,
              label: cellDate.toLocaleDateString('en-US', { month: 'short' }),
            });
            lastSeenMonth = m;
          }
        }

        weekDays.push({
          dateKey: cellKey,
          dayOfWeek: d,
          dayNumber: cellDate.getDate(),
          monthName: cellDate.toLocaleDateString('en-US', { month: 'short' }),
          weekdayName: cellDate.toLocaleDateString('en-US', { weekday: 'short' }),
          minutes: mins,
          hours: (mins / 60).toFixed(mins % 60 === 0 ? 0 : 1),
          level,
          isToday: cellKey === todayKey,
          isFuture: cellKey > todayKey,
          items: dayData.items,
        });
      }
      weeks.push(weekDays);
    }

    // 7. Weekly 7-Day Bar Chart (current Monday to Sunday)
    const currentWeekStart = new Date(todayObj);
    currentWeekStart.setDate(todayObj.getDate() - dayIndexMon0);
    const weeklyBars = [];
    const dailyTargetMinutes = Math.max(30, Math.round((Number(hours) || 2) * 60));
    let weekTotalMinutes = 0;
    let daysOnTarget = 0;

    for (let i = 0; i < 7; i += 1) {
      const bDate = new Date(currentWeekStart);
      bDate.setDate(currentWeekStart.getDate() + i);
      const bKey = localDateKey(bDate);
      const dayData = dailyMap[bKey] || { minutes: 0, items: [] };
      const mins = dayData.minutes;
      weekTotalMinutes += mins;
      const isMet = mins >= dailyTargetMinutes;
      if (isMet) daysOnTarget += 1;

      weeklyBars.push({
        dayName: bDate.toLocaleDateString('en-US', { weekday: 'short' }),
        dateKey: bKey,
        dayNum: bDate.getDate(),
        minutes: mins,
        hours: (mins / 60).toFixed(1),
        isToday: bKey === todayKey,
        isFuture: bKey > todayKey,
        isTargetMet: isMet,
        items: dayData.items,
      });
    }

    const maxWeekMins = Math.max(dailyTargetMinutes * 1.5, ...weeklyBars.map((b) => b.minutes), 60);

    // 8. Subject Distribution Breakdown
    const subjectList = Object.entries(subjectMinutesMap)
      .map(([subj, mins]) => ({
        subject: subj,
        minutes: mins,
        hours: (mins / 60).toFixed(1),
        pct: totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0,
        color: getSubjectColor(subj),
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // 9. Planned vs. Actual Study Time Metrics
    const plannedDays = Number(days) || 3;
    const dailyPlannedHours = Number(hours) || 2;
    const plannedHours = Number((plannedDays * dailyPlannedHours).toFixed(1));
    const plannedTotalMinutes = Math.round(plannedHours * 60);
    const timeVarianceMinutes = totalMinutes - plannedTotalMinutes;
    const timeVarianceHours = (timeVarianceMinutes / 60).toFixed(1);
    const adherencePct = plannedTotalMinutes > 0 ? Math.min(250, Math.round((totalMinutes / plannedTotalMinutes) * 100)) : 100;
    const adherenceStatus = adherencePct >= 85 && adherencePct <= 115
      ? 'On Track'
      : adherencePct > 115
      ? 'Ahead of Schedule'
      : 'Needs Catch-Up';

    return {
      dailyMap,
      currentStreak,
      longestStreak,
      totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(1),
      totalSessions,
      weeks,
      monthHeaders,
      weeklyBars,
      dailyTargetMinutes,
      dailyTargetHours: (dailyTargetMinutes / 60).toFixed(1),
      weekTotalHours: (weekTotalMinutes / 60).toFixed(1),
      daysOnTarget,
      maxWeekMins,
      subjectList,
      plannedDays,
      dailyPlannedHours,
      plannedHours,
      plannedTotalMinutes,
      timeVarianceMinutes,
      timeVarianceHours,
      adherencePct,
      adherenceStatus,
    };
  }, [studyLogs, savedPlans, completedByPlan, todayKey, hours, days]);

  function taskIsVisible(task) {
    if (task.isBreak) return taskFilter === 'all' && (!taskSearch.trim() || task.title.toLowerCase().includes(taskSearch.toLowerCase()));
    const priority = taskPriorities[task.id];
    let matchesFilter = true;
    if (taskFilter === 'completed') {
      matchesFilter = Boolean(currentCompletion[task.id]);
    } else if (taskFilter === 'todo') {
      matchesFilter = !currentCompletion[task.id];
    } else if (taskFilter === 'high') {
      matchesFilter = priority === 'high' || priority === 'med';
    }
    const term = taskSearch.trim().toLowerCase();
    return matchesFilter && (!term || `${task.title} ${task.details.join(' ')} ${task.dayTitle || ''}`.toLowerCase().includes(term));
  }

  function toggleTask(taskId) {
    if (!currentPlanId) return;
    const isNowCompleting = !currentCompletion[taskId];
    setCompletedByPlan((current) => {
      const nextPlanTasks = { ...(current[currentPlanId] || {}) };
      if (nextPlanTasks[taskId]) delete nextPlanTasks[taskId]; else nextPlanTasks[taskId] = true;
      return { ...current, [currentPlanId]: nextPlanTasks };
    });

    if (isNowCompleting) {
      const willFinishDay = todayPlanDay &&
        todayPlanDay.blocks.some((b) => b.tasks.some((t) => t.id === taskId)) &&
        todayRemainingTasksCount <= 1;
      const willFinishPlan = planRemainingTasksCount <= 1;

      if (willFinishDay || willFinishPlan) {
        triggerConfetti();
        playChime();
        if (willFinishPlan) {
          sendNotification('🏆 Study Plan Completed!', {
            body: 'Congratulations! You have completed every task in your study plan.',
          });
        } else if (willFinishDay) {
          sendNotification('🎉 Today’s Study Goals Met!', {
            body: 'Awesome work! You wrapped up all tasks scheduled for today.',
          });
        }
      }
    }
  }

  // Pomodoro ticker
  useEffect(() => {
    let interval = null;
    if (timerRunning) {
      interval = window.setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            playChime();
            const wasFocus = pomodoroMode === 'focus' || pomodoroMode === 'task';
            if (wasFocus) {
              sendNotification('🎉 Focus session complete!', {
                body: 'Great job! Take a short break to recharge.',
              });
              if (autoCompleteOnTimer && currentFocusTask) {
                toggleTask(currentFocusTask.id);
              } else {
                const focusMinutes = Math.max(5, Math.round(timerTotal / 60));
                const focusSubject = currentFocusTask?.title || 'Pomodoro Focus';
                addStudyLog({
                  date: localDateKey(new Date()),
                  minutes: focusMinutes,
                  subject: focusSubject,
                  notes: 'Completed Pomodoro focus session',
                  source: 'pomodoro',
                });
              }
              setPomodoroMode('shortBreak');
              setTimerTotal(5 * 60);
              return 5 * 60;
            } else {
              sendNotification('⚡ Break finished!', {
                body: "Ready for another productive session? Let's go!",
              });
              setPomodoroMode('focus');
              setTimerTotal(25 * 60);
              return 25 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [timerRunning, pomodoroMode, autoCompleteOnTimer, currentFocusTask, timerTotal]);

  function switchTimerMode(mode) {
    setTimerRunning(false);
    setPomodoroMode(mode);
    let seconds = 25 * 60;
    if (mode === 'shortBreak') seconds = 5 * 60;
    else if (mode === 'longBreak') seconds = 15 * 60;
    else if (mode === 'task') {
      const taskMinutes = currentFocusTask ? parseDurationMinutes(currentFocusTask) : 30;
      seconds = Math.max(5, taskMinutes) * 60;
    }
    setTimerSeconds(seconds);
    setTimerTotal(seconds);
  }

  function resetTimer() {
    setTimerRunning(false);
    switchTimerMode(pomodoroMode);
  }

  function formatTime(totalSeconds) {
    const mins = Math.floor(Math.max(0, totalSeconds) / 60);
    const secs = Math.max(0, totalSeconds) % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  async function requestNotificationAccess() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported by your browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationsAllowed(permission === 'granted');
    if (permission === 'granted') {
      sendNotification('🔔 Notifications active', { body: 'StudyMate will notify you when study sessions and breaks complete!' });
    }
  }

  function updateTaskNote(taskId, note) {
    setTaskNotes((current) => {
      const next = { ...current };
      if (!note.trim()) {
        delete next[taskId];
      } else {
        next[taskId] = note.slice(0, 2000);
      }
      return next;
    });
  }

  function cycleTaskPriority(taskId) {
    setTaskPriorities((current) => {
      const next = { ...current };
      const cur = next[taskId];
      if (!cur) next[taskId] = 'high';
      else if (cur === 'high') next[taskId] = 'med';
      else if (cur === 'med') next[taskId] = 'low';
      else delete next[taskId];
      return next;
    });
  }

  // ── Difficulty Rating ────────────────────────────────────────────────────────
  function rateTaskDifficulty(taskId, taskTitle, rating) {
    setDifficultyRatings((current) => {
      const next = { ...current };
      if (rating === 0) delete next[taskId];
      else next[taskId] = { rating, title: taskTitle, ratedAt: new Date().toISOString() };
      return next;
    });
    // Auto-add to weak topics if rated hard (3)
    if (rating === 3) {
      setWeakTopics((prev) => {
        if (prev.includes(taskTitle)) return prev;
        return [...prev, taskTitle].slice(0, 50);
      });
    }
  }

  function cycleTaskDifficulty(taskId, taskTitle) {
    const current = difficultyRatings[taskId]?.rating || 0;
    const next = (current + 1) % 4; // 0 (None) -> 1 (Easy) -> 2 (Med) -> 3 (Hard) -> 0
    rateTaskDifficulty(taskId, taskTitle, next);
  }

  // ── AI Study Assistant ────────────────────────────────────────────────────────
  async function handleAskAssistant(e) {
    e?.preventDefault();
    const q = assistantQuestion.trim();
    if (!q) return;
    setAssistantLoading(true);
    setAssistantError('');
    setAssistantAnswer('');
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/ai-assistant', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, subject: assistantSubject }),
      });
      setAssistantAnswer(data.answer || '');
      setAssistantHistory((prev) => [{ q, subject: assistantSubject, a: data.answer, ts: new Date().toISOString() }, ...prev].slice(0, 20));
      setAssistantQuestion('');
    } catch (err) {
      setAssistantError(err.message || 'Could not get an answer. Make sure Ollama is running.');
    } finally {
      setAssistantLoading(false);
    }
  }

  // ── AI Quiz Generator ─────────────────────────────────────────────────────────
  function parseQuizFromText(text, type) {
    if (!text || typeof text !== 'string') return [];
    if (type === 'short') {
      const questions = [];
      const blocks = text.split(/(?:^|\n)(?=(?:Q\d+[:.]|\d+[\.:]))/i).filter(Boolean);
      blocks.forEach((block, idx) => {
        const lines = block.trim().split('\n');
        const qLine = lines[0]?.replace(/^(?:Q\d+[:.]|\d+[\.:])\s*/i, '').trim();
        const aLine = lines.find((l) => /^(?:Answer|A)[:\s]/i.test(l))?.replace(/^(?:Answer|A)[:\s]+/i, '').trim();
        if (qLine) questions.push({ id: idx, question: qLine, answer: aLine || '', type: 'short' });
      });
      return questions;
    }
    // MCQ parsing
    const questions = [];
    const blocks = text.split(/(?:^|\n)(?=(?:Q\d+[:.]|\d+[\.:]))/i).filter(Boolean);
    blocks.forEach((block, idx) => {
      const lines = block.trim().split('\n');
      const qLine = lines[0]?.replace(/^(?:Q\d+[:.]|\d+[\.:])\s*/i, '').trim();
      const options = {};
      lines.forEach((line) => {
        const m = line.match(/^([A-D])[\)\.:]\s*(.+)/i);
        if (m) options[m[1].toUpperCase()] = m[2].trim();
      });
      const correctMatch = lines.find((l) => /^(?:Correct(?: Answer)?|Answer)[:\s]*([A-D])/i.test(l))?.match(/(?:Correct(?: Answer)?|Answer)[:\s]*([A-D])/i);
      const correctLine = correctMatch ? correctMatch[1].toUpperCase() : undefined;
      const explanationLine = lines.find((l) => /^(?:Explanation|Why)[:\s]/i.test(l))?.replace(/^(?:Explanation|Why)[:\s]+/i, '').trim();
      if (qLine && Object.keys(options).length >= 2) {
        questions.push({ id: idx, question: qLine, options, correct: correctLine, explanation: explanationLine, type: 'mcq' });
      }
    });
    return questions;
  }

  async function handleGenerateQuiz(e) {
    e?.preventDefault();
    setQuizLoading(true);
    setQuizError('');
    setQuizOutput('');
    setParsedQuiz([]);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/generate-quiz', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: quizSubject || subjects,
          topic: quizTopic,
          difficulty: quizDifficulty,
          type: quizType,
          count: Number(quizCount),
        }),
      });
      setQuizOutput(data.quiz || '');
      const parsed = parseQuizFromText(data.quiz || '', quizType);
      setParsedQuiz(parsed);
    } catch (err) {
      setQuizError(err.message || 'Could not generate quiz. Make sure Ollama is running.');
    } finally {
      setQuizLoading(false);
    }
  }

  function submitQuiz() {
    let correct = 0;
    const wrongTopics = [];
    parsedQuiz.forEach((q) => {
      if (q.type === 'mcq') {
        if (quizAnswers[q.id] === q.correct) correct += 1;
        else wrongTopics.push(q.question.slice(0, 80));
      }
    });
    const total = parsedQuiz.filter((q) => q.type === 'mcq').length;
    const score = total > 0 ? Math.round((correct / total) * 100) : null;
    setQuizScore({ correct, total, pct: score });
    setQuizSubmitted(true);
    // Log wrong topics as weak areas
    wrongTopics.forEach((topic) => {
      setWeakTopics((prev) => {
        if (prev.includes(topic)) return prev;
        return [...prev, topic].slice(0, 50);
      });
    });
    // Save to quiz history
    const historyEntry = {
      id: `quiz-${Date.now()}`,
      subject: quizSubject || subjects || 'General',
      topic: quizTopic,
      difficulty: quizDifficulty,
      score,
      correct,
      total,
      wrongTopics,
      date: new Date().toISOString(),
    };
    setQuizHistory((prev) => [historyEntry, ...prev].slice(0, 30));
  }

  // ── Notes Analyzer ────────────────────────────────────────────────────────────
  async function handleAnalyzeNotes(e) {
    e?.preventDefault();
    if (!notesText.trim()) { setNotesError('Please paste or type your notes first.'); return; }
    setNotesLoading(true);
    setNotesError('');
    setNotesAnalysis('');
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/analyze-notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: notesText, subject: notesSubject, mode: notesMode }),
      });
      setNotesAnalysis(data.analysis || '');
    } catch (err) {
      setNotesError(err.message || 'Could not analyze notes. Make sure Ollama is running.');
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleNotesFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    try {
      if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const text = await file.text();
        setNotesText(text.slice(0, 8000));
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        // Basic PDF text extraction via FileReader — reads raw text content
        const reader = new FileReader();
        reader.onload = (ev) => {
          const raw = ev.target?.result;
          // Extract printable ASCII text from PDF binary
          const extracted = String(raw || '').replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{3,}/g, '\n').trim();
          const cleaned = extracted.split('\n').filter((line) => line.trim().length > 3).join('\n').slice(0, 8000);
          setNotesText(cleaned || 'Could not extract text from this PDF. Please paste your notes manually.');
        };
        reader.readAsBinaryString(file);
      } else {
        setNotesError('Please upload a .txt, .md, or .pdf file.');
      }
    } catch {
      setNotesError('Could not read the file. Please paste your notes manually.');
    }
    if (event.target) event.target.value = '';
  }

  // ── Weak Topics ───────────────────────────────────────────────────────────────
  async function handleDetectWeakTopics() {
    setWeakLoading(true);
    setWeakError('');
    setWeakAnalysis('');
    const quizErrors = quizHistory.flatMap((entry) => entry.wrongTopics || []).slice(0, 20);
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/detect-weak-topics', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjects || '',
          difficultTopics: weakTopics,
          quizErrors,
        }),
      });
      setWeakAnalysis(data.analysis || '');
    } catch (err) {
      setWeakError(err.message || 'Could not analyze weak topics. Make sure Ollama is running.');
    } finally {
      setWeakLoading(false);
    }
  }

  function removeWeakTopic(topic) {
    setWeakTopics((prev) => prev.filter((t) => t !== topic));
  }

  function addWeakTopic(topic) {
    const clean = topic.trim().slice(0, 80);
    if (!clean || weakTopics.includes(clean)) return;
    setWeakTopics((prev) => [...prev, clean].slice(0, 50));
  }

  // ── Study Plan Explainer ──────────────────────────────────────────────────────
  async function handleExplainPlan() {
    if (!plan) { setPlanExplainerError('Generate a plan first.'); return; }
    setPlanExplainerLoading(true);
    setPlanExplainerError('');
    setPlanExplanation('');
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/explain-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.slice(0, 5000), subjects, goal, hours: Number(hours), days: Number(days) }),
      });
      setPlanExplanation(data.explanation || '');
    } catch (err) {
      setPlanExplainerError(err.message || 'Could not explain the plan. Make sure Ollama is running.');
    } finally {
      setPlanExplainerLoading(false);
    }
  }

  // ── Exam Readiness ────────────────────────────────────────────────────────────
  async function handleCheckReadiness() {
    setReadinessLoading(true);
    setReadinessError('');
    setReadinessResult('');
    const avgQuizScore = quizHistory.length > 0
      ? quizHistory.slice(0, 5).filter((q) => q.score != null).map((q) => ({ subject: q.subject, score: q.score }))
      : [];
    try {
      const data = await requestJson('http://127.0.0.1:3001/api/exam-readiness', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjects: subjects || '',
          completedTasks: completedCount,
          totalTasks: trackableTasks.length,
          studyHours: Number(analyticsData.totalHours),
          targetHours: Number(hours) * Number(days),
          quizScores: avgQuizScore,
          weakTopics: weakTopics.slice(0, 10),
          daysUntilExam: Number(readinessExamDays) || 7,
        }),
      });
      setReadinessResult(data.readiness || '');
    } catch (err) {
      setReadinessError(err.message || 'Could not calculate readiness. Make sure Ollama is running.');
    } finally {
      setReadinessLoading(false);
    }
  }

  // ── Voice Task Entry ──────────────────────────────────────────────────────────
  function toggleVoiceEntry(target = 'refine') {
    setVoiceTargetField(target);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    if (voiceListening) {
      try { voiceRecognitionRef.current?.stop(); } catch { /* ignore */ }
      setVoiceListening(false);
      return;
    }
    setVoiceError('');
    setVoiceTranscript('');
    voiceTranscriptRef.current = '';
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    voiceRecognitionRef.current = recognition;
    recognition.onstart = () => { setVoiceListening(true); setVoiceError(''); };
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join(' ');
      setVoiceTranscript(transcript);
      voiceTranscriptRef.current = transcript;
    };
    recognition.onend = () => {
      setVoiceListening(false);
      const text = voiceTranscriptRef.current?.trim();
      if (text) {
        if (target === 'subjects') {
          setSubjects((prev) => (prev ? `${prev}, ${text}` : text));
        } else if (target === 'assistant') {
          setAssistantQuestion((prev) => (prev ? `${prev} ${text}` : text));
        } else {
          setRefineRequest((prev) => (prev ? `${prev}. ${text}` : text));
        }
      }
    };
    recognition.onerror = (event) => {
      setVoiceListening(false);
      if (event.error !== 'no-speech') {
        setVoiceError(event.error === 'not-allowed' ? 'Microphone access denied.' : `Speech error: ${event.error}`);
      }
    };
    try {
      recognition.start();
    } catch {
      setVoiceListening(false);
      setVoiceError('Could not start microphone.');
    }
  }

  function startVoiceEntry(target = 'refine') {
    toggleVoiceEntry(target);
  }

  // ── Difficulty-based plan hints ───────────────────────────────────────────────
  function getDifficultyHintsForPlan() {
    const hard = Object.entries(difficultyRatings)
      .filter(([, v]) => v.rating >= 2)
      .map(([, v]) => v.title)
      .slice(0, 10)
      .join(', ');
    const weakList = weakTopics.slice(0, 5).join(', ');
    return [hard, weakList].filter(Boolean).join(', ');
  }

  function stopAmbientSound(fadeDuration = 0.1) {
    const s = ambientStateRef.current;
    const oldGain = s.gainNode;
    const oldSource = s.sourceNode;
    const oldOsc1 = s.osc1;
    const oldOsc2 = s.osc2;
    const oldFilter = s.filterNode;
    const ctx = s.ctx;

    // Immediately detach state so future start calls never conflict
    s.gainNode = null;
    s.sourceNode = null;
    s.osc1 = null;
    s.osc2 = null;
    s.filterNode = null;

    if (oldGain && ctx && ctx.state !== 'closed') {
      try {
        oldGain.gain.setValueAtTime(oldGain.gain.value, ctx.currentTime);
        oldGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + fadeDuration);
      } catch {}
    }

    setTimeout(() => {
      try { if (oldSource) { oldSource.stop(); oldSource.disconnect(); } } catch {}
      try { if (oldOsc1) { oldOsc1.stop(); oldOsc1.disconnect(); } } catch {}
      try { if (oldOsc2) { oldOsc2.stop(); oldOsc2.disconnect(); } } catch {}
      try { if (oldFilter) { oldFilter.disconnect(); } } catch {}
      try { if (oldGain) { oldGain.disconnect(); } } catch {}
    }, Math.round(fadeDuration * 1000) + 40);
  }

  function startAmbientSound(type, volume) {
    // If a custom track is playing, pause it so sounds don't overlap
    if (isTrackPlaying) {
      pauseCustomTrack();
    }

    stopAmbientSound(0.05);

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!ambientStateRef.current.ctx || ambientStateRef.current.ctx.state === 'closed') {
        ambientStateRef.current.ctx = new AudioCtx();
      }
      const ctx = ambientStateRef.current.ctx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const mainGain = ctx.createGain();
      const targetVol = Math.max(0.01, Math.min(1, volume));
      mainGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      mainGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 0.15);
      mainGain.connect(ctx.destination);
      ambientStateRef.current.gainNode = mainGain;

      if (type === 'rain' || type === 'whitenoise' || type === 'ocean') {
        const duration = 5;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
        const dataL = buffer.getChannelData(0);
        const dataR = buffer.getChannelData(1);

        if (type === 'whitenoise') {
          for (let i = 0; i < bufferSize; i += 1) {
            dataL[i] = (Math.random() * 2 - 1) * 0.35;
            dataR[i] = (Math.random() * 2 - 1) * 0.35;
          }
        } else if (type === 'ocean') {
          // Ocean waves: modulated brown noise with rolling swell
          let b0 = 0; let b1 = 0; let b2 = 0;
          for (let i = 0; i < bufferSize; i += 1) {
            const white = Math.random() * 2 - 1;
            b0 = 0.992 * b0 + white * 0.05;
            b1 = 0.96 * b1 + white * 0.09;
            b2 = 0.86 * b2 + white * 0.22;
            const brown = (b0 + b1 + b2) * 0.18;
            const swell = 0.55 + 0.45 * Math.sin((2 * Math.PI * i) / (ctx.sampleRate * 4.8));
            dataL[i] = brown * swell;
            dataR[i] = brown * (0.55 + 0.45 * Math.sin((2 * Math.PI * i) / (ctx.sampleRate * 4.8) + 0.6));
          }
        } else {
          // Rain: pink noise with natural rainfall stereo separation
          let b0 = 0; let b1 = 0; let b2 = 0; let b3 = 0; let b4 = 0; let b5 = 0; let b6 = 0;
          for (let i = 0; i < bufferSize; i += 1) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            const pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
            dataL[i] = pink;
            dataR[i] = pink * (0.92 + Math.random() * 0.16);
          }
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = type === 'rain' ? 880 : type === 'ocean' ? 680 : 1250;

        source.connect(filter);
        filter.connect(mainGain);
        source.start();
        ambientStateRef.current.sourceNode = source;
        ambientStateRef.current.filterNode = filter;
      } else if (type === 'binaural') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.value = 216;
        osc2.frequency.value = 226; // 10 Hz Alpha wave difference

        const pan1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        const pan2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
        if (pan1 && pan2) {
          pan1.pan.value = -0.85;
          pan2.pan.value = 0.85;
          osc1.connect(pan1);
          pan1.connect(mainGain);
          osc2.connect(pan2);
          pan2.connect(mainGain);
        } else {
          osc1.connect(mainGain);
          osc2.connect(mainGain);
        }

        osc1.start();
        osc2.start();
        ambientStateRef.current.osc1 = osc1;
        ambientStateRef.current.osc2 = osc2;
      }
    } catch (err) {
      console.warn('Ambient sound playback error:', err);
    }
  }

  function toggleAmbientSound() {
    if (ambientPlaying) {
      stopAmbientSound();
      setAmbientPlaying(false);
    } else {
      if (isTrackPlaying) {
        pauseCustomTrack();
      }
      startAmbientSound(ambientType, ambientVolume);
      setAmbientPlaying(true);
    }
  }

  function switchAmbientType(nextType) {
    setAmbientType(nextType);
    if (ambientPlaying) {
      startAmbientSound(nextType, ambientVolume);
    }
  }

  function updateAmbientVolume(val) {
    const clamped = Math.max(0.05, Math.min(1, val));
    setAmbientVolume(clamped);
    if (ambientStateRef.current.gainNode && ambientStateRef.current.ctx) {
      try {
        ambientStateRef.current.gainNode.gain.setValueAtTime(clamped, ambientStateRef.current.ctx.currentTime);
      } catch {}
    }
    if (customAudioRef.current) {
      customAudioRef.current.volume = clamped;
    }
  }

  // --- Custom Audio Library Playback Controls ---
  function playCustomTrack(track) {
    if (!track) return;
    playCustomTrackRef.current = playCustomTrack;
    if (ambientPlaying) {
      stopAmbientSound(0.08);
      setAmbientPlaying(false);
    }

    const audio = customAudioRef.current;
    if (!audio) return;

    if (activeTrackId === track.id) {
      if (isTrackPlaying) {
        audio.pause();
        setIsTrackPlaying(false);
        return;
      } else {
        audio.play().then(() => {
          setIsTrackPlaying(true);
          setAudioStatusMessage('');
        }).catch((err) => {
          console.warn('Playback error:', err);
        });
        return;
      }
    }

    if (currentObjectUrlRef.current) {
      URL.revokeObjectURL(currentObjectUrlRef.current);
    }

    try {
      const url = URL.createObjectURL(track.blob);
      currentObjectUrlRef.current = url;
      audio.src = url;
      audio.volume = ambientVolume;
      audio.loop = isLoopTrack;
      audio.currentTime = 0;
      audio.play().then(() => {
        setActiveTrackId(track.id);
        setIsTrackPlaying(true);
        setAudioStatusMessage('');
      }).catch((err) => {
        console.warn('Playback error:', err);
        setAudioStatusMessage('Could not start playback. Browser may require user interaction.');
      });
    } catch {
      setAudioStatusMessage('Error loading audio track from local database.');
    }
  }

  function pauseCustomTrack() {
    const audio = customAudioRef.current;
    if (audio) {
      audio.pause();
      setIsTrackPlaying(false);
    }
  }

  function resumeCustomTrack() {
    const audio = customAudioRef.current;
    if (!audio) return;
    if (ambientPlaying) {
      stopAmbientSound(0.08);
      setAmbientPlaying(false);
    }
    if (activeTrackId) {
      audio.play().then(() => {
        setIsTrackPlaying(true);
      }).catch(() => {});
    } else if (customTracks.length > 0) {
      playCustomTrack(customTracks[0]);
    }
  }

  function toggleCustomTrackPlay() {
    if (isTrackPlaying) {
      pauseCustomTrack();
    } else {
      resumeCustomTrack();
    }
  }

  function toggleLoopTrack() {
    setIsLoopTrack((prev) => {
      const next = !prev;
      if (customAudioRef.current) {
        customAudioRef.current.loop = next;
      }
      return next;
    });
  }

  function seekTrack(timeSec) {
    const audio = customAudioRef.current;
    if (audio && Number.isFinite(timeSec)) {
      audio.currentTime = timeSec;
      setTrackProgress(timeSec);
    }
  }

  async function handleAudioFilesSelected(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setAudioUploadLoading(true);
    setAudioStatusMessage(`Adding ${files.length} track${files.length === 1 ? '' : 's'} to local library…`);

    for (const file of files) {
      let durationSec = 0;
      try {
        const tempUrl = URL.createObjectURL(file);
        const tempAudio = new Audio(tempUrl);
        await new Promise((res) => {
          tempAudio.onloadedmetadata = () => {
            durationSec = Math.round(tempAudio.duration) || 0;
            URL.revokeObjectURL(tempUrl);
            res();
          };
          tempAudio.onerror = () => {
            URL.revokeObjectURL(tempUrl);
            res();
          };
          setTimeout(() => {
            URL.revokeObjectURL(tempUrl);
            res();
          }, 1500);
        });
      } catch {}

      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      const newTrack = {
        id: `track-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: cleanTitle.slice(0, 100),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type || 'audio/mpeg',
        duration: durationSec,
        blob: file,
        createdAt: new Date().toISOString(),
      };

      try {
        await saveCustomTrack(newTrack);
      } catch (err) {
        console.warn('Could not save track to IndexedDB:', err);
      }
    }

    try {
      const updated = await getAllCustomTracks();
      setCustomTracks(updated);
      setAudioStatusMessage(`Added ${files.length} sound${files.length === 1 ? '' : 's'} to your local library!`);
      setTimeout(() => setAudioStatusMessage(''), 3000);
    } catch {}

    setAudioUploadLoading(false);
    if (event.target) event.target.value = '';
  }

  async function handleDeleteCustomTrack(trackId, trackName) {
    if (!window.confirm(`Delete “${trackName}” from your local study sound library?`)) return;
    if (activeTrackId === trackId) {
      pauseCustomTrack();
      setActiveTrackId(null);
    }
    try {
      await deleteCustomTrack(trackId);
      const updated = await getAllCustomTracks();
      setCustomTracks(updated);
    } catch (err) {
      console.warn('Error deleting track:', err);
    }
  }

  function exportPlanIcs() {
    if (!planDaysWithDates.length) return;
    const icsContent = generateIcs(planDaysWithDates, goal || 'Study Plan');
    downloadBlob(`studymate-plan-${todayKey}.ics`, icsContent, 'text/calendar;charset=utf-8');
  }

  function resetProgress() {
    if (!currentPlanId || completedCount === 0) return;
    if (!window.confirm('Reset completion checkmarks for this plan?')) return;
    setCompletedByPlan((current) => ({ ...current, [currentPlanId]: {} }));
  }

  async function copyPlan() {
    const text = formatPlanText(parsedDays) || plan;
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { setError('Clipboard access was blocked by the browser. Use Download or Print instead.'); }
  }

  function downloadPlan() {
    const text = formatPlanText(parsedDays) || plan;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studymate-plan-${localDateKey(new Date())}.txt`;
    document.body.appendChild(link); link.click(); link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true); window.setTimeout(() => setDownloaded(false), 1800);
  }

  function openSavedPlan(item) {
    setSubjects(item.subjects || ''); setHours(String(item.hours ?? 2)); setDays(String(item.days ?? 3));
    setDeadlines(item.deadlines || ''); setGoal(item.goal || ''); setPlan(item.plan || ''); setCurrentPlanId(item.id);
    setError(''); setCopied(false); setDownloaded(false); setTaskFilter('all'); setTaskSearch(''); setScheduleNotice('');
    document.getElementById('study-canvas')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function deleteSavedPlan(id) {
    setSavedPlans((current) => current.filter((item) => item.id !== id));
    setCompletedByPlan((current) => { const next = { ...current }; delete next[id]; return next; });
    if (currentPlanId === id) { setCurrentPlanId(null); setPlan(''); }
  }

  function removeCurrentPlan() {
    if (!plan) return;
    if (!window.confirm('Remove this study plan from your canvas? It will also be removed from your saved plans.')) return;
    if (currentPlanId) {
      setSavedPlans((current) => current.filter((item) => item.id !== currentPlanId));
      setCompletedByPlan((current) => {
        const next = { ...current };
        delete next[currentPlanId];
        return next;
      });
    }
    setCurrentPlanId(null);
    setPlan('');
    setEditingBlockKey(null);
    setScheduleNotice('');
    setError('');
    setCopied(false);
    setDownloaded(false);
    setTaskFilter('all');
    setTaskSearch('');
    setActiveNoteTaskId(null);
  }

  function clearSavedPlans() {
    if (!window.confirm('Clear all saved study plans and their completion progress? This cannot be undone.')) return;
    setSavedPlans([]); setCompletedByPlan({}); setCurrentPlanId(null); setPlan('');
  }

  function updatePeriodTime(periodIndex, field, value) {
    setTimetable((current) => ({
      ...current,
      periods: current.periods.map((period, index) => index === periodIndex ? { ...period, [field]: value } : period),
    }));
  }

  function updateTimetableSubject(dayIndex, periodIndex, value) {
    setTimetable((current) => ({
      ...current,
      days: current.days.map((day, index) => index === dayIndex ? {
        ...day,
        slots: day.slots.map((subject, slotIndex) => slotIndex === periodIndex ? value.slice(0, 100) : subject),
      } : day),
    }));
  }

  function applyTimetablePreset(presetId) {
    const preset = TIMETABLE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setTimetable((current) => ({
      ...current,
      periods: current.periods.map((period, idx) => {
        const presetPeriod = preset.periods[idx];
        return presetPeriod ? { ...period, start: presetPeriod.start, end: presetPeriod.end } : period;
      }),
    }));
  }

  function copyPeriodToAllWeekdays(periodIndex) {
    const sourceSubject = timetable.days[0]?.slots[periodIndex] || timetable.days.find((d) => d.slots[periodIndex]?.trim())?.slots[periodIndex] || '';
    if (!sourceSubject.trim()) {
      alert(`Period ${periodIndex + 1} has no subject on Monday to copy. Enter a subject in Monday's slot first.`);
      return;
    }
    setTimetable((current) => ({
      ...current,
      days: current.days.map((day, dIdx) => {
        if (dIdx < 5) {
          const nextSlots = [...day.slots];
          nextSlots[periodIndex] = sourceSubject;
          return { ...day, slots: nextSlots };
        }
        return day;
      }),
    }));
  }

  function clearTimetable() {
    if (!window.confirm('Clear all timetable subjects and period timings?')) return;
    setTimetable(createDefaultTimetable());
  }

  function exportTimetableCsv() {
    const header = ['Day', ...timetable.periods.flatMap((period) => [
      `${period.label} Subject`, `${period.label} Start`, `${period.label} End`,
    ])];
    const rows = timetable.days.map((day) => [day.label, ...timetable.periods.flatMap((period, index) => [
      day.slots[index], period.start, period.end,
    ])]);
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studymate-timetable-${localDateKey(new Date())}.csv`;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function addExam(event) {
    event.preventDefault();
    const title = examTitle.trim();
    if (!title || !examDate) return;
    const item = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: title.slice(0, 160),
      subject: examSubject.trim().slice(0, 120),
      date: examDate,
      notes: examNotes.trim().slice(0, 1000),
      createdAt: new Date().toISOString(),
    };
    setExams((current) => normalizeExams([item, ...current]));
    setCalendarMonth(new Date(Number(examDate.slice(0, 4)), Number(examDate.slice(5, 7)) - 1, 1));
    setSelectedCalendarDate(examDate);
    setExamTitle(''); setExamSubject(''); setExamDate(''); setExamNotes('');
  }

  function deleteExam(id) {
    const item = exams.find((exam) => exam.id === id);
    if (!item || !window.confirm(`Delete “${item.title}” from your calendar?`)) return;
    setExams((current) => current.filter((exam) => exam.id !== id));
  }

  function rescheduleMissedTasks() {
    if (!currentPlanId || !plan.trim()) {
      setError('Generate or open a saved study plan before rescheduling missed tasks.');
      return;
    }
    const missed = allTasks.filter((task) => !task.isBreak && task.dayDate < todayKey && !currentCompletion[task.id]);
    if (!missed.length) {
      setError('');
      setScheduleNotice('There are no unfinished tasks from past plan days. Your schedule is up to date.');
      return;
    }

    const copiedDays = parsedDays.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => ({ ...block, tasks: block.tasks.map((task) => ({ ...task, details: [...(task.details || [])] })) })),
    }));
    const taskQueue = [];
    const totalPartsBySource = {};
    const normalizeTopicText = (value) => String(value || '').toLowerCase().replace(/c\+\+/g, ' cpp ').replace(/mathematics/g, ' maths ').replace(/[^a-z0-9]+/g, ' ').trim();
    const stopWords = new Set(['the', 'and', 'for', 'with', 'from', 'study', 'review', 'practice', 'task', 'exam', 'test', 'internal', 'assignment', 'unit', 'paper', 'prepare', 'preparation']);
    function deadlineForTask(task) {
      const taskText = normalizeTopicText(`${task.title} ${(task.details || []).join(' ')}`);
      const taskTokens = new Set(taskText.split(/\s+/).filter((word) => word.length > 1 && !stopWords.has(word)));
      const matches = allKnownDeadlines.filter((exam) => {
        const subjectText = normalizeTopicText(exam.subject);
        if (subjectText && (taskText.includes(subjectText) || subjectText.includes(taskText))) return true;
        const examTokens = normalizeTopicText(`${exam.title} ${exam.subject} ${exam.notes}`).split(/\s+/).filter((word) => word.length > 1 && !stopWords.has(word));
        return examTokens.some((word) => taskTokens.has(word));
      }).sort((a, b) => a.date.localeCompare(b.date));
      return matches[0]?.date || '';
    }
    for (const task of missed) {
      const requestedMinutes = parseDurationMinutes(task);
      const taskDeadline = deadlineForTask(task);
      const dailyLimit = Math.max(30, Math.round((Number(hours) || 2) * 60));
      const partCount = Math.max(1, Math.ceil(requestedMinutes / dailyLimit));
      totalPartsBySource[task.id] = partCount;
      let left = requestedMinutes;
      for (let part = 1; part <= partCount; part += 1) {
        const chunk = Math.min(dailyLimit, left);
        taskQueue.push({
          sourceId: task.id,
          sourceDayNumber: task.dayNumber,
          sourceTitle: task.title,
          deadlineDate: taskDeadline,
          task: { ...task, title: partCount > 1 ? `${task.title} (part ${part} of ${partCount})` : task.title, duration: `${chunk} minutes`, details: [...(task.details || [])] },
          minutes: chunk,
        });
        left -= chunk;
      }
    }

    taskQueue.sort((a, b) => (a.deadlineDate || '9999-12-31').localeCompare(b.deadlineDate || '9999-12-31'));
    const startOffset = Math.max(0, dayDifference(planStartKey, todayKey));
    const currentMinute = now.getHours() * 60 + now.getMinutes();
    const nextQuarterHour = Math.ceil((currentMinute + 1) / 15) * 15;
    const successfulPartsBySource = {};
    const unsuccessfulSourceIds = new Set();
    let placedParts = 0;

    const userEarliest = toMinutesOfDay(studyStartTime) ?? (7 * 60);
    const endOfDay = toMinutesOfDay(studyEndTime) ?? (22 * 60);

    function classRangesForDate(date) {
      const weekdayIndex = (date.getDay() + 6) % 7;
      const day = timetable.days[weekdayIndex];
      const ranges = [];
      timetable.periods.forEach((period, index) => {
        if (!day?.slots[index]?.trim()) return;
        const start = toMinutesOfDay(period.start);
        const end = toMinutesOfDay(period.end);
        if (start != null && end != null && end > start) ranges.push({ start, end: Math.min(endOfDay, end + 5), kind: 'class' });
      });
      return ranges;
    }

    function getFirstFreeSlot(ranges, duration, earliest) {
      const ordered = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
      let cursor = Math.max(userEarliest, earliest);
      for (const range of ordered) {
        if (range.end <= cursor) continue;
        if (range.start - cursor >= duration) return { start: cursor, end: cursor + duration };
        cursor = Math.max(cursor, range.end);
        if (cursor >= endOfDay) return null;
      }
      return cursor + duration <= endOfDay ? { start: cursor, end: cursor + duration } : null;
    }

    for (let offset = startOffset; offset <= startOffset + 60 && taskQueue.length; offset += 1) {
      const targetDate = parseLocalDate(planStartKey);
      targetDate.setDate(targetDate.getDate() + offset);
      const targetDateKey = localDateKey(targetDate);
      const targetDayNumber = offset + 1;
      let targetDay = copiedDays.find((day) => day.number === targetDayNumber);
      const existingWorkMinutes = targetDay
        ? targetDay.blocks.flatMap((block) => block.tasks).filter((task) => !task.isBreak).reduce((sum, task) => sum + parseDurationMinutes(task), 0)
        : 0;
      let remainingCapacity = Math.max(0, Math.round((Number(hours) || 2) * 60) - existingWorkMinutes);
      if (remainingCapacity < 15) continue;

      while (taskQueue.length) {
        const occupied = classRangesForDate(targetDate);
        if (targetDay) {
          for (const block of targetDay.blocks) {
            const range = parseClockRange(block.time);
            if (range) occupied.push({ ...range, end: Math.min(22 * 60, range.end + 5), kind: 'existing-study' });
          }
        }
        const earliest = targetDateKey === todayKey ? nextQuarterHour : 7 * 60;
        let queueIndex = -1;
        let slot = null;
        // Try every task that fits the remaining daily limit. If a long task
        // does not fit a free window, a shorter task can still use that gap.
        for (let index = 0; index < taskQueue.length; index += 1) {
          if (taskQueue[index].minutes > remainingCapacity) continue;
          if (taskQueue[index].deadlineDate && targetDateKey >= taskQueue[index].deadlineDate) continue;
          const candidate = getFirstFreeSlot(occupied, taskQueue[index].minutes, earliest);
          if (candidate) { queueIndex = index; slot = candidate; break; }
        }
        if (queueIndex < 0 || !slot) break;
        const item = taskQueue[queueIndex];
        if (!targetDay) {
          targetDay = { number: targetDayNumber, title: 'Catch-up and revision', blocks: [] };
          copiedDays.push(targetDay);
          copiedDays.sort((a, b) => a.number - b.number);
        }
        const rescheduledTask = {
          ...item.task,
          id: `rescheduled-${item.sourceId}-${item.sourceTitle.length}-${placedParts}`,
          isBreak: false,
          rescheduleSourceId: item.sourceId,
          details: [...item.task.details, `Moved from Day ${item.sourceDayNumber} because this task was unfinished.`],
        };
        targetDay.blocks.push({
          id: `catchup-${targetDayNumber}-${placedParts}`,
          time: `${formatClock(slot.start)} – ${formatClock(slot.end)} · Catch-up`,
          tasks: [rescheduledTask],
        });
        targetDay.blocks.sort((a, b) => (parseClockRange(a.time)?.start ?? 1440) - (parseClockRange(b.time)?.start ?? 1440));
        remainingCapacity -= item.minutes;
        successfulPartsBySource[item.sourceId] = (successfulPartsBySource[item.sourceId] || 0) + 1;
        taskQueue.splice(queueIndex, 1);
        placedParts += 1;
      }
    }

    Object.keys(totalPartsBySource).forEach((sourceId) => {
      if ((successfulPartsBySource[sourceId] || 0) !== totalPartsBySource[sourceId]) unsuccessfulSourceIds.add(sourceId);
    });
    if (placedParts === 0) {
      setError('No safe study slot was found in the next 60 days. Add or correct your timetable times, or increase daily study time, then try again.');
      return;
    }

    const successfulSourceIds = new Set(Object.keys(totalPartsBySource).filter((id) => !unsuccessfulSourceIds.has(id)));
    const finalDays = copiedDays.map((day) => ({
      ...day,
      blocks: day.blocks.map((block) => ({
        ...block,
        tasks: block.tasks
          // Roll back tentative split sessions for sources that could not all fit.
          .filter((task) => !(task.rescheduleSourceId && unsuccessfulSourceIds.has(task.rescheduleSourceId)))
          // Remove the old task only if every rescheduled part was placed.
          .filter((task) => !(successfulSourceIds.has(task.id) && !task.rescheduleSourceId))
          .map((task) => {
            const clean = { ...task };
            delete clean.rescheduleSourceId;
            return clean;
          }),
      })).filter((block) => block.tasks.length > 0),
    })).filter((day) => day.blocks.length > 0);

    const completedSignatures = new Set(allTasks.filter((task) => currentCompletion[task.id]).map((task) => `${task.dayNumber}||${task.blockTime}||${task.title}`));
    const revisedText = formatPlanText(finalDays);
    const revisedParsed = parseStudyPlan(revisedText);
    const revisedCompletion = {};
    for (const day of revisedParsed) {
      for (const block of day.blocks) {
        for (const task of block.tasks) {
          if (completedSignatures.has(`${day.number}||${block.time}||${task.title}`)) revisedCompletion[task.id] = true;
        }
      }
    }
    const completeMovedTasks = missed.filter((task) => successfulSourceIds.has(task.id)).length;
    const failedCount = missed.length - completeMovedTasks;
    setPlan(revisedText);
    setCompletedByPlan((current) => ({ ...current, [currentPlanId]: revisedCompletion }));
    setSavedPlans((current) => current.map((item) => item.id === currentPlanId ? { ...item, plan: revisedText, days: Math.max(Number(item.days) || 0, ...finalDays.map((day) => Number(day.number) || 0)), lastRescheduledAt: new Date().toISOString() } : item));
    setTaskFilter('all'); setTaskSearch(''); setError('');
    setScheduleNotice(failedCount ? `Moved ${completeMovedTasks} missed task${completeMovedTasks === 1 ? '' : 's'} into free slots. ${failedCount} task${failedCount === 1 ? '' : 's'} could not fit and remain in the original plan.` : `Successfully rescheduled ${completeMovedTasks} missed task${completeMovedTasks === 1 ? '' : 's'} into free study slots.`);
  }

  function exportBackup() {
    const payload = {
      app: 'StudyMate',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        savedPlans, completedByPlan, currentPlanId, timetable, exams, taskNotes, taskPriorities, subjectLibrary, studyStartTime, studyEndTime, quoteRotationMode, studyLogs,
        weakTopics, quizHistory, difficultyRatings,
        draft: { subjects, hours, days, deadlines, goal },
      },
    };
    downloadBlob(`studymate-backup-${todayKey}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
    setBackupMessage('Backup downloaded. Keep the JSON file somewhere safe to restore it later.');
  }


  function startRestoreBackup() {
    restoreFileInput.current?.click();
  }

  async function restoreBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      if (file.size > 15 * 1024 * 1024) throw new Error('This backup is larger than 15 MB.');
      const backup = JSON.parse(await file.text());
      if (backup?.app !== 'StudyMate' || backup?.version !== BACKUP_VERSION || !backup?.data || typeof backup.data !== 'object') {
        throw new Error('This file is not a supported StudyMate backup. Export a fresh backup from StudyMate and try again.');
      }
      if (!window.confirm('Restore this backup and replace the StudyMate data currently saved in this browser?')) return;
      const data = backup.data;
      const nextPlans = Array.isArray(data.savedPlans) ? data.savedPlans.filter((item) => item && typeof item.id === 'string' && typeof item.plan === 'string')
        .slice(0, 100).map((item) => ({
          id: item.id.slice(0, 100),
          createdAt: typeof item.createdAt === 'string' && !Number.isNaN(Date.parse(item.createdAt)) ? item.createdAt : new Date().toISOString(),
          subjects: typeof item.subjects === 'string' ? item.subjects.slice(0, 4000) : '',
          hours: Number.isFinite(Number(item.hours)) ? Number(item.hours) : 2,
          days: [3, 5, 7].includes(Number(item.days)) ? Number(item.days) : 3,
          deadlines: typeof item.deadlines === 'string' ? item.deadlines.slice(0, 3000) : '',
          goal: typeof item.goal === 'string' ? item.goal.slice(0, 500) : '',
          plan: item.plan.slice(0, 200000),
          model: typeof item.model === 'string' ? item.model.slice(0, 100) : 'unknown',
          lastRescheduledAt: typeof item.lastRescheduledAt === 'string' ? item.lastRescheduledAt : undefined,
        })) : [];
      const nextTimetable = normalizeTimetable(data.timetable);
      const nextExams = normalizeExams(data.exams);
      const rawCompletion = data.completedByPlan && typeof data.completedByPlan === 'object' && !Array.isArray(data.completedByPlan) ? data.completedByPlan : {};
      const nextCompletion = {};
      for (const planItem of nextPlans) {
        const tasks = rawCompletion[planItem.id];
        if (tasks && typeof tasks === 'object' && !Array.isArray(tasks)) {
          nextCompletion[planItem.id] = Object.fromEntries(Object.entries(tasks).filter(([key, value]) => typeof key === 'string' && value === true).slice(0, 10000));
        }
      }
      const activeId = nextPlans.some((item) => item.id === data.currentPlanId) ? data.currentPlanId : null;
      const activePlan = nextPlans.find((item) => item.id === activeId) || null;
      setSavedPlans(nextPlans); setCompletedByPlan(nextCompletion); setCurrentPlanId(activeId); setTimetable(nextTimetable); setExams(nextExams);
      if (data.taskNotes && typeof data.taskNotes === 'object' && !Array.isArray(data.taskNotes)) {
        setTaskNotes(data.taskNotes);
      }
      if (data.taskPriorities && typeof data.taskPriorities === 'object' && !Array.isArray(data.taskPriorities)) {
        setTaskPriorities(data.taskPriorities);
      }
      if (Array.isArray(data.subjectLibrary)) {
        setSubjectLibrary(data.subjectLibrary.filter((s) => typeof s === 'string' && s.trim()));
      }
      if (typeof data.studyStartTime === 'string') {
        setStudyStartTime(data.studyStartTime);
      }
      if (typeof data.studyEndTime === 'string') {
        setStudyEndTime(data.studyEndTime);
      }
      if (data.quoteRotationMode === '12h' || data.quoteRotationMode === '24h') {
        setQuoteRotationMode(data.quoteRotationMode);
      }
      if (Array.isArray(data.studyLogs)) {
        setStudyLogs(data.studyLogs.filter((l) => l && typeof l === 'object' && typeof l.id === 'string'));
      }
      const draft = data.draft && typeof data.draft === 'object' ? data.draft : {};
      setSubjects(typeof draft.subjects === 'string' ? draft.subjects : (activePlan?.subjects || initialSubjects));
      setHours(String(draft.hours ?? activePlan?.hours ?? 2));
      setDays(String([3, 5, 7].includes(Number(draft.days)) ? Number(draft.days) : (activePlan?.days || 3)));
      setDeadlines(typeof draft.deadlines === 'string' ? draft.deadlines : (activePlan?.deadlines || ''));
      setGoal(typeof draft.goal === 'string' ? draft.goal : (activePlan?.goal || ''));
      setPlan(activePlan?.plan || '');
      setError(''); setBackupMessage('Backup restored successfully. Your timetable, exams, saved plans, task notes, and progress have been loaded.');
    } catch (restoreError) {
      setBackupMessage(restoreError.message || 'Could not restore this backup.');
    } finally {
      if (event.target) event.target.value = '';
    }
  }

  function useTemplate(template) {
    setSubjects(template.subjects); setHours(template.hours); setDays(template.days); setGoal(template.goal); setDeadlines(template.deadlines);
    document.getElementById('subjects')?.focus();
    document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const commandList = useMemo(() => [
    {
      id: 'focus-modal',
      title: 'Open Focus Mode & Pomodoro',
      subtitle: 'Full-screen timer, active task, and ambient sound',
      category: 'Focus',
      icon: '⚡',
      shortcut: 'Space',
      action: () => { setFocusOpen(true); setCommandPaletteOpen(false); },
    },
    {
      id: 'toggle-timer',
      title: timerRunning ? 'Pause Focus Timer' : 'Start Focus Timer',
      subtitle: timerRunning ? `Running: ${formatTime(timerSeconds)}` : '25m pomodoro / task duration',
      category: 'Focus',
      icon: '⏱️',
      shortcut: 'T',
      action: () => { setTimerRunning((r) => !r); setCommandPaletteOpen(false); },
    },
    {
      id: 'sound-library',
      title: 'Open Sound & Music Library',
      subtitle: `Manage your local songs and ambient atmospheres (${customTracks.length} custom sounds)`,
      category: 'Audio',
      icon: '🎵',
      action: () => { setFocusOpen(true); setSoundTab('library'); setCommandPaletteOpen(false); },
    },
    {
      id: 'ambient-toggle',
      title: ambientPlaying ? 'Stop Ambient Sound' : `Play Ambient Sound (${ambientType})`,
      subtitle: 'Background noise to drown out distractions',
      category: 'Audio',
      icon: '🎧',
      shortcut: 'M',
      action: () => { toggleAmbientSound(); setCommandPaletteOpen(false); },
    },
    {
      id: 'ambient-rain',
      title: 'Ambient Sound: Gentle Rain',
      subtitle: 'Pink noise spectrum with smooth lowpass filter',
      category: 'Audio',
      icon: '🌧️',
      action: () => { switchAmbientType('rain'); if (!ambientPlaying) toggleAmbientSound(); setCommandPaletteOpen(false); },
    },
    {
      id: 'ambient-ocean',
      title: 'Ambient Sound: Ocean Waves',
      subtitle: 'Rhythmic rolling surf with gentle swell',
      category: 'Audio',
      icon: '🌊',
      action: () => { switchAmbientType('ocean'); if (!ambientPlaying) toggleAmbientSound(); setCommandPaletteOpen(false); },
    },
    {
      id: 'ambient-binaural',
      title: 'Ambient Sound: Alpha Waves (10 Hz)',
      subtitle: 'Stereo binaural beats for deep learning focus',
      category: 'Audio',
      icon: '🧘',
      action: () => { switchAmbientType('binaural'); if (!ambientPlaying) toggleAmbientSound(); setCommandPaletteOpen(false); },
    },
    {
      id: 'ambient-whitenoise',
      title: 'Ambient Sound: White Noise',
      subtitle: 'Broadband frequency masking',
      category: 'Audio',
      icon: '💨',
      action: () => { switchAmbientType('whitenoise'); if (!ambientPlaying) toggleAmbientSound(); setCommandPaletteOpen(false); },
    },
    ...(customTracks.length > 0 ? [
      {
        id: 'toggle-custom-song',
        title: isTrackPlaying ? `Pause Music: ${customTracks.find((t) => t.id === activeTrackId)?.name || 'Custom Track'}` : `Play Custom Music (${customTracks.length} tracks)`,
        subtitle: 'Play/pause tracks from your local focus library',
        category: 'Audio',
        icon: '🎧',
        action: () => { toggleCustomTrackPlay(); setCommandPaletteOpen(false); },
      },
      ...customTracks.slice(0, 5).map((track) => ({
        id: `track-${track.id}`,
        title: `Play Track: ${track.name}`,
        subtitle: `Local audio · ${formatFileSize(track.fileSize)}`,
        category: 'My Audio',
        icon: '🎵',
        action: () => { playCustomTrack(track); setCommandPaletteOpen(false); },
      })),
    ] : []),
    {
      id: 'toggle-theme',
      title: darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'High-contrast palette for study comfort',
      category: 'View',
      icon: darkMode ? '☀' : '☽',
      shortcut: 'D',
      action: () => { setDarkMode((d) => !d); setCommandPaletteOpen(false); },
    },
    {
      id: 'jump-today',
      title: 'Jump to Study Canvas & Today’s Tasks',
      subtitle: 'View today’s timeline, checkmarks, and notes',
      category: 'Navigation',
      icon: '◫',
      shortcut: 'C',
      action: () => {
        setCommandPaletteOpen(false);
        document.getElementById('study-canvas')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'log-offline',
      title: 'Log Offline Study Session',
      subtitle: 'Track self-study, reading, or library hours',
      category: 'Activity',
      icon: '✍️',
      shortcut: 'L',
      action: () => {
        setCommandPaletteOpen(false);
        setManualLogDate(todayKey);
        setLogModalOpen(true);
      },
    },
    {
      id: 'jump-timetable',
      title: 'Class Timetable',
      subtitle: 'Inspect and edit your weekly class hours',
      category: 'Navigation',
      icon: '▦',
      action: () => {
        setCommandPaletteOpen(false);
        document.getElementById('timetable')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'jump-calendar',
      title: 'Exam & Deadline Calendar',
      subtitle: 'Review upcoming tests and due dates',
      category: 'Navigation',
      icon: '▣',
      action: () => {
        setCommandPaletteOpen(false);
        document.getElementById('calendar')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'jump-analytics',
      title: 'Study Analytics & Streak Heatmap',
      subtitle: '16-week matrix and weekly target trends',
      category: 'Navigation',
      icon: '📈',
      action: () => {
        setCommandPaletteOpen(false);
        document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'new-plan',
      title: 'Create / Generate New Plan',
      subtitle: 'Set subjects, hours, and generate with AI',
      category: 'Planner',
      icon: '➕',
      shortcut: 'N',
      action: () => {
        setCommandPaletteOpen(false);
        document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('subjects')?.focus();
      },
    },
    {
      id: 'reschedule-missed',
      title: 'Auto-Reschedule Missed Tasks',
      subtitle: 'Fit unfinished past tasks into future free slots',
      category: 'Planner',
      icon: '🔄',
      action: () => {
        setCommandPaletteOpen(false);
        rescheduleMissedTasks();
      },
    },
    {
      id: 'export-backup',
      title: 'Export Full JSON Backup',
      subtitle: 'Save all your plans, timetable, logs, and progress',
      category: 'Data',
      icon: '💾',
      action: () => {
        setCommandPaletteOpen(false);
        exportBackup();
      },
    },
    {
      id: 'ai-assistant',
      title: 'Ask AI Study Assistant',
      subtitle: 'Ask questions about your subjects and get clear explanations',
      category: 'AI Tools',
      icon: '🤖',
      shortcut: 'A',
      action: () => { openAiTool('assistant'); setCommandPaletteOpen(false); },
    },
    {
      id: 'ai-quiz',
      title: 'AI Quiz Generator & Practice',
      subtitle: 'Generate multiple-choice or short-answer questions with instant grading',
      category: 'AI Tools',
      icon: '📝',
      shortcut: 'Q',
      action: () => { openAiTool('quiz'); setCommandPaletteOpen(false); },
    },
    {
      id: 'ai-notes',
      title: 'PDF & Notes Analyzer',
      subtitle: 'Upload notes or PDF to generate summaries and practice quizzes',
      category: 'AI Tools',
      icon: '📄',
      action: () => { openAiTool('notes'); setCommandPaletteOpen(false); },
    },
    {
      id: 'ai-weak',
      title: 'Weak Topic Detection & Remedy',
      subtitle: `Identify topics marked hard or failed in quizzes (${weakTopics.length} flagged)`,
      category: 'AI Tools',
      icon: '⚠️',
      shortcut: 'W',
      action: () => { openAiTool('weak'); setCommandPaletteOpen(false); },
    },
    {
      id: 'ai-readiness',
      title: 'Calculate Exam Readiness Score',
      subtitle: 'Data-driven readiness estimate from syllabus completion & quizzes',
      category: 'AI Tools',
      icon: '🎯',
      shortcut: 'R',
      action: () => { openAiTool('readiness'); setCommandPaletteOpen(false); },
    },
    {
      id: 'ai-explainer',
      title: 'Study Plan Explainer',
      subtitle: 'Understand why AI prioritized particular subjects and timings',
      category: 'AI Tools',
      icon: '💡',
      action: () => {
        setPlanExplainerOpen(true);
        if (!planExplanation) handleExplainPlan();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'voice-entry-cmd',
      title: 'Voice Task & Subject Entry',
      subtitle: 'Speak to add subjects or revision requests',
      category: 'AI Tools',
      icon: '🎤',
      shortcut: 'V',
      action: () => {
        toggleVoiceEntry('subjects');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'remove-plan',
      title: 'Remove Current Study Plan',
      subtitle: 'Clear the canvas and delete the active plan',
      category: 'Danger',
      icon: '🗑️',
      action: () => {
        setCommandPaletteOpen(false);
        removeCurrentPlan();
      },
    },
  ], [timerRunning, timerSeconds, ambientPlaying, ambientType, darkMode, todayKey, customTracks, activeTrackId, isTrackPlaying, plan, planExplanation, weakTopics.length, quizHistory.length]);

  const filteredCommands = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();
    if (!q) return commandList;
    return commandList.filter((cmd) =>
      cmd.title.toLowerCase().includes(q) ||
      cmd.subtitle.toLowerCase().includes(q) ||
      cmd.category.toLowerCase().includes(q)
    );
  }, [commandList, commandQuery]);

  const statusLabel = {
    checking: 'Checking local AI', connected: 'Local AI ready', offline: 'Local AI unavailable', 'missing-model': 'Model not installed',
  }[modelStatus];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="StudyMate home"><span className="brand-mark">S</span><span className="brand-name">study<span>mate</span><i>.</i></span></a>
        <div className="sidebar-caption">YOUR WORKSPACE</div>
        <nav className="nav-list" aria-label="Main navigation">
          <a className="nav-item active" href="#planner"><span className="nav-icon">✳</span><span>Plan a session</span></a>
          <a className="nav-item" href="#timetable"><span className="nav-icon">▦</span><span>Class timetable</span></a>
          <a className="nav-item" href="#calendar"><span className="nav-icon">▣</span><span>Exam calendar</span><span className="nav-count">{upcomingExams.length || ''}</span></a>
          <a className="nav-item" href="#study-canvas"><span className="nav-icon">◫</span><span>Study canvas</span></a>
          <a className="nav-item" href="#analytics"><span className="nav-icon">📈</span><span>Study analytics</span></a>
          <button
            type="button"
            className="nav-item nav-item-btn"
            onClick={() => {
              setFocusOpen(true);
              setSoundTab('library');
            }}
            title="Open Focus Audio & Local Music Library"
          >
            <span className="nav-icon">🎵</span>
            <span>Focus audio</span>
            {customTracks.length > 0 && <span className="nav-count">{customTracks.length}</span>}
          </button>
          <a className="nav-item" href="#history"><span className="nav-icon">◷</span><span>Saved plans</span><span className="nav-count">{savedPlans.length}</span></a>
          <a className="nav-item" href="#backup"><span className="nav-icon">⇧</span><span>Backup & restore</span></a>
          <a className="nav-item" href="#how-it-works"><span className="nav-icon">ⓘ</span><span>How it works</span></a>
        </nav>

        <div className="sidebar-caption">AI STUDY SUITE</div>
        <nav className="nav-list" aria-label="AI Features navigation">
          <button
            type="button"
            className="nav-item nav-item-btn nav-item-ai"
            onClick={() => openAiTool('assistant')}
            title="Ask questions about your subjects and get clear explanations"
          >
            <span className="nav-icon">🤖</span>
            <span>AI Assistant</span>
          </button>
          <button
            type="button"
            className="nav-item nav-item-btn nav-item-ai"
            onClick={() => openAiTool('quiz')}
            title="Create multiple-choice and short-answer questions"
          >
            <span className="nav-icon">📝</span>
            <span>AI Quiz Generator</span>
            {quizHistory.length > 0 && <span className="nav-count">{quizHistory.length}</span>}
          </button>
          <button
            type="button"
            className="nav-item nav-item-btn nav-item-ai"
            onClick={() => openAiTool('notes')}
            title="Upload notes and generate summaries and quizzes"
          >
            <span className="nav-icon">📄</span>
            <span>PDF Notes Analyzer</span>
          </button>
          <button
            type="button"
            className="nav-item nav-item-btn nav-item-ai"
            onClick={() => openAiTool('weak')}
            title="Identify topics you repeatedly mark as difficult or get wrong in quizzes"
          >
            <span className="nav-icon">⚠️</span>
            <span>Weak Topics</span>
            {weakTopics.length > 0 && <span className="nav-count warn">{weakTopics.length}</span>}
          </button>
          <button
            type="button"
            className="nav-item nav-item-btn nav-item-ai"
            onClick={() => openAiTool('readiness')}
            title="Estimate preparation based on syllabus completion and quiz performance"
          >
            <span className="nav-icon">🎯</span>
            <span>Exam Readiness</span>
          </button>
        </nav>

        <div className="sidebar-spacer" />
        <button className="theme-toggle" type="button" onClick={() => setDarkMode((d) => !d)} aria-label="Toggle dark mode">
          <span className="theme-toggle-icon">{darkMode ? '☀' : '☽'}</span>
          {darkMode ? 'Light mode' : 'Dark mode'}
        </button>
        <div className={`local-card status-${modelStatus}`}>
          <div className="local-card-title"><span className="status-orb" /><span>{statusLabel}</span></div>
          <strong className="local-model-name">{modelName}</strong>
          <p>{modelMessage}</p>
          <button className="text-button" type="button" onClick={checkConnection}>↻ Check connection</button>
        </div>
        <div className="privacy-sidebar"><span>⌑</span><p>Local-first by design.<br />No account or login needed.</p></div>
      </aside>

      <main className="main-content" id="top">
        <header className="topbar">
          <div className="breadcrumbs"><span>Your workspace</span><span className="breadcrumb-separator">/</span><strong>Study planner</strong></div>
          <div className="topbar-actions">
            <button
              className="topbar-ai-btn"
              type="button"
              onClick={() => openAiTool('assistant')}
              title="Open AI Study Assistant, Quizzes, Notes Analyzer & Readiness"
            >
              <span className="topbar-ai-spark">✨</span>
              <span>AI Study Hub</span>
            </button>
            <button
              className="command-palette-trigger"
              type="button"
              onClick={() => {
                setCommandPaletteOpen(true);
                setCommandQuery('');
                setCommandSelectedIndex(0);
              }}
              title="Open quick command palette (Ctrl + K or /)"
              aria-label="Open command palette"
            >
              <span className="search-glyph">🔍</span>
              <span className="command-trigger-text">Quick actions</span>
              <kbd className="command-kbd">Ctrl K</kbd>
            </button>
            <button className={`model-pill status-${modelStatus}`} type="button" onClick={checkConnection} title="Check local AI connection">
              <span className="status-orb" />
              <span>{statusLabel}</span>
              <span className="model-divider" />
              <span className="model-name">{modelName}</span>
              <span className="refresh-glyph">↻</span>
            </button>
          </div>
        </header>

        <section className="hero-section">
          <div className="hero-copy">
            <span className="eyebrow"><span className="eyebrow-spark">✦</span> YOUR PERSONAL STUDY SPACE</span>
            <h1>Make a plan.<br /><span>Make progress.</span></h1>
            <p>Turn your subjects, deadlines and goals into a visual study plan you can actually follow.</p>

            <div className="hero-quote-card" aria-label="Daily study inspiration">
              <div className="hero-quote-top">
                <div className="hero-quote-badge-group">
                  <span className="hero-quote-badge">
                    {quoteRotationMode === '12h'
                      ? (now.getHours() < 12 ? '🌅 MORNING FOCUS' : '🌙 EVENING FOCUS')
                      : '✦ DAILY INSPIRATION'}
                  </span>
                  <button
                    type="button"
                    className="hero-quote-cadence-toggle"
                    onClick={() => {
                      setQuoteRotationMode((m) => m === '12h' ? '24h' : '12h');
                      setQuoteManualOffset(0);
                    }}
                    title={`Click to switch quote change frequency (currently: rotates ${quoteRotationMode === '12h' ? 'every 12 hours' : 'daily every 24 hours'})`}
                    aria-label="Toggle quote change frequency between 12h and daily"
                  >
                    ⏱ {quoteRotationMode === '12h' ? 'Every 12h' : 'Daily'}
                  </button>
                </div>
                <button
                  type="button"
                  className="hero-quote-shuffle-btn"
                  onClick={nextQuote}
                  title="Show another inspirational quote"
                  aria-label="Show another inspirational quote"
                >
                  <span className="shuffle-icon">↻</span> New quote
                </button>
              </div>
              <blockquote className="hero-quote-text">&ldquo;{activeQuote.text}&rdquo;</blockquote>
              <cite className="hero-quote-author">— {activeQuote.author}</cite>
            </div>

            <div className="hero-points"><span><b>✓</b> Realistic sessions</span><span><b>✓</b> Built-in breaks</span><span><b>✓</b> Progress tracking</span></div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-circle circle-one" /><div className="hero-art-circle circle-two" />
            <div className="hero-art-note"><span className="art-note-tag">TODAY'S PLAN</span><strong>One thing<br />at a time.</strong><div className="art-note-task"><i>✓</i><span /><span /></div><div className="art-note-task muted"><i /><span /><span /></div><div className="art-note-progress"><span /></div><small>Small steps add up</small></div>
            <span className="floating-spark spark-a">✦</span><span className="floating-spark spark-b">✧</span><span className="floating-check">✓</span>
          </div>
        </section>

        <div className="today-strip" role="status"><span className="today-strip-icon">◷</span><div><span className="today-strip-kicker">TODAY ON YOUR DEVICE</span><strong>{now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong></div><span className="today-strip-local">Live local date</span></div>

        <section className="stats-grid" aria-label="Study planner overview">
          <article className="stat-card"><span className="stat-icon icon-lilac">▤</span><div><strong>{subjectCount}</strong><span>Subjects in focus</span></div></article>
          <article className="stat-card"><span className="stat-icon icon-peach">◷</span><div><strong>{estimatedHours}<small> hrs</small></strong><span>Time available in this plan</span></div></article>
          <article className="stat-card"><span className="stat-icon icon-mint">✓</span><div><strong>{progress}%</strong><span>Current plan progress</span></div></article>
          <article className={`stat-card ${studyStreak > 0 ? 'streak-card' : 'stat-local'}`}>
            <span className={`stat-icon ${studyStreak > 0 ? 'icon-streak' : 'icon-blue'}`}>{studyStreak > 0 ? '🔥' : '⌑'}</span>
            <div>
              {studyStreak > 0
                ? <><strong>{studyStreak}<small> day{studyStreak !== 1 ? 's' : ''}</small></strong><span>Study streak 🔥</span></>
                : <><strong>Private &amp; local</strong><span>Runs on your computer</span></>}
            </div>
          </article>
        </section>

        <section className="timetable-section" id="timetable" aria-labelledby="timetable-title">
          <div className="section-title-row timetable-title-row">
            <div>
              <span className="section-eyebrow">YOUR WEEK AT A GLANCE</span>
              <h2 id="timetable-title">Class timetable</h2>
              <p>Fill in your seven periods, subjects and timings. Changes save automatically in this browser.</p>
            </div>
            <div className="timetable-actions">
              <select
                className="secondary-button timetable-preset-select"
                onChange={(e) => {
                  if (e.target.value) {
                    applyTimetablePreset(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                aria-label="Apply standard timetable timings preset"
              >
                <option value="" disabled>Timing presets…</option>
                {TIMETABLE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <button className="secondary-button" type="button" onClick={exportTimetableCsv}>Export CSV ↓</button>
              <button className="quiet-button danger-quiet" type="button" onClick={clearTimetable}>Clear timetable ×</button>
            </div>
          </div>
          <div className="timetable-note"><span className="timetable-note-icon">✓</span><span><strong>Auto-saved locally.</strong> Color-coded by subject. Complete a subject and its start/end time to help the AI avoid scheduling personal study during that class.</span></div>
          <div className="timetable-scroll" role="region" aria-label="Editable weekly class timetable" tabIndex="0">
            <table className="weekly-timetable">
              <thead>
                <tr>
                  <th className="timetable-day-head" scope="col">Day</th>
                  {timetable.periods.map((period, periodIndex) => <th scope="col" key={period.id}>
                    <div className="period-column-heading">
                      <strong>P{period.id}</strong>
                      <span>{period.label}</span>
                      <button
                        type="button"
                        className="period-copy-btn"
                        onClick={() => copyPeriodToAllWeekdays(periodIndex)}
                        title={`Copy Monday's subject in Period ${period.id} to Tuesday–Friday`}
                      >
                        ↷ Mon→Fri
                      </button>
                    </div>
                    <div className="period-time-fields">
                      <label><span>Start</span><input type="time" value={period.start} onChange={(event) => updatePeriodTime(periodIndex, 'start', event.target.value)} aria-label={`${period.label} start time`} /></label>
                      <label><span>End</span><input type="time" value={period.end} onChange={(event) => updatePeriodTime(periodIndex, 'end', event.target.value)} aria-label={`${period.label} end time`} /></label>
                    </div>
                    {periodTimeWarnings[periodIndex] && <small className="period-time-error" role="status">{periodTimeWarnings[periodIndex]}</small>}
                  </th>)}
                </tr>
              </thead>
              <tbody>
                {timetable.days.map((day, dayIndex) => <tr key={day.id} className={day.id === currentWeekdayId ? 'today-row' : ''}>
                  <th className="timetable-day-cell" scope="row"><span>{day.label} {day.id === currentWeekdayId && <em className="today-tag">TODAY</em>}</span><small>{day.slots.filter((subject) => subject.trim()).length}/7 filled</small></th>
                  {timetable.periods.map((period, periodIndex) => {
                    const cellSubject = day.slots[periodIndex];
                    const subjectColor = getSubjectColor(cellSubject);
                    const hasSubject = Boolean(cellSubject.trim() && subjectColor);
                    return (
                      <td
                        key={`${day.id}-${period.id}`}
                        className={`timetable-slot-cell ${hasSubject ? 'has-subject' : ''}`}
                        style={hasSubject ? {
                          backgroundColor: darkMode ? subjectColor.bgDark : subjectColor.bgLight,
                          borderColor: darkMode ? subjectColor.borderDark : subjectColor.borderLight,
                        } : undefined}
                      >
                        <input
                          className="timetable-subject-input"
                          type="text"
                          maxLength="100"
                          list="timetable-subject-datalist"
                          style={hasSubject ? {
                            color: darkMode ? subjectColor.textDark : subjectColor.textLight,
                            backgroundColor: 'transparent',
                            borderColor: 'transparent',
                          } : undefined}
                          value={cellSubject}
                          onChange={(event) => updateTimetableSubject(dayIndex, periodIndex, event.target.value)}
                          placeholder="Subject / lab"
                          aria-label={`${day.label}, ${period.label} subject`}
                        />
                        {cellSubject.trim() && period.start && period.end && <span className="timetable-time-hint">{period.start}–{period.end}</span>}
                      </td>
                    );
                  })}
                </tr>)}
              </tbody>
            </table>
          </div>
          <datalist id="timetable-subject-datalist">
            {Array.from(new Set([
              ...subjectLibrary,
              ...subjects.split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
              'Mathematics', 'C++ Programming', 'Digital Fundamentals', 'Operating Systems',
              'Data Structures', 'Database Management', 'Computer Networks', 'Physics Lab'
            ])).map((subj) => (
              <option key={subj} value={subj} />
            ))}
          </datalist>
          <div className="timetable-footer"><span>7 periods × 7 days</span><span>Saved on this device · No login required</span></div>
        </section>

        <section className="calendar-section" id="calendar" aria-labelledby="calendar-title">
          <div className="section-title-row">
            <div><span className="section-eyebrow">DATES THAT MATTER</span><h2 id="calendar-title">Exam countdown & calendar</h2><p>Add exams and assignment deadlines. StudyMate uses upcoming entries when building your next plan.</p></div>
            <div className="calendar-today-label"><span className="status-orb status-orb-connected" />Today is {now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
          </div>
          <div className="calendar-layout">
            <div className="calendar-board">
              <div className="calendar-month-bar"><button type="button" className="calendar-nav-button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month">‹</button><h3>{calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h3><button type="button" className="calendar-nav-button" onClick={() => setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month">›</button><button type="button" className="calendar-today-button" onClick={() => { setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1)); setSelectedCalendarDate(todayKey); }}>Today</button></div>
              <div className="calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <span key={day}>{day}</span>)}</div>
              <div className="calendar-grid">
                {calendarCells.map((dateKey, index) => {
                  if (!dateKey) return <span className="calendar-day calendar-day-empty" key={`empty-${index}`} aria-hidden="true" />;
                  const date = parseLocalDate(dateKey);
                  const items = examsByDate[dateKey] || [];
                  const isToday = dateKey === todayKey;
                  const isSelected = dateKey === selectedCalendarDate;
                  return <button type="button" key={dateKey} className={`calendar-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${items.length ? 'has-event' : ''}`} onClick={() => setSelectedCalendarDate(dateKey)} aria-label={`${date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}${items.length ? `, ${items.length} event${items.length === 1 ? '' : 's'}` : ''}`} aria-pressed={isSelected}>
                    <span className="calendar-day-number">{date.getDate()}</span>{items.length > 0 && <span className="calendar-event-dots"><i />{items.length > 1 && <i />}</span>}
                    {items.length > 0 && <span className="calendar-event-preview">{items[0].title}</span>}
                  </button>;
                })}
              </div>
              <div className="calendar-legend"><span><i className="legend-today" /> Today</span><span><i className="legend-exam" /> Exam / deadline</span></div>
            </div>
            <aside className="exam-sidebar">
              <form className="exam-form-card" onSubmit={addExam}>
                <span className="section-eyebrow">ADD A DEADLINE</span><h3>New exam or assignment</h3>
                <label htmlFor="exam-title">Title</label><input id="exam-title" value={examTitle} onChange={(event) => setExamTitle(event.target.value)} maxLength="160" placeholder="e.g. Mathematics internal" required />
                <label htmlFor="exam-subject">Subject (optional)</label><input id="exam-subject" value={examSubject} onChange={(event) => setExamSubject(event.target.value)} maxLength="120" placeholder="e.g. Engineering Mathematics" />
                <label htmlFor="exam-date">Date</label><input id="exam-date" type="date" value={examDate} onChange={(event) => setExamDate(event.target.value)} required />
                <label htmlFor="exam-notes">Topics or notes (optional)</label><textarea id="exam-notes" value={examNotes} onChange={(event) => setExamNotes(event.target.value)} rows="2" maxLength="1000" placeholder="Unit 1, partial derivatives…" />
                <button className="generate-button exam-add-button" type="submit"><span>＋</span> Add to calendar</button>
              </form>
              <div className="upcoming-exams-card"><div className="upcoming-exams-heading"><div><span className="section-eyebrow">KEEP AN EYE ON</span><h3>Upcoming deadlines</h3></div><span className="history-count">{upcomingExams.length}</span></div>
                {upcomingExams.length ? <div className="upcoming-exams-list">{upcomingExams.slice(0, 6).map((exam) => {
                  const left = dayDifference(todayKey, exam.date);
                  return <article className="upcoming-exam-item" key={exam.id}><div className="exam-date-tile"><strong>{parseLocalDate(exam.date).getDate()}</strong><span>{parseLocalDate(exam.date).toLocaleDateString(undefined, { month: 'short' })}</span></div><div className="upcoming-exam-copy"><strong>{exam.title}</strong>{exam.subject && <span>{exam.subject}</span>}<small>{left === 0 ? 'Due today' : left === 1 ? 'Due tomorrow' : `In ${left} days`}</small></div><button type="button" className="delete-button" onClick={() => deleteExam(exam.id)} aria-label={`Delete ${exam.title}`}>×</button></article>;
                })}</div> : <div className="calendar-empty-state"><span>✦</span><strong>No upcoming deadlines yet</strong><p>Add an exam or assignment to see its countdown here.</p></div>}
              </div>
              <div className="selected-date-card"><span className="section-eyebrow">SELECTED DATE</span><h3>{parseLocalDate(selectedCalendarDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>{selectedDateExams.length ? selectedDateExams.map((exam) => <div className="selected-date-event" key={exam.id}><strong>{exam.title}</strong>{exam.subject && <span>{exam.subject}</span>}{exam.notes && <small>{exam.notes}</small>}</div>) : <p>No exam or deadline saved for this date.</p>}</div>
            </aside>
          </div>
          <p className="calendar-storage-note"><span>✓</span> Exams and deadlines save automatically in this browser and are included in your StudyMate backup.</p>
        </section>

        {showTemplates && <section className="template-section" aria-labelledby="template-heading">
          <div className="section-title-row"><div><span className="section-eyebrow">GET STARTED QUICKLY</span><h2 id="template-heading">Choose a starting point</h2><p>Pick a template, then make it yours before generating.</p></div><button className="quiet-button" type="button" onClick={() => setShowTemplates(false)}>Hide templates <span>⌃</span></button></div>
          <div className="template-grid">
            {templates.map((template) => <button className={`template-card template-${template.id}`} type="button" key={template.id} onClick={() => useTemplate(template)}><span className="template-icon">{template.icon}</span><span className="template-card-title">{template.title}</span><span className="template-card-description">{template.description}</span><span className="template-use">Use template <b>↗</b></span></button>)}
          </div>
        </section>}
        {!showTemplates && <button className="show-templates-button" type="button" onClick={() => setShowTemplates(true)}>＋ Show study templates</button>}

        <section className="workspace-grid" id="planner">
          <form className="builder-card" onSubmit={handleSubmit}>
            <div className="card-heading"><div className="card-heading-icon">✎</div><div><span className="section-eyebrow">MAKE IT PERSONAL</span><h2>Build your study plan</h2><p>Tell your local AI what you want to learn and how much time you have.</p></div></div>
            <div className="field-block">
              <div className="label-with-actions">
                <label htmlFor="subjects">What are you studying? <span className="required">*</span></label>
                <div className="input-action-pills">
                  <button
                    type="button"
                    className={`voice-entry-btn ${voiceListening && voiceTargetField === 'subjects' ? 'is-recording' : ''}`}
                    onClick={() => toggleVoiceEntry('subjects')}
                    title="Speak to dictate your subjects and topics"
                  >
                    <span className="voice-mic-icon">🎤</span>
                    <span>{voiceListening && voiceTargetField === 'subjects' ? 'Listening…' : 'Voice entry'}</span>
                  </button>
                  {weakTopics.length > 0 && (
                    <button
                      type="button"
                      className="inject-weak-btn"
                      onClick={() => {
                        const newSubj = weakTopics.slice(0, 3).join(', ');
                        setSubjects((prev) => (prev ? `${prev}, ${newSubj}` : newSubj));
                      }}
                      title={`Add top weak topics (${weakTopics.slice(0, 3).join(', ')}) to your study plan`}
                    >
                      ⚠️ Add {Math.min(3, weakTopics.length)} weak topic{weakTopics.length > 1 ? 's' : ''}
                    </button>
                  )}
                </div>
              </div>
              <textarea id="subjects" className="subject-input" rows="4" value={subjects} onChange={(event) => setSubjects(event.target.value)} placeholder="e.g. C++ arrays, engineering mathematics, digital fundamentals" required />
              {voiceListening && voiceTargetField === 'subjects' && (
                <div className="voice-live-banner">
                  <span className="pulse-dot" />
                  <span>Listening… {voiceTranscript || 'Speak your subjects and topics now'}</span>
                  <button type="button" onClick={() => toggleVoiceEntry('subjects')}>Done</button>
                </div>
              )}
              {voiceError && voiceTargetField === 'subjects' && <div className="voice-error-banner">⚠️ {voiceError}</div>}
              <p className="field-help">Use commas or new lines to separate subjects and topics.</p>
              <div className="subject-library" aria-label="My subject library">
                <div className="subject-library-label">
                  <span>MY SUBJECT LIBRARY</span>
                  <button type="button" className="subject-save-btn" onClick={saveCurrentSubjectsToLibrary}>＋ Save current subjects</button>
                </div>
                {subjectLibrary.length > 0 ? (
                  <div className="subject-chips">
                    {subjectLibrary.map((subject) => (
                      <span className="subject-chip" key={subject}>
                        <button type="button" onClick={() => applySubjectChip(subject)} title={`Add "${subject}" to your study plan`}>{subject}</button>
                        <button type="button" className="subject-chip-remove" onClick={() => removeSubjectFromLibrary(subject)} aria-label={`Remove ${subject} from library`}>×</button>
                      </span>
                    ))}
                  </div>
                ) : <p className="subject-library-empty">No saved subjects yet — click &ldquo;Save current subjects&rdquo; or add one below.</p>}
                <div className="subject-library-input-row">
                  <input
                    type="text" value={newSubjectInput} maxLength={100}
                    placeholder="e.g. Physics, History…"
                    onChange={(e) => setNewSubjectInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubjectToLibrary(newSubjectInput); setNewSubjectInput(''); } }}
                    aria-label="Add new subject to library"
                  />
                  <button type="button" onClick={() => { addSubjectToLibrary(newSubjectInput); setNewSubjectInput(''); }}>Add</button>
                </div>
              </div>
            </div>
            <div className="field-grid">
              <div className="field-block">
                <label htmlFor="hours">Study time each day</label>
                <div className="input-suffix-wrap">
                  <input id="hours" type="number" min="0.5" max="16" step="0.5" value={hours} onChange={(event) => setHours(event.target.value)} required />
                  <span>hours</span>
                </div>
                <div className="quick-chip-row" aria-label="Quick hours select">
                  {['1', '1.5', '2', '3', '4', '6'].map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`quick-chip ${hours === h ? 'active' : ''}`}
                      onClick={() => setHours(h)}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
              <div className="field-block">
                <label htmlFor="days">Plan length</label>
                <select id="days" value={days} onChange={(event) => setDays(event.target.value)}>
                  <option value="3">3 days</option>
                  <option value="5">5 days</option>
                  <option value="7">7 days</option>
                </select>
                <div className="quick-chip-row" aria-label="Quick days select">
                  {['3', '5', '7'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`quick-chip ${days === d ? 'active' : ''}`}
                      onClick={() => setDays(d)}
                    >
                      {d} days
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="field-block study-window-field">
              <div className="label-with-optional">
                <label htmlFor="study-start">Daily study time window</label>
                <span className="timing-badge">CUSTOMIZABLE</span>
              </div>
              <div className="study-time-window-inputs">
                <div className="time-subfield">
                  <span className="time-subfield-icon">🌅</span>
                  <div className="time-subfield-meta">
                    <label htmlFor="study-start">Earliest start</label>
                    <input
                      id="study-start"
                      type="time"
                      value={studyStartTime}
                      onChange={(e) => setStudyStartTime(e.target.value)}
                      aria-label="Earliest study start time"
                    />
                  </div>
                </div>
                <div className="time-window-separator">→</div>
                <div className="time-subfield">
                  <span className="time-subfield-icon">🌙</span>
                  <div className="time-subfield-meta">
                    <label htmlFor="study-end">Latest finish</label>
                    <input
                      id="study-end"
                      type="time"
                      value={studyEndTime}
                      onChange={(e) => setStudyEndTime(e.target.value)}
                      aria-label="Latest study finish time"
                    />
                  </div>
                </div>
              </div>

              <div className="timing-presets-row" aria-label="Schedule timing presets">
                <span className="presets-label">Quick presets:</span>
                <button
                  type="button"
                  className={`timing-preset-chip ${studyStartTime === '06:00' && studyEndTime === '14:00' ? 'active' : ''}`}
                  onClick={() => { setStudyStartTime('06:00'); setStudyEndTime('14:00'); }}
                >
                  🌅 Early bird (6 AM – 2 PM)
                </button>
                <button
                  type="button"
                  className={`timing-preset-chip ${studyStartTime === '09:00' && studyEndTime === '18:00' ? 'active' : ''}`}
                  onClick={() => { setStudyStartTime('09:00'); setStudyEndTime('18:00'); }}
                >
                  ☀️ Daytime (9 AM – 6 PM)
                </button>
                <button
                  type="button"
                  className={`timing-preset-chip ${studyStartTime === '17:00' && studyEndTime === '22:00' ? 'active' : ''}`}
                  onClick={() => { setStudyStartTime('17:00'); setStudyEndTime('22:00'); }}
                >
                  🌆 Evening (5 PM – 10 PM)
                </button>
                <button
                  type="button"
                  className={`timing-preset-chip ${studyStartTime === '20:00' && studyEndTime === '02:00' ? 'active' : ''}`}
                  onClick={() => { setStudyStartTime('20:00'); setStudyEndTime('02:00'); }}
                >
                  🌙 Night owl (8 PM – 2 AM)
                </button>
              </div>
              <p className="field-help">Your AI will balance study blocks and breaks within this time window.</p>
            </div>
            <div className="field-block"><label htmlFor="goal">What is your main goal?</label><input id="goal" type="text" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="e.g. Prepare for my internal exams" /></div>
            <div className="field-block"><div className="label-with-optional"><label htmlFor="deadlines">Exams, assignments or deadlines</label><span>OPTIONAL</span></div><textarea id="deadlines" rows="3" value={deadlines} onChange={(event) => setDeadlines(event.target.value)} placeholder={'Maths internal — 22 Oct — Unit 1\nC++ practice — Friday — arrays'} /><p className="field-help">Add dates when you know them. The planner won't invent dates for you.</p></div>
            {error && <div className="inline-error" role="alert"><b>Something needs attention</b><span>{error}</span><button type="button" onClick={checkConnection}>Check AI connection</button></div>}
            <button className="generate-button" type="submit" disabled={loading}><span className="generate-spark">✦</span>{loading ? 'Building your study canvas…' : 'Generate study plan'}<span className="button-arrow">→</span></button>
            <div className="local-run-note"><span className="privacy-dot" /><span>Powered by <strong>{modelName}</strong> through Ollama on your computer.</span></div>
          </form>

          <section className="canvas-card" id="study-canvas" aria-live="polite">
            <div className="canvas-topline">
              <div>
                <span className="section-eyebrow">YOUR VISUAL CANVAS</span>
                <h2>{plan ? (goal || 'Your study plan') : 'Your study plan will appear here'}</h2>
                <p>{plan ? `${planDayCount}-day plan · ${hours} hours a day · ${modelName}` : 'Your sessions, topics and milestones in one clear view.'}</p>
              </div>
              <div className="canvas-topline-right">
                {plan && (
                  <button
                    type="button"
                    className="canvas-remove-plan-btn"
                    onClick={removeCurrentPlan}
                    title="Remove this study plan from your canvas"
                    aria-label="Remove current study plan"
                  >
                    <span>✕</span> Remove plan
                  </button>
                )}
                <div className={`canvas-status status-${modelStatus}`}><span className="status-orb" />{statusLabel}</div>
              </div>
            </div>

            {loading ? <div className="loading-state"><div className="loading-orbit"><span /><span /><span /></div><span className="loading-label">LOCAL AI IS THINKING</span><h3>Organizing your next steps…</h3><p>Balancing study blocks, breaks, practice and revision. The first response can take a little while.</p><div className="loading-lines"><span /><span /><span /><span /></div></div>
            : plan ? <div className="plan-content">
              {scheduleNotice && <div className="schedule-notice" role="status"><span>✓</span><p>{scheduleNotice}</p><button type="button" onClick={() => setScheduleNotice('')} aria-label="Dismiss schedule message">×</button></div>}
              {missedTasks.length > 0 && <div className="missed-task-banner"><div className="missed-task-icon">↻</div><div className="missed-task-copy"><strong>{missedTasks.length} unfinished task{missedTasks.length === 1 ? '' : 's'} from past days</strong><p>Find new free study slots after classes and existing study sessions. Rescheduling uses your daily study limit and avoids saved class periods.</p></div><button type="button" className="reschedule-button" onClick={rescheduleMissedTasks}>Reschedule missed tasks <span>→</span></button></div>}
              <div className="plan-actionbar">
                <div className="saved-indicator"><span>✓</span><div><strong>Saved on this device</strong><small>History updates automatically</small></div></div>
                <div className="action-buttons">
                  <button type="button" className="action-button" onClick={copyPlan}><span>▣</span>{copied ? 'Copied!' : 'Copy'}</button>
                  <button type="button" className="action-button" onClick={downloadPlan}><span>↓</span>{downloaded ? 'Downloaded' : 'Export .txt'}</button>
                  <button type="button" className="action-button" onClick={exportPlanIcs} title="Export this study plan as an iCalendar (.ics) file to import into Google Calendar or Apple Calendar"><span>📅</span>Export .ics</button>
                  <button type="button" className="action-button" onClick={() => window.print()}><span>⎙</span>Print / PDF</button>
                  <button
                    type="button"
                    className="action-button action-ai-explain"
                    onClick={() => {
                      setPlanExplainerOpen(true);
                      if (!planExplanation) handleExplainPlan();
                    }}
                    title="Explain why AI prioritized particular subjects and schedule"
                  >
                    <span>💡</span>Explain plan
                  </button>
                  <button type="button" className="action-button action-focus" onClick={() => setFocusOpen(true)}><span>◉</span>Focus mode</button>
                  <button type="button" className="action-button action-danger" onClick={removeCurrentPlan} title="Remove this study plan from your canvas"><span>✕</span>Remove plan</button>
                </div>
              </div>

              <div className="progress-card">
                <div className="progress-heading">
                  <div>
                    <span className="progress-label">YOUR PROGRESS</span>
                    <strong>{completedCount}<span> / {trackableTasks.length} tasks completed</span></strong>
                  </div>
                  <strong className="progress-percent">{progress}%</strong>
                </div>
                <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} aria-label="Study plan completion">
                  <span style={{ width: `${progress}%` }} />
                </div>

                <div className="today-workload-row">
                  <div className="workload-info">
                    <span className="workload-icon">⏱️</span>
                    <div>
                      <strong>
                        {todayPlanDay
                          ? todayRemainingTasksCount === 0 && todayTotalTasks > 0
                            ? '🎉 All tasks for today are done!'
                            : `${Math.floor(todayRemainingMinutes / 60)}h ${todayRemainingMinutes % 60}m remaining today`
                          : `${Math.floor(planRemainingMinutes / 60)}h ${planRemainingMinutes % 60}m remaining in plan`}
                      </strong>
                      <small>
                        {todayPlanDay
                          ? `${todayTotalTasks - todayRemainingTasksCount} of ${todayTotalTasks} tasks finished today (${todayRemainingTasksCount} left)`
                          : `${completedCount} of ${trackableTasks.length} total tasks completed`}
                      </small>
                    </div>
                  </div>
                  {todayPlanDay && todayTotalTasks > 0 && (
                    <div className="workload-pill-badge">
                      <span>{todayTotalTasks - todayRemainingTasksCount}/{todayTotalTasks} today</span>
                    </div>
                  )}
                </div>

                <div className="progress-foot">
                  <span>{progress === 100 ? 'Great work — you completed this plan!' : progress > 0 ? 'Nice progress. Keep the next step small.' : 'Tick off a task when you finish it.'}</span>
                  <span>{hours}h/day · {days} days</span>
                  <button className="reset-progress-button" type="button" onClick={resetProgress} disabled={completedCount === 0}>Reset progress</button>
                </div>
              </div>

              <div className="canvas-controls"><div className="view-switch" role="group" aria-label="Plan view"><button type="button" className={viewMode === 'timeline' ? 'selected' : ''} onClick={() => setViewMode('timeline')}><span>↗</span> Timeline</button><button type="button" className={viewMode === 'compact' ? 'selected' : ''} onClick={() => setViewMode('compact')}><span>☷</span> Compact list</button></div><div className="task-search"><span>⌕</span><input aria-label="Search tasks" type="search" placeholder="Find a topic or task" value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} /></div></div>
              <div className="task-filter-row">
                <div className="filter-tabs" role="group" aria-label="Filter study tasks">
                  <button type="button" className={taskFilter === 'all' ? 'active' : ''} onClick={() => setTaskFilter('all')}>All tasks</button>
                  <button type="button" className={taskFilter === 'todo' ? 'active' : ''} onClick={() => setTaskFilter('todo')}>To do</button>
                  <button type="button" className={taskFilter === 'high' ? 'active' : ''} onClick={() => setTaskFilter('high')}>🔥 High priority</button>
                  <button type="button" className={taskFilter === 'completed' ? 'active' : ''} onClick={() => setTaskFilter('completed')}>Completed</button>
                </div>
                <span className="task-count-label">{trackableTasks.length} tasks · {parsedDays.length} days</span>
              </div>

              {parsedDays.length ? <div className={`day-list ${viewMode === 'compact' ? 'compact-view' : ''}`}>
                {planDaysWithDates.map((day, dayIndex) => {
                  const dayTasks = day.blocks.flatMap((block) => block.tasks).filter((task) => !task.isBreak);
                  const dayDone = dayTasks.filter((task) => currentCompletion[task.id]).length;
                  const visibleBlocks = day.blocks.map((block) => ({ ...block, visibleTasks: block.tasks.filter(taskIsVisible) })).filter((block) => block.visibleTasks.length > 0);
                  if (visibleBlocks.length === 0) return null;
                  return <article className={`day-card ${day.dateKey === todayKey ? 'is-today' : ''} ${day.dateKey < todayKey ? 'is-past' : ''}`} key={`${day.number}-${dayIndex}`}>
                    <div className="day-header"><div className="day-heading-left"><span className="day-number">{String(day.number).padStart(2, '0')}</span><div><span className="day-kicker">DAY {day.number} · {parseLocalDate(day.dateKey).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} {day.dateKey === todayKey ? '· TODAY' : day.dateKey < todayKey ? '· PAST' : ''}</span><h3>{day.title}</h3></div></div><div className="day-score"><strong>{dayDone}<span>/{dayTasks.length}</span></strong><small>complete</small></div><div className="day-mini-track"><span style={{ width: `${dayTasks.length ? (dayDone / dayTasks.length) * 100 : 0}%` }} /></div></div>
                    <div className="session-list">
                      {visibleBlocks.map((block, blockIndex) => {
                        const blockKey = `${day.number}-${block.id || blockIndex}`;
                        const isEditingTime = editingBlockKey === blockKey;

                        return (
                          <section className={`session-block ${isEditingTime ? 'is-editing-time' : ''}`} key={`${block.id}-${blockIndex}`}>
                            <div className="session-heading">
                              <span className="session-dot" />
                              <span className="session-time">{block.time}</span>
                              <button
                                type="button"
                                className={`session-time-edit-btn ${isEditingTime ? 'active' : ''}`}
                                onClick={() => isEditingTime ? setEditingBlockKey(null) : startEditingBlock(day.number, block)}
                                title={isEditingTime ? 'Close time editor' : 'Change time for this session'}
                                aria-label={`Change time for ${block.time}`}
                              >
                                {isEditingTime ? '✕ Close' : '✎ Change time'}
                              </button>
                              <span className="session-line" />
                            </div>

                            {isEditingTime && (
                              <div className="session-time-edit-form" role="region" aria-label="Edit session timing">
                                <div className="time-edit-main-row">
                                  <div className="time-edit-input-group">
                                    <label htmlFor={`edit-start-${blockKey}`}>Start time</label>
                                    <input
                                      id={`edit-start-${blockKey}`}
                                      type="time"
                                      value={editStartTime}
                                      onChange={(e) => setEditStartTime(e.target.value)}
                                      aria-label="Session start time"
                                    />
                                  </div>
                                  <span className="time-edit-arrow">→</span>
                                  <div className="time-edit-input-group">
                                    <label htmlFor={`edit-end-${blockKey}`}>Finish time</label>
                                    <input
                                      id={`edit-end-${blockKey}`}
                                      type="time"
                                      value={editEndTime}
                                      onChange={(e) => setEditEndTime(e.target.value)}
                                      aria-label="Session finish time"
                                    />
                                  </div>
                                  <div className="time-edit-input-group time-label-group">
                                    <label htmlFor={`edit-lbl-${blockKey}`}>Label (optional)</label>
                                    <input
                                      id={`edit-lbl-${blockKey}`}
                                      type="text"
                                      maxLength={60}
                                      placeholder="e.g. Morning Focus, Review"
                                      value={editBlockLabel}
                                      onChange={(e) => setEditBlockLabel(e.target.value)}
                                      aria-label="Session focus label"
                                    />
                                  </div>
                                </div>

                                <div className="time-edit-actions-row">
                                  <div className="time-shift-btns" aria-label="Quick time shifts">
                                    <span className="shift-label">Shift session:</span>
                                    <button type="button" onClick={() => shiftEditTime(-60)} title="Move 1 hour earlier">−1h</button>
                                    <button type="button" onClick={() => shiftEditTime(-30)} title="Move 30 minutes earlier">−30m</button>
                                    <button type="button" onClick={() => shiftEditTime(30)} title="Move 30 minutes later">+30m</button>
                                    <button type="button" onClick={() => shiftEditTime(60)} title="Move 1 hour later">+1h</button>
                                  </div>
                                  <div className="time-save-btns">
                                    <button
                                      type="button"
                                      className="time-save-btn"
                                      onClick={() => saveEditedBlockTime(day.number, block.id)}
                                    >
                                      ✓ Save time
                                    </button>
                                    <button
                                      type="button"
                                      className="time-cancel-btn"
                                      onClick={() => setEditingBlockKey(null)}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="session-tasks">
                              {block.visibleTasks.map((task) => task.isBreak ? (
                                <div className="break-row" key={task.id}>
                                  <span className="break-symbol">☕</span>
                                  <span className="break-title">{task.title || 'Short break'}</span>
                                  {task.duration && (
                                    <button
                                      type="button"
                                      className="duration-chip break-duration duration-chip-editable"
                                      onClick={() => cycleTaskDuration(task.id, task.duration)}
                                      title={`Click to change break duration (${task.duration})`}
                                    >
                                      ⏱ {task.duration}
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div className="task-row-wrapper" key={task.id}>
                                  <div className={`task-row ${currentCompletion[task.id] ? 'task-complete' : ''}`}>
                                    <label className="task-main-label">
                                      <input type="checkbox" checked={Boolean(currentCompletion[task.id])} onChange={() => toggleTask(task.id)} aria-label={`Mark ${task.title} ${currentCompletion[task.id] ? 'incomplete' : 'complete'}`} />
                                      <span className="custom-check"><span>✓</span></span>
                                      <span className="task-copy"><span className="task-title">{task.title}</span>{task.details.length > 0 && <span className="task-details">{task.details.join(' ')}</span>}</span>
                                    </label>
                                    <div className="task-right-meta">
                                      <button
                                        type="button"
                                        className={`task-priority-chip ${taskPriorities[task.id] ? `priority-${taskPriorities[task.id]}` : 'priority-none'}`}
                                        onClick={() => cycleTaskPriority(task.id)}
                                        title={`Priority: ${taskPriorities[task.id] || 'Normal'} (click to cycle: High / Med / Low / None)`}
                                        aria-label={`Task priority: ${taskPriorities[task.id] || 'Normal'}`}
                                      >
                                        {taskPriorities[task.id] === 'high' ? '🔴 High'
                                          : taskPriorities[task.id] === 'med' ? '🟡 Med'
                                          : taskPriorities[task.id] === 'low' ? '🟢 Low'
                                          : '＋Priority'}
                                      </button>
                                      <button
                                        type="button"
                                        className={`task-difficulty-chip difficulty-${difficultyRatings[task.id]?.rating || 0}`}
                                        onClick={() => cycleTaskDifficulty(task.id, task.title)}
                                        title={`Difficulty: ${['None', 'Easy', 'Medium', 'Hard'][difficultyRatings[task.id]?.rating || 0]} (click to cycle: Easy / Med / Hard / None)`}
                                        aria-label={`Difficulty: ${['None', 'Easy', 'Medium', 'Hard'][difficultyRatings[task.id]?.rating || 0]}`}
                                      >
                                        {difficultyRatings[task.id]?.rating === 3 ? '⚡ Hard'
                                          : difficultyRatings[task.id]?.rating === 2 ? '⚡ Med'
                                          : difficultyRatings[task.id]?.rating === 1 ? '⚡ Easy'
                                          : '＋Difficulty'}
                                      </button>
                                      {task.duration && (
                                        <button
                                          type="button"
                                          className="duration-chip duration-chip-editable"
                                          onClick={() => cycleTaskDuration(task.id, task.duration)}
                                          title={`Click to cycle duration: 15m, 25m, 30m, 45m, 60m, 90m (current: ${task.duration})`}
                                          aria-label={`Task duration: ${task.duration}. Click to cycle.`}
                                        >
                                          ⏱ {task.duration}
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        className={`task-note-toggle-btn ${taskNotes[task.id] ? 'has-note' : ''}`}
                                        onClick={() => setActiveNoteTaskId(activeNoteTaskId === task.id ? null : task.id)}
                                        title={taskNotes[task.id] ? 'View / edit task note' : 'Add task note'}
                                        aria-label={`Note for ${task.title}`}
                                      >
                                        {taskNotes[task.id] ? '🗒️ Note' : '＋Note'}
                                      </button>
                                      {!task.isBreak && !currentCompletion[task.id] && (
                                        <button
                                          type="button"
                                          className="task-postpone-btn"
                                          onClick={() => postponeTaskToTomorrow(task.id, day.number)}
                                          title={`Postpone “${task.title}” to tomorrow (Day ${day.number + 1})`}
                                          aria-label={`Postpone ${task.title} to tomorrow`}
                                        >
                                          → Tomorrow
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {taskNotes[task.id] && activeNoteTaskId !== task.id && (
                                    <div className="task-note-display" onClick={() => setActiveNoteTaskId(task.id)} title="Click to edit note">
                                      <span className="task-note-icon">✎</span>
                                      <span className="task-note-content">{taskNotes[task.id]}</span>
                                    </div>
                                  )}
                                  {activeNoteTaskId === task.id && (
                                    <div className="task-note-editor">
                                      <textarea
                                        autoFocus
                                        rows={2}
                                        value={taskNotes[task.id] || ''}
                                        onChange={(e) => updateTaskNote(task.id, e.target.value)}
                                        placeholder="Add quick notes, equations, study links, or thoughts…"
                                        maxLength={2000}
                                      />
                                      <div className="task-note-editor-footer">
                                        <small>{(taskNotes[task.id] || '').length}/2000 chars</small>
                                        <button type="button" className="task-note-save-btn" onClick={() => setActiveNoteTaskId(null)}>Done</button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </article>;
                })}
                {taskFilter !== 'all' && !allTasks.some(taskIsVisible) && <div className="filter-empty"><span>✓</span><strong>No tasks in this view</strong><p>Try another filter or change your search.</p></div>}
              </div> : <div className="format-fallback"><p>This response couldn't be organized into visual task cards yet. You can still copy or download it.</p><pre>{plan}</pre></div>}

              <form className="refine-card" onSubmit={handleRefine}>
                <div className="refine-icon">✧</div>
                <div className="refine-copy">
                  <div className="refine-title-row">
                    <div>
                      <span className="section-eyebrow">MAKE IT FIT BETTER</span>
                      <h3>Adjust this plan with AI</h3>
                    </div>
                    <button
                      type="button"
                      className={`voice-entry-btn ${voiceListening && voiceTargetField === 'refine' ? 'is-recording' : ''}`}
                      onClick={() => toggleVoiceEntry('refine')}
                      title="Speak your change request"
                    >
                      <span className="voice-mic-icon">🎤</span>
                      <span>{voiceListening && voiceTargetField === 'refine' ? 'Listening…' : 'Voice edit'}</span>
                    </button>
                  </div>
                  <p>Ask for a change. Your current plan stays in history.</p>
                  <div className="refine-chips">
                    <button type="button" onClick={() => setRefineRequest('Make the daily workload lighter and add more breaks.')}>Make it lighter</button>
                    <button type="button" onClick={() => setRefineRequest('Add more practice questions and active recall.')}>More practice</button>
                    <button type="button" onClick={() => setRefineRequest('Move more time toward my hardest subject and keep revision time.')}>Focus on hard topics</button>
                  </div>
                  <textarea value={refineRequest} onChange={(event) => setRefineRequest(event.target.value)} rows="2" placeholder="e.g. Move maths to the beginning and keep evenings lighter… (or speak using Voice edit)" />
                  {voiceListening && voiceTargetField === 'refine' && (
                    <div className="voice-live-banner">
                      <span className="pulse-dot" />
                      <span>Listening… {voiceTranscript || 'Speak your change request clearly'}</span>
                      <button type="button" onClick={() => toggleVoiceEntry('refine')}>Done</button>
                    </div>
                  )}
                  {voiceError && voiceTargetField === 'refine' && <div className="voice-error-banner">⚠️ {voiceError}</div>}
                </div>
                <button className="refine-submit" type="submit" disabled={refining || !refineRequest.trim()}>{refining ? <><span className="spinner" /> Updating…</> : <>Update plan <span>→</span></>}</button>
              </form>
              <p className="plan-footnote"><span>✦</span> AI suggestions are a starting point. Check the workload against your real timetable and deadlines.</p>
            </div> : <div className="empty-canvas"><div className="empty-visual"><div className="empty-node node-main"><span>✦</span><b>Your goal</b></div><div className="empty-connector connector-one" /><div className="empty-connector connector-two" /><div className="empty-node node-a"><span>01</span><b>Learn</b></div><div className="empty-node node-b"><span>02</span><b>Practice</b></div><div className="empty-node node-c"><span>03</span><b>Review</b></div></div><span className="empty-eyebrow">A PLAN THAT WORKS FOR YOU</span><h3>Your visual study canvas starts here.</h3><p>Generate a plan and see your days, study blocks, breaks and progress laid out clearly — then refine it as your week changes.</p><div className="empty-feature-grid"><span><b>1</b> Structured sessions</span><span><b>2</b> Clear next steps</span><span><b>3</b> Flexible revisions</span></div><div className="canvas-empty-model"><span className={`status-orb status-orb-${modelStatus}`} />{modelMessage}</div></div>}
          </section>
        </section>

        {/* Study Analytics & Streak Dashboard Section */}
        <section className="analytics-section" id="analytics" aria-labelledby="analytics-title">
          <div className="section-title-row">
            <div>
              <span className="section-eyebrow">STEADY HABITS &amp; INSIGHTS</span>
              <h2 id="analytics-title">Study analytics &amp; streak</h2>
              <p>Visual tracking of your study consistency, total hours, and subject distribution.</p>
            </div>
            <div className="analytics-actions">
              <button
                type="button"
                className="generate-button analytics-log-btn"
                onClick={() => {
                  setManualLogDate(todayKey);
                  setLogModalOpen(true);
                }}
              >
                <span>＋</span> Log offline study
              </button>
            </div>
          </div>

          {/* Hero Metrics Row */}
          <div className="analytics-hero-stats">
            <div className="analytics-stat-card streak-card">
              <div className="stat-card-badge streak-badge">🔥 ACTIVE STREAK</div>
              <div className="stat-card-main">
                <span className="stat-card-number">{analyticsData.currentStreak}</span>
                <span className="stat-card-unit">days</span>
              </div>
              <div className="stat-card-foot">
                {analyticsData.currentStreak > 0 ? 'Keep the momentum going today!' : 'Complete a task or log study to ignite your streak!'}
              </div>
            </div>

            <div className="analytics-stat-card best-streak-card">
              <div className="stat-card-badge best-badge">🏆 LONGEST RECORD</div>
              <div className="stat-card-main">
                <span className="stat-card-number">{analyticsData.longestStreak}</span>
                <span className="stat-card-unit">days</span>
              </div>
              <div className="stat-card-foot">Your personal best study run</div>
            </div>

            <div className="analytics-stat-card total-hours-card">
              <div className="stat-card-badge hours-badge">⏳ TOTAL STUDIED</div>
              <div className="stat-card-main">
                <span className="stat-card-number">{analyticsData.totalHours}</span>
                <span className="stat-card-unit">hrs</span>
              </div>
              <div className="stat-card-foot">{analyticsData.totalMinutes} total focused minutes</div>
            </div>

            <div className="analytics-stat-card sessions-card">
              <div className="stat-card-badge sessions-badge">🎯 SESSIONS DONE</div>
              <div className="stat-card-main">
                <span className="stat-card-number">{analyticsData.totalSessions}</span>
                <span className="stat-card-unit">sessions</span>
              </div>
              <div className="stat-card-foot">Completed plan tasks &amp; logs</div>
            </div>
          </div>

          {/* 16-Week Heatmap Matrix Card */}
          <div className="heatmap-card">
            <div className="heatmap-header">
              <div className="heatmap-title-group">
                <span className="heatmap-badge">16-WEEK ACTIVITY MATRIX</span>
                <h3>Study Activity Heatmap</h3>
                <p>112-day snapshot of daily study intensity across tasks, sessions, and offline practice.</p>
              </div>
              <div className="heatmap-legend" aria-label="Heatmap intensity legend">
                <span className="legend-label">Less</span>
                <span className="legend-cell level-0" title="0 mins" />
                <span className="legend-cell level-1" title="1–29 mins" />
                <span className="legend-cell level-2" title="30–59 mins" />
                <span className="legend-cell level-3" title="60–119 mins" />
                <span className="legend-cell level-4" title="120+ mins" />
                <span className="legend-label">More</span>
              </div>
            </div>

            <div className="heatmap-matrix-wrapper">
              {/* Month labels along the top */}
              <div className="heatmap-month-row">
                <div className="heatmap-row-header-spacer" />
                <div className="heatmap-month-labels">
                  {analyticsData.monthHeaders.map((m, idx) => (
                    <span
                      key={idx}
                      className="heatmap-month-label"
                      style={{ gridColumnStart: m.colIndex + 1 }}
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grid with Day-of-week labels on left and 16 week columns */}
              <div className="heatmap-body">
                <div className="heatmap-day-labels" aria-hidden="true">
                  <span>Mon</span>
                  <span></span>
                  <span>Wed</span>
                  <span></span>
                  <span>Fri</span>
                  <span></span>
                  <span>Sun</span>
                </div>

                <div className="heatmap-grid" role="grid" aria-label="16-week study activity">
                  {analyticsData.weeks.map((week, wIdx) => (
                    <div className="heatmap-column" key={wIdx} role="row">
                      {week.map((cell) => {
                        const tooltipText = cell.isFuture
                          ? `${cell.weekdayName}, ${cell.monthName} ${cell.dayNumber} · Upcoming`
                          : cell.minutes > 0
                          ? `${cell.weekdayName}, ${cell.monthName} ${cell.dayNumber} · ${cell.hours} hrs studied (${cell.minutes}m)${cell.items.length ? ` · ${[...new Set(cell.items.map((i) => i.title))].slice(0, 2).join(', ')}` : ''}`
                          : `${cell.weekdayName}, ${cell.monthName} ${cell.dayNumber} · No study recorded`;

                        return (
                          <div
                            key={cell.dateKey}
                            className={`heatmap-cell level-${cell.level} ${cell.isToday ? 'is-today' : ''} ${cell.isFuture ? 'is-future' : ''}`}
                            data-tooltip={tooltipText}
                            title={tooltipText}
                            role="gridcell"
                            tabIndex={0}
                            onClick={() => {
                              if (!cell.isFuture) {
                                setManualLogDate(cell.dateKey);
                                setLogModalOpen(true);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="heatmap-footer-note">
              <span>💡 Tip: Click any day cell on the heatmap to quickly log or view offline study for that date.</span>
            </div>
          </div>

          {/* Two-Column Insights Row: Weekly Bar Chart + Subject Breakdown */}
          <div className="analytics-insights-grid">
            {/* Weekly Hours Bar Chart */}
            <div className="analytics-card weekly-chart-card">
              <div className="card-top-row">
                <div>
                  <span className="card-badge">THIS WEEK</span>
                  <h3>Weekly Hours &amp; Targets</h3>
                  <p>Daily target: <strong>{analyticsData.dailyTargetHours} hrs/day</strong> ({analyticsData.dailyTargetMinutes}m)</p>
                </div>
                <div className="weekly-score-pill">
                  <strong>{analyticsData.daysOnTarget} / 7</strong> days met
                </div>
              </div>

              <div className="weekly-bars-container">
                {analyticsData.weeklyBars.map((bar) => {
                  const barHeightPct = analyticsData.maxWeekMins > 0
                    ? Math.max(bar.minutes > 0 ? 8 : 2, Math.min(100, Math.round((bar.minutes / analyticsData.maxWeekMins) * 100)))
                    : 2;
                  const targetLinePct = Math.round((analyticsData.dailyTargetMinutes / analyticsData.maxWeekMins) * 100);

                  return (
                    <div className={`weekly-bar-col ${bar.isToday ? 'is-today' : ''} ${bar.isTargetMet ? 'target-met' : ''}`} key={bar.dateKey}>
                      <div className="weekly-bar-value">{bar.minutes > 0 ? `${bar.hours}h` : '—'}</div>
                      <div className="weekly-bar-track">
                        <div
                          className="weekly-bar-fill"
                          style={{ height: `${barHeightPct}%` }}
                          title={`${bar.dayName}, ${bar.dateKey}: ${bar.hours} hrs (${bar.minutes}m)${bar.isTargetMet ? ' · Target met! 🎯' : ''}`}
                        />
                        <div
                          className="weekly-bar-target-line"
                          style={{ bottom: `${targetLinePct}%` }}
                          title={`Daily target: ${analyticsData.dailyTargetHours}h`}
                        />
                      </div>
                      <div className="weekly-bar-day">{bar.dayName}</div>
                      <div className="weekly-bar-date">{bar.dayNum}</div>
                    </div>
                  );
                })}
              </div>

              <div className="weekly-chart-footer">
                <span>Total this week: <strong>{analyticsData.weekTotalHours} hrs</strong></span>
                <span className="target-legend-indicator"><i /> Target: {analyticsData.dailyTargetHours}h</span>
              </div>
            </div>

            {/* Subject Distribution Breakdown */}
            <div className="analytics-card subject-chart-card">
              <div className="card-top-row">
                <div>
                  <span className="card-badge">DISTRIBUTION</span>
                  <h3>Study by Subject</h3>
                  <p>Where your study time is going across all sessions.</p>
                </div>
              </div>

              {analyticsData.subjectList.length === 0 ? (
                <div className="subject-empty-state">
                  <span className="subject-empty-icon">📚</span>
                  <strong>No subject study recorded yet</strong>
                  <p>Check off tasks in your study canvas or log an offline session to see your subject distribution here.</p>
                </div>
              ) : (
                <div className="subject-distribution-list">
                  {analyticsData.subjectList.slice(0, 6).map((item) => (
                    <div className="subject-dist-item" key={item.subject}>
                      <div className="subject-dist-header">
                        <span className="subject-dist-pill" style={{
                          background: item.color ? item.color.bgLight : '#efedff',
                          borderColor: item.color ? item.color.borderLight : '#c8c2f5',
                          color: item.color ? item.color.textLight : '#4d3fb5',
                        }}>
                          {item.subject}
                        </span>
                        <div className="subject-dist-stats">
                          <strong>{item.hours} hrs</strong>
                          <span className="subject-dist-pct">{item.pct}%</span>
                        </div>
                      </div>
                      <div className="subject-dist-bar-track">
                        <div
                          className="subject-dist-bar-fill"
                          style={{
                            width: `${item.pct}%`,
                            background: item.color
                              ? `linear-gradient(90deg, ${item.color.borderLight}, ${item.color.textLight})`
                              : 'linear-gradient(90deg, #8b7ef8, #5b4dd1)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Planned vs. Actual Study Time Comparison Card */}
          <div className="analytics-card planned-vs-actual-card">
            <div className="card-top-row">
              <div>
                <span className="card-badge">PLANNED VS ACTUAL</span>
                <h3>Planned vs. Actual Study Time</h3>
                <p>Track your schedule adherence: compare scheduled plan targets against your real logged study time.</p>
              </div>
              <span className={`adherence-badge ${analyticsData.adherenceStatus === 'Ahead of Schedule' ? 'ahead' : analyticsData.adherenceStatus === 'On Track' ? 'on-track' : 'behind'}`}>
                {analyticsData.adherenceStatus}
              </span>
            </div>

            <div className="planned-actual-summary-grid">
              <div className="planned-stat-box">
                <span className="box-label">PLANNED TARGET</span>
                <strong className="box-val">{analyticsData.plannedHours} <small>hrs</small></strong>
                <span className="box-sub">{analyticsData.plannedDays} days · {analyticsData.dailyPlannedHours}h/day goal</span>
              </div>
              <div className="actual-stat-box">
                <span className="box-label">ACTUAL STUDIED</span>
                <strong className="box-val">{analyticsData.totalHours} <small>hrs</small></strong>
                <span className="box-sub">{analyticsData.totalMinutes} focused minutes ({analyticsData.totalSessions} sessions)</span>
              </div>
              <div className="variance-stat-box">
                <span className="box-label">VARIANCE / DELTA</span>
                <strong className={`box-val ${Number(analyticsData.timeVarianceHours) >= 0 ? 'pos' : 'neg'}`}>
                  {Number(analyticsData.timeVarianceHours) >= 0 ? `+${analyticsData.timeVarianceHours}` : analyticsData.timeVarianceHours} <small>hrs</small>
                </strong>
                <span className="box-sub">{analyticsData.adherencePct}% of planned volume</span>
              </div>
            </div>

            <div className="planned-actual-bar-comparison">
              <div className="bar-row">
                <span className="bar-label">Planned Schedule</span>
                <div className="bar-track">
                  <div className="bar-fill planned-fill" style={{ width: '100%' }} />
                </div>
                <span className="bar-num">{analyticsData.plannedHours} hrs</span>
              </div>
              <div className="bar-row">
                <span className="bar-label">Actual Focused Time</span>
                <div className="bar-track">
                  <div
                    className={`bar-fill actual-fill ${analyticsData.adherencePct >= 85 ? 'good' : 'warning'}`}
                    style={{ width: `${Math.min(100, analyticsData.adherencePct)}%` }}
                  />
                </div>
                <span className="bar-num">{analyticsData.totalHours} hrs</span>
              </div>
            </div>

            {analyticsData.subjectList.length > 0 && (
              <div className="subject-planned-actual-table">
                <div className="table-header">
                  <span>Subject</span>
                  <span>Actual Studied</span>
                  <span>Share of Total</span>
                  <span>Status</span>
                </div>
                {analyticsData.subjectList.slice(0, 5).map((subj) => (
                  <div className="table-row" key={subj.subject}>
                    <span className="subj-name">{subj.subject}</span>
                    <span className="subj-time"><strong>{subj.hours}</strong> hrs</span>
                    <span className="subj-share">{subj.pct}%</span>
                    <span className="subj-status">
                      {subj.pct >= 25 ? '🔥 High Focus' : subj.pct >= 15 ? '✓ Balanced' : '🌱 Growing'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="history-section" id="history"><div className="section-title-row"><div><span className="section-eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Saved plans <span className="history-count">{savedPlans.length}</span></h2><p>Your latest 12 plans are stored in this browser. No account required.</p></div>{savedPlans.length > 0 && <button className="quiet-button danger-quiet" type="button" onClick={clearSavedPlans}>Clear history <span>×</span></button>}</div>
          {savedPlans.length === 0 ? <div className="history-empty"><span className="history-empty-icon">◷</span><div><strong>Your saved plans will appear here</strong><p>Generate a plan and it will be saved locally so you can return to it later.</p></div></div> : <div className="history-grid">{savedPlans.map((item) => <article className={`history-item ${currentPlanId === item.id ? 'history-item-active' : ''}`} key={item.id}><div className="history-item-top"><span className="history-item-icon">▤</span><span className="history-date">{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>{currentPlanId === item.id && <span className="active-plan-tag">Open</span>}</div><h3>{item.goal || `${item.days}-day study plan`}</h3><p className="history-subjects">{item.subjects}</p><div className="history-meta"><span>{item.days} days</span><span>·</span><span>{item.hours} hrs/day</span></div><div className="history-actions"><button className="secondary-button" type="button" onClick={() => openSavedPlan(item)}>Open plan ↗</button><button className="delete-button" type="button" onClick={() => deleteSavedPlan(item.id)} aria-label={`Delete plan ${item.goal || item.id}`}>Delete</button></div></article>)}</div>}
        </section>

        <section className="backup-section" id="backup" aria-labelledby="backup-title">
          <div className="backup-heading"><div><span className="section-eyebrow">KEEP YOUR WORK SAFE</span><h2 id="backup-title">Backup & restore</h2><p>Export your saved plans, task progress, weekly timetable, exams and current form values to one JSON file. Restore that file on this browser later.</p></div><div className="backup-icon">⇧</div></div>
          <div className="backup-actions"><button className="generate-button" type="button" onClick={exportBackup}>Download full backup <span>↓</span></button><button className="secondary-button" type="button" onClick={startRestoreBackup}>Restore from JSON <span>↗</span></button><input ref={restoreFileInput} type="file" accept=".json,application/json" onChange={restoreBackup} hidden /></div>
          {backupMessage && <p className="backup-message" role="status">{backupMessage}</p>}
          <div className="backup-includes"><span>✓ Saved plans</span><span>✓ Completed tasks</span><span>✓ Timetable</span><span>✓ Exams & deadlines</span><span>✓ Current form</span></div>
          <p className="backup-warning">Restoring replaces the data currently stored by StudyMate in this browser. Export a backup before restoring if you want to keep both versions.</p>
        </section>

        <section className="how-section" id="how-it-works"><div className="how-intro"><span className="section-eyebrow">A SIMPLE ROUTINE</span><h2>From study goal to steady progress.</h2><p>No account, no hosted AI service. Your plan is generated by the model on your own computer.</p></div><div className="how-steps"><article><span className="how-number">01</span><div><h3>Describe your goal</h3><p>Choose topics, set your study time and add upcoming deadlines.</p></div></article><article><span className="how-number">02</span><div><h3>Build your canvas</h3><p>Your local Llama model arranges focus sessions, breaks and review.</p></div></article><article><span className="how-number">03</span><div><h3>Track and adjust</h3><p>Tick off tasks, focus on the next step, or ask AI to rebalance your plan.</p></div></article></div></section>

        <footer className="page-footer"><span className="footer-brand">study<span>mate</span><i>.</i></span><span>Local prototype · No login page · Your plans stay in this browser.</span><span>Made for steady progress, not perfection.</span></footer>
      </main>

      {/* Pomodoro Focus Mode Modal */}
      {focusOpen && (
        <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setFocusOpen(false); }}>
          <section className="focus-modal pomodoro-modal" role="dialog" aria-modal="true" aria-labelledby="focus-title">
            <button className="modal-close" type="button" onClick={() => setFocusOpen(false)} aria-label="Close focus mode">×</button>
            <span className="focus-kicker">FOCUS MODE &amp; POMODORO TIMER</span>
            
            {/* Live Pomodoro Timer Box */}
            <div className="pomodoro-box">
              <div className="pomodoro-modes" role="group" aria-label="Timer modes">
                <button type="button" className={`pomo-mode-btn ${pomodoroMode === 'focus' ? 'active' : ''}`} onClick={() => switchTimerMode('focus')}>25m Focus</button>
                <button type="button" className={`pomo-mode-btn ${pomodoroMode === 'shortBreak' ? 'active' : ''}`} onClick={() => switchTimerMode('shortBreak')}>5m Break</button>
                <button type="button" className={`pomo-mode-btn ${pomodoroMode === 'longBreak' ? 'active' : ''}`} onClick={() => switchTimerMode('longBreak')}>15m Long Break</button>
                {currentFocusTask && (
                  <button type="button" className={`pomo-mode-btn ${pomodoroMode === 'task' ? 'active' : ''}`} onClick={() => switchTimerMode('task')}>
                    Task ({parseDurationMinutes(currentFocusTask)}m)
                  </button>
                )}
              </div>

              <div className="pomodoro-time-display">
                <span className="pomodoro-mode-indicator">{pomodoroMode === 'shortBreak' ? '☕ Short break' : pomodoroMode === 'longBreak' ? '☕ Long break' : '⚡ Deep focus session'}</span>
                <div className="pomodoro-digits">{formatTime(timerSeconds)}</div>
                <div className="pomodoro-bar-track">
                  <span style={{ width: `${Math.max(0, Math.min(100, ((timerTotal - timerSeconds) / timerTotal) * 100))}%` }} />
                </div>
              </div>

              <div className="pomodoro-ctrl-row">
                <button
                  type="button"
                  className={`pomodoro-play-btn ${timerRunning ? 'is-running' : ''}`}
                  onClick={() => setTimerRunning(!timerRunning)}
                >
                  {timerRunning ? '⏸ Pause timer' : '▶ Start focus timer'}
                </button>
                <button type="button" className="pomodoro-reset-btn" onClick={resetTimer} title="Reset timer to beginning">
                  ↺ Reset
                </button>
              </div>

              <div className="pomodoro-preferences">
                <label className="pomodoro-check-pref">
                  <input type="checkbox" checked={autoCompleteOnTimer} onChange={(e) => setAutoCompleteOnTimer(e.target.checked)} />
                  <span>Auto-complete task when focus timer ends</span>
                </label>
                {!notificationsAllowed ? (
                  <button type="button" className="pomodoro-notify-toggle" onClick={requestNotificationAccess}>
                    🔔 Enable chime &amp; notification
                  </button>
                ) : (
                  <span className="pomodoro-notify-status">🔔 Notifications active</span>
                )}
              </div>

              {/* Focus Sound & Music Library Card */}
              <div className="focus-sound-card">
                <div className="focus-sound-tabs-header">
                  <div className="focus-sound-tabs" role="tablist" aria-label="Sound modes">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={soundTab === 'ambient'}
                      className={`focus-sound-tab ${soundTab === 'ambient' ? 'active' : ''}`}
                      onClick={() => setSoundTab('ambient')}
                    >
                      <span className="tab-icon">🌿</span> Atmospheres
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={soundTab === 'library'}
                      className={`focus-sound-tab ${soundTab === 'library' ? 'active' : ''}`}
                      onClick={() => setSoundTab('library')}
                    >
                      <span className="tab-icon">🎵</span> My Sound Library
                      {customTracks.length > 0 && <span className="tab-count-badge">{customTracks.length}</span>}
                    </button>
                  </div>

                  {/* Master volume slider */}
                  <div className="sound-master-volume" title="Adjust focus sound volume">
                    <span className="vol-icon">{ambientVolume < 0.3 ? '🔈' : ambientVolume < 0.7 ? '🔉' : '🔊'}</span>
                    <input
                      type="range"
                      min="0.05"
                      max="1"
                      step="0.05"
                      value={ambientVolume}
                      onChange={(e) => updateAmbientVolume(Number(e.target.value))}
                      aria-label="Sound volume"
                    />
                    <span className="vol-number">{Math.round(ambientVolume * 100)}%</span>
                  </div>
                </div>

                {/* TAB 1: Atmospheres (Procedural ambient audio) */}
                {soundTab === 'ambient' && (
                  <div className="sound-tab-content ambient-tab-view" role="tabpanel">
                    <div className="ambient-presets-grid">
                      {[
                        { id: 'rain', label: 'Gentle Rain', icon: '🌧️', desc: 'Soft pink noise pitter-patter' },
                        { id: 'ocean', label: 'Ocean Waves', icon: '🌊', desc: 'Rhythmic rolling surf' },
                        { id: 'binaural', label: 'Alpha Waves', icon: '🧘', desc: '10 Hz binaural beats for deep focus' },
                        { id: 'whitenoise', label: 'White Noise', icon: '💨', desc: 'Broadband speech masking' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={`ambient-card-btn ${ambientType === item.id ? 'selected' : ''} ${ambientPlaying && ambientType === item.id ? 'is-playing' : ''}`}
                          onClick={() => {
                            if (ambientType === item.id && ambientPlaying) {
                              toggleAmbientSound();
                            } else {
                              switchAmbientType(item.id);
                              if (!ambientPlaying) toggleAmbientSound();
                            }
                          }}
                        >
                          <span className="ambient-card-icon">{item.icon}</span>
                          <div className="ambient-card-info">
                            <strong className="ambient-card-label">{item.label}</strong>
                            <small className="ambient-card-desc">{item.desc}</small>
                          </div>
                          <span className="ambient-card-state">
                            {ambientPlaying && ambientType === item.id ? (
                              <span className="audio-wave-anim">
                                <i /><i /><i />
                              </span>
                            ) : ambientType === item.id ? 'Selected' : 'Play'}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="ambient-footer-ctrls">
                      <button
                        type="button"
                        className={`ambient-main-play-btn ${ambientPlaying ? 'is-playing' : ''}`}
                        onClick={toggleAmbientSound}
                      >
                        {ambientPlaying ? '⏸ Stop Ambient Sound' : `▶ Play ${ambientType === 'rain' ? 'Rain' : ambientType === 'ocean' ? 'Ocean Waves' : ambientType === 'binaural' ? 'Alpha Waves' : 'White Noise'}`}
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2: My Local Sound Library (IndexedDB Custom Audio Tracks & Songs) */}
                {soundTab === 'library' && (
                  <div className="sound-tab-content library-tab-view" role="tabpanel">
                    <div className="library-toolbar">
                      <div className="library-toolbar-text">
                        <span className="library-caption">LOCAL STORAGE AUDIO</span>
                        <p className="library-help">Add your own lofi beats, ambient audio, or study songs. Stored safely on your computer.</p>
                      </div>
                      <button
                        type="button"
                        className="add-sound-btn"
                        onClick={() => audioFileInputRef.current?.click()}
                        disabled={audioUploadLoading}
                      >
                        <span>＋</span> Add audio file
                      </button>
                      <input
                        ref={audioFileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac"
                        multiple
                        onChange={handleAudioFilesSelected}
                        hidden
                      />
                    </div>

                    {audioStatusMessage && (
                      <div className="audio-status-banner" role="status">
                        <span>ℹ️</span> {audioStatusMessage}
                      </div>
                    )}

                    {/* Active Track Player Bar */}
                    {activeTrackId && (
                      <div className="now-playing-bar">
                        <div className="now-playing-top">
                          <div className="now-playing-info">
                            <span className="now-playing-disc">{isTrackPlaying ? '💿' : '⏸'}</span>
                            <div className="now-playing-names">
                              <strong className="now-playing-title">{customTracks.find((t) => t.id === activeTrackId)?.name || 'Custom Track'}</strong>
                              <span className="now-playing-times">
                                {formatTrackTime(trackProgress)} / {formatTrackTime(trackDuration)}
                              </span>
                            </div>
                          </div>
                          <div className="now-playing-actions">
                            <button
                              type="button"
                              className={`track-play-toggle-btn ${isTrackPlaying ? 'is-playing' : ''}`}
                              onClick={() => {
                                if (isTrackPlaying) pauseCustomTrack();
                                else resumeCustomTrack();
                              }}
                              title={isTrackPlaying ? 'Pause track' : 'Play track'}
                            >
                              {isTrackPlaying ? '⏸ Pause' : '▶ Play'}
                            </button>
                            <button
                              type="button"
                              className={`track-loop-btn ${isLoopTrack ? 'is-looping' : ''}`}
                              onClick={toggleLoopTrack}
                              title={isLoopTrack ? 'Loop: ON (Repeat track indefinitely)' : 'Loop: OFF'}
                            >
                              🔁 {isLoopTrack ? 'Loop On' : 'Loop Off'}
                            </button>
                          </div>
                        </div>

                        <div className="now-playing-scrub-row">
                          <input
                            type="range"
                            min="0"
                            max={trackDuration || 100}
                            step="0.5"
                            value={trackProgress}
                            onChange={(e) => seekTrack(Number(e.target.value))}
                            aria-label="Seek track position"
                            className="now-playing-slider"
                          />
                        </div>
                      </div>
                    )}

                    {/* Custom Tracks List */}
                    {customTracks.length === 0 ? (
                      <div className="library-empty-state">
                        <span className="empty-icon">🎵</span>
                        <strong>Your focus sound library is empty</strong>
                        <p>Import your favorite study music, lofi tracks, instrumental songs or rain sounds from your computer (.mp3, .wav, .m4a). They will be stored permanently on your machine.</p>
                        <button
                          type="button"
                          className="generate-button empty-add-btn"
                          onClick={() => audioFileInputRef.current?.click()}
                        >
                          ＋ Add first track (.mp3 / .wav)
                        </button>
                      </div>
                    ) : (
                      <div className="custom-tracks-list">
                        {customTracks.map((track) => {
                          const isThisPlaying = activeTrackId === track.id && isTrackPlaying;
                          return (
                            <div
                              key={track.id}
                              className={`custom-track-row ${activeTrackId === track.id ? 'is-active-row' : ''} ${isThisPlaying ? 'is-playing-row' : ''}`}
                            >
                              <button
                                type="button"
                                className={`track-row-play-btn ${isThisPlaying ? 'is-playing' : ''}`}
                                onClick={() => playCustomTrack(track)}
                                title={isThisPlaying ? 'Pause this track' : `Play “${track.name}”`}
                                aria-label={isThisPlaying ? `Pause ${track.name}` : `Play ${track.name}`}
                              >
                                {isThisPlaying ? '❚❚' : '▶'}
                              </button>
                              <div className="track-row-details" onClick={() => playCustomTrack(track)}>
                                <div className="track-title-row">
                                  <strong className="track-row-title">{track.name}</strong>
                                  {isThisPlaying && (
                                    <span className="audio-wave-anim mini">
                                      <i /><i /><i />
                                    </span>
                                  )}
                                </div>
                                <div className="track-row-meta">
                                  {track.duration > 0 && <span>{formatTrackTime(track.duration)}</span>}
                                  {track.duration > 0 && <span>·</span>}
                                  <span>{formatFileSize(track.fileSize)}</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                className="track-row-delete-btn"
                                onClick={() => handleDeleteCustomTrack(track.id, track.name)}
                                title={`Delete “${track.name}” from local library`}
                                aria-label={`Delete ${track.name}`}
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="focus-section-divider" />

            <h2 id="focus-title">One thing at a time.</h2>
            {currentFocusTask ? (
              <>
                <p className="focus-subtitle">Your active task</p>
                <div className="focus-task-card">
                  <div className="focus-task-meta">
                    <span>DAY {currentFocusTask.dayNumber}</span>
                    <span>{currentFocusTask.blockTime}</span>
                    {currentFocusTask.duration && <span>{currentFocusTask.duration}</span>}
                    {taskPriorities[currentFocusTask.id] && (
                      <span className={`focus-priority-pill priority-${taskPriorities[currentFocusTask.id]}`}>
                        {taskPriorities[currentFocusTask.id] === 'high' ? '🔴 High priority' : taskPriorities[currentFocusTask.id] === 'med' ? '🟡 Medium priority' : '🟢 Low priority'}
                      </span>
                    )}
                  </div>
                  <h3>{currentFocusTask.title}</h3>
                  {currentFocusTask.details.length > 0 && <p>{currentFocusTask.details.join(' ')}</p>}

                  {/* Task Notes inside focus card */}
                  <div className="focus-task-notes-box">
                    <label htmlFor="focus-modal-note">Task Notes</label>
                    <textarea
                      id="focus-modal-note"
                      rows={2}
                      placeholder="Jot down formulas, ideas, links or reflections for this task…"
                      value={taskNotes[currentFocusTask.id] || ''}
                      onChange={(e) => updateTaskNote(currentFocusTask.id, e.target.value)}
                    />
                  </div>
                </div>
                <button className="generate-button focus-complete-button" type="button" onClick={() => toggleTask(currentFocusTask.id)}>
                  Mark complete <span>✓</span>
                </button>
                <p className="focus-progress-note">{completedCount} of {trackableTasks.length} tasks completed · {progress}% done</p>
              </>
            ) : (
              <div className="focus-all-done">
                <span>✓</span>
                <h3>You&apos;re all caught up.</h3>
                <p>Every task in this plan is marked complete. Great work!</p>
              </div>
            )}
            <button className="quiet-button focus-close-button" type="button" onClick={() => setFocusOpen(false)}>Back to study canvas</button>
          </section>
        </div>
      )}

      {/* Offline Study Log Modal */}
      {logModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setLogModalOpen(false); }}>
          <section className="focus-modal log-study-modal" role="dialog" aria-modal="true" aria-labelledby="log-study-title">
            <button className="modal-close" type="button" onClick={() => setLogModalOpen(false)} aria-label="Close offline study modal">×</button>
            <span className="focus-kicker">MANUAL ACTIVITY TRACKER</span>
            <h2 id="log-study-title">Log Offline Study Session</h2>
            <p className="log-study-subtitle">Record self-study, textbook reading, assignment work, or library sessions.</p>

            <form className="log-study-form" onSubmit={handleManualLogSubmit}>
              <div className="log-field-row">
                <div className="log-field-group">
                  <label htmlFor="log-date">Study Date</label>
                  <input
                    id="log-date"
                    type="date"
                    required
                    value={manualLogDate}
                    max={todayKey}
                    onChange={(e) => setManualLogDate(e.target.value)}
                  />
                </div>

                <div className="log-field-group">
                  <label htmlFor="log-duration">Duration (minutes)</label>
                  <div className="log-duration-input-wrapper">
                    <input
                      id="log-duration"
                      type="number"
                      min="5"
                      max="720"
                      step="5"
                      required
                      value={manualLogMinutes}
                      onChange={(e) => setManualLogMinutes(e.target.value)}
                    />
                    <span className="log-duration-unit">mins ({Math.round((Number(manualLogMinutes) || 0) / 6) / 10}h)</span>
                  </div>
                </div>
              </div>

              {/* Quick duration presets */}
              <div className="log-presets-row" aria-label="Duration shortcuts">
                <span className="log-preset-label">Quick select:</span>
                {['15', '25', '30', '45', '60', '90', '120'].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`log-preset-btn ${manualLogMinutes === mins ? 'active' : ''}`}
                    onClick={() => setManualLogMinutes(mins)}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="log-field-group">
                <label htmlFor="log-subject">Subject or Topic</label>
                <input
                  id="log-subject"
                  type="text"
                  placeholder="e.g. C++ Programming, Mathematics, Digital Logic…"
                  value={manualLogSubject}
                  maxLength={100}
                  onChange={(e) => setManualLogSubject(e.target.value)}
                />
              </div>

              {/* Quick subject suggestion chips */}
              {subjectLibrary.length > 0 && (
                <div className="log-subject-chips">
                  <span className="log-preset-label">From your library:</span>
                  {subjectLibrary.slice(0, 6).map((subj) => (
                    <button
                      key={subj}
                      type="button"
                      className={`log-subj-chip ${manualLogSubject === subj ? 'active' : ''}`}
                      onClick={() => setManualLogSubject(subj)}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              )}

              <div className="log-field-group">
                <label htmlFor="log-notes">Session Notes (optional)</label>
                <textarea
                  id="log-notes"
                  rows={2}
                  maxLength={500}
                  placeholder="Topics covered, problem sets solved, or reflections…"
                  value={manualLogNotes}
                  onChange={(e) => setManualLogNotes(e.target.value)}
                />
              </div>

              <div className="log-modal-actions">
                <button className="generate-button" type="submit">
                  ✓ Save Study Entry
                </button>
                <button className="quiet-button" type="button" onClick={() => setLogModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>

            {/* Recent Manual Study Logs List */}
            {studyLogs.length > 0 && (
              <div className="recent-logs-section">
                <div className="recent-logs-title-row">
                  <h4>Recent Offline Logs ({studyLogs.length})</h4>
                </div>
                <div className="recent-logs-list">
                  {studyLogs.slice(0, 5).map((log) => (
                    <div className="recent-log-item" key={log.id}>
                      <div className="recent-log-info">
                        <span className="recent-log-date">{log.date}</span>
                        <strong className="recent-log-subject">{log.subject}</strong>
                        <span className="recent-log-mins">{log.minutes} mins</span>
                        {log.notes && <span className="recent-log-notes">“{log.notes}”</span>}
                      </div>
                      <button
                        type="button"
                        className="delete-button log-delete-btn"
                        onClick={() => deleteStudyLog(log.id)}
                        title="Delete this study entry"
                        aria-label={`Delete ${log.subject} entry on ${log.date}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Floating Pomodoro Widget when modal is closed */}
      {!focusOpen && (timerRunning || timerSeconds < timerTotal || ambientPlaying || isTrackPlaying) && (
        <div className={`floating-pomodoro-pill ${timerRunning ? 'is-running' : 'is-paused'}`} onClick={() => setFocusOpen(true)} title="Click to open Focus Mode">
          <span className="floating-pomo-dot" />
          <span className="floating-pomo-icon">{pomodoroMode.includes('Break') ? '☕' : '⏱️'}</span>
          <span className="floating-pomo-digits">{formatTime(timerSeconds)}</span>
          <span className="floating-pomo-mode">
            {isTrackPlaying
              ? `🎵 ${customTracks.find((t) => t.id === activeTrackId)?.name || 'Music'}`
              : ambientPlaying
              ? `🎧 ${ambientType}`
              : pomodoroMode === 'shortBreak'
              ? 'Break'
              : pomodoroMode === 'longBreak'
              ? 'Long Break'
              : 'Focus'}
          </span>
          <button
            type="button"
            className="floating-pomo-play-btn"
            onClick={(e) => {
              e.stopPropagation();
              setTimerRunning(!timerRunning);
            }}
            aria-label={timerRunning ? 'Pause timer' : 'Start timer'}
          >
            {timerRunning ? '❚❚' : '▶'}
          </button>
          <button
            type="button"
            className={`floating-ambient-btn ${ambientPlaying || isTrackPlaying ? 'is-active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (isTrackPlaying) {
                pauseCustomTrack();
              } else if (ambientPlaying) {
                toggleAmbientSound();
              } else if (activeTrackId) {
                resumeCustomTrack();
              } else {
                toggleAmbientSound();
              }
            }}
            title={ambientPlaying || isTrackPlaying ? 'Pause sound' : 'Play sound'}
            aria-label={ambientPlaying || isTrackPlaying ? 'Pause sound' : 'Play sound'}
          >
            {ambientPlaying || isTrackPlaying ? '🎧❚❚' : '🎧'}
          </button>
          <button
            type="button"
            className="floating-pomo-expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              setFocusOpen(true);
            }}
            title="Expand to Focus Mode"
            aria-label="Expand to Focus Mode"
          >
            ↗
          </button>
        </div>
      )}

      {/* Confetti celebration canvas */}
      <canvas id="confetti-canvas" className="confetti-canvas" aria-hidden="true" />

      {/* ── Study Plan Explainer Modal ── */}
      {planExplainerOpen && (
        <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setPlanExplainerOpen(false); }}>
          <section className="focus-modal ai-tool-modal plan-explainer-modal" role="dialog" aria-modal="true" aria-labelledby="explainer-title">
            <button className="modal-close" type="button" onClick={() => setPlanExplainerOpen(false)} aria-label="Close plan explainer">×</button>
            <div className="ai-modal-header">
              <span className="focus-kicker">AI PEDAGOGICAL REASONING</span>
              <h2 id="explainer-title">Why this study plan?</h2>
              <p className="ai-modal-subtitle">Understand the learning science, subject prioritization, and schedule pacing behind your plan.</p>
            </div>

            <div className="explainer-body">
              {planExplainerLoading ? (
                <div className="ai-loading-state">
                  <div className="loading-orbit"><span /><span /><span /></div>
                  <span className="loading-label">AI IS ANALYZING YOUR SCHEDULE</span>
                  <h3>Explaining schedule decisions…</h3>
                  <p>Synthesizing task sequencing, break intervals, and subject allocation.</p>
                </div>
              ) : planExplainerError ? (
                <div className="ai-error-box">
                  <p>⚠️ {planExplainerError}</p>
                  <button type="button" className="secondary-button" onClick={handleExplainPlan}>Try again</button>
                </div>
              ) : planExplanation ? (
                <div className="explainer-content">
                  <div className="explainer-card-group">
                    {planExplanation.split(/\n\s*\n/).map((para, pIdx) => {
                      if (!para.trim()) return null;
                      const isHeader = /^(?:#|\d+\.|\bWHY\b|\bHOW\b|\bWHAT\b)/i.test(para.trim());
                      return (
                        <div key={pIdx} className={`explainer-para-card ${isHeader ? 'is-heading-card' : ''}`}>
                          <p>{para.trim()}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="explainer-actions">
                    <button type="button" className="secondary-button" onClick={handleExplainPlan}>↻ Re-analyze plan</button>
                    <button type="button" className="generate-button" onClick={() => { setPlanExplainerOpen(false); openAiTool('assistant'); }}>
                      🤖 Ask Assistant follow-up
                    </button>
                  </div>
                </div>
              ) : (
                <div className="explainer-empty">
                  <span className="explainer-icon">💡</span>
                  <h3>No explanation generated yet</h3>
                  <p>Click below to have the local AI explain why it prioritized your subjects, hours, and sessions.</p>
                  <button type="button" className="generate-button" onClick={handleExplainPlan}>Explain my study plan</button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── AI Study Hub Modal (All 5 Features in Unified Suite) ── */}
      {aiModalOpen && (
        <div className="modal-backdrop" role="presentation" onClick={(e) => { if (e.target === e.currentTarget) setAiModalOpen(false); }}>
          <section className="focus-modal ai-tool-modal ai-hub-modal" role="dialog" aria-modal="true" aria-labelledby="ai-hub-title">
            <button className="modal-close" type="button" onClick={() => setAiModalOpen(false)} aria-label="Close AI Study Hub">×</button>

            {/* AI Hub Header */}
            <div className="ai-hub-top-header">
              <div className="ai-hub-branding">
                <span className="focus-kicker">INTELLIGENT STUDY SUITE</span>
                <h2 id="ai-hub-title">AI Study Hub</h2>
                <p className="ai-modal-subtitle">Private local AI tools to explain concepts, generate quizzes, analyze notes, detect weak areas, and score exam readiness.</p>
              </div>
              <div className={`model-pill status-${modelStatus}`} title="Local AI Model Status">
                <span className="status-orb" />
                <span className="model-name">{modelName}</span>
              </div>
            </div>

            {/* AI Navigation Tabs */}
            <div className="ai-hub-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={aiToolsTab === 'assistant'}
                className={`ai-hub-tab-btn ${aiToolsTab === 'assistant' ? 'active' : ''}`}
                onClick={() => setAiToolsTab('assistant')}
              >
                <span className="tab-icon">🤖</span>
                <span>AI Assistant</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiToolsTab === 'quiz'}
                className={`ai-hub-tab-btn ${aiToolsTab === 'quiz' ? 'active' : ''}`}
                onClick={() => setAiToolsTab('quiz')}
              >
                <span className="tab-icon">📝</span>
                <span>Quiz Generator</span>
                {quizHistory.length > 0 && <span className="tab-badge">{quizHistory.length}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiToolsTab === 'notes'}
                className={`ai-hub-tab-btn ${aiToolsTab === 'notes' ? 'active' : ''}`}
                onClick={() => setAiToolsTab('notes')}
              >
                <span className="tab-icon">📄</span>
                <span>PDF Notes Analyzer</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiToolsTab === 'weak'}
                className={`ai-hub-tab-btn ${aiToolsTab === 'weak' ? 'active' : ''}`}
                onClick={() => setAiToolsTab('weak')}
              >
                <span className="tab-icon">⚠️</span>
                <span>Weak Topics</span>
                {weakTopics.length > 0 && <span className="tab-badge warn">{weakTopics.length}</span>}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={aiToolsTab === 'readiness'}
                className={`ai-hub-tab-btn ${aiToolsTab === 'readiness' ? 'active' : ''}`}
                onClick={() => setAiToolsTab('readiness')}
              >
                <span className="tab-icon">🎯</span>
                <span>Exam Readiness</span>
              </button>
            </div>

            {/* Tab 1: AI Study Assistant */}
            {aiToolsTab === 'assistant' && (
              <div className="ai-tab-panel assistant-panel" role="tabpanel">
                <div className="panel-intro">
                  <h3>Ask your local AI tutor</h3>
                  <p>Ask concept questions, code explanations, problem-solving strategies, or formulas.</p>
                </div>

                <form className="assistant-form" onSubmit={handleAskAssistant}>
                  <div className="assistant-subject-row">
                    <label htmlFor="assistant-subj">Subject / Topic context (optional):</label>
                    <input
                      id="assistant-subj"
                      type="text"
                      placeholder="e.g. C++ Pointers, Calculus, Physics, Operating Systems…"
                      value={assistantSubject}
                      onChange={(e) => setAssistantSubject(e.target.value)}
                    />
                    {subjectLibrary.length > 0 && (
                      <div className="assistant-quick-chips">
                        {subjectLibrary.slice(0, 4).map((s) => (
                          <button key={s} type="button" onClick={() => setAssistantSubject(s)}>{s}</button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="assistant-input-wrapper">
                    <textarea
                      rows={3}
                      placeholder="e.g. Can you explain the difference between pass-by-value and pass-by-reference with a quick analogy and example? (or speak using voice)"
                      value={assistantQuestion}
                      onChange={(e) => setAssistantQuestion(e.target.value)}
                      required
                    />
                    <div className="assistant-input-actions">
                      <button
                        type="button"
                        className={`voice-entry-btn ${voiceListening && voiceTargetField === 'assistant' ? 'is-recording' : ''}`}
                        onClick={() => toggleVoiceEntry('assistant')}
                        title="Dictate question by voice"
                      >
                        <span className="voice-mic-icon">🎤</span>
                        <span>{voiceListening && voiceTargetField === 'assistant' ? 'Listening…' : 'Voice'}</span>
                      </button>
                      <button type="submit" className="generate-button" disabled={assistantLoading || !assistantQuestion.trim()}>
                        {assistantLoading ? <><span className="spinner" /> Thinking…</> : <>Ask question <span>→</span></>}
                      </button>
                    </div>
                  </div>

                  {voiceListening && voiceTargetField === 'assistant' && (
                    <div className="voice-live-banner">
                      <span className="pulse-dot" />
                      <span>Listening… {voiceTranscript || 'Speak your question clearly'}</span>
                      <button type="button" onClick={() => toggleVoiceEntry('assistant')}>Done</button>
                    </div>
                  )}
                  {voiceError && voiceTargetField === 'assistant' && <div className="voice-error-banner">⚠️ {voiceError}</div>}
                  {assistantError && <div className="ai-error-box"><p>⚠️ {assistantError}</p></div>}
                </form>

                {/* Answer Display */}
                {assistantAnswer && (
                  <div className="assistant-answer-card">
                    <div className="answer-header">
                      <span className="answer-badge">💡 TUTOR EXPLANATION</span>
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(assistantAnswer);
                          setScheduleNotice('Explanation copied to clipboard!');
                          setTimeout(() => setScheduleNotice(''), 3000);
                        }}
                      >
                        Copy explanation
                      </button>
                    </div>
                    <div className="answer-body">
                      {assistantAnswer.split('\n\n').map((para, idx) => (
                        <p key={idx}>{para}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question & Answer History */}
                {assistantHistory.length > 0 && (
                  <div className="assistant-history-section">
                    <h4>Recent Questions &amp; Answers ({assistantHistory.length})</h4>
                    <div className="history-qa-list">
                      {assistantHistory.slice(0, 5).map((item, idx) => (
                        <details key={idx} className="qa-history-item">
                          <summary className="qa-summary">
                            <span className="qa-q-icon">Q:</span>
                            <strong className="qa-question">{item.q}</strong>
                            {item.subject && <span className="qa-subject-pill">{item.subject}</span>}
                          </summary>
                          <div className="qa-expanded-answer">
                            <p>{item.a}</p>
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: AI Quiz Generator & Practice */}
            {aiToolsTab === 'quiz' && (
              <div className="ai-tab-panel quiz-panel" role="tabpanel">
                <div className="panel-intro">
                  <h3>AI Practice Quiz Generator</h3>
                  <p>Generate interactive multiple-choice or short-answer quizzes. Missed topics are automatically flagged for review!</p>
                </div>

                <form className="quiz-generator-form" onSubmit={handleGenerateQuiz}>
                  <div className="quiz-form-row">
                    <div className="quiz-form-field">
                      <label htmlFor="quiz-subject">Subject</label>
                      <input
                        id="quiz-subject"
                        type="text"
                        placeholder="e.g. C++ Programming, Mathematics…"
                        value={quizSubject}
                        onChange={(e) => setQuizSubject(e.target.value)}
                      />
                    </div>
                    <div className="quiz-form-field">
                      <label htmlFor="quiz-topic">Specific Topic (optional)</label>
                      <input
                        id="quiz-topic"
                        type="text"
                        placeholder="e.g. Memory allocation, Integration, Arrays…"
                        value={quizTopic}
                        onChange={(e) => setQuizTopic(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="quiz-form-row settings-row">
                    <div className="quiz-form-field">
                      <label>Question Type</label>
                      <div className="quiz-pill-group">
                        <button
                          type="button"
                          className={`pill-btn ${quizType === 'mcq' ? 'active' : ''}`}
                          onClick={() => setQuizType('mcq')}
                        >
                          Multiple Choice (MCQ)
                        </button>
                        <button
                          type="button"
                          className={`pill-btn ${quizType === 'short' ? 'active' : ''}`}
                          onClick={() => setQuizType('short')}
                        >
                          Short Answer
                        </button>
                      </div>
                    </div>

                    <div className="quiz-form-field">
                      <label>Difficulty</label>
                      <div className="quiz-pill-group">
                        {['easy', 'medium', 'hard'].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            className={`pill-btn ${quizDifficulty === lvl ? 'active' : ''}`}
                            onClick={() => setQuizDifficulty(lvl)}
                          >
                            {lvl === 'easy' ? '🟢 Easy' : lvl === 'medium' ? '🟡 Medium' : '🔴 Hard'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="quiz-form-field">
                      <label>Number of Questions</label>
                      <div className="quiz-pill-group">
                        {['3', '5', '8', '10'].map((c) => (
                          <button
                            key={c}
                            type="button"
                            className={`pill-btn ${quizCount === c ? 'active' : ''}`}
                            onClick={() => setQuizCount(c)}
                          >
                            {c} Qs
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="generate-button quiz-submit-btn" disabled={quizLoading}>
                    {quizLoading ? <><span className="spinner" /> Crafting questions…</> : <>Generate quiz <span>⚡</span></>}
                  </button>
                  {quizError && <div className="ai-error-box"><p>⚠️ {quizError}</p></div>}
                </form>

                {/* Interactive Quiz Runner */}
                {parsedQuiz.length > 0 && (
                  <div className="interactive-quiz-runner">
                    <div className="quiz-runner-header">
                      <div>
                        <h4>Quiz on {quizTopic || quizSubject || 'Selected Subjects'}</h4>
                        <span>{parsedQuiz.length} questions · {quizDifficulty.toUpperCase()}</span>
                      </div>
                      {quizSubmitted && quizScore && (
                        <div className={`quiz-score-badge ${quizScore.pct >= 80 ? 'high' : quizScore.pct >= 60 ? 'mid' : 'low'}`}>
                          <span>Score:</span> <strong>{quizScore.pct}%</strong> ({quizScore.correct}/{quizScore.total})
                        </div>
                      )}
                    </div>

                    <div className="quiz-questions-list">
                      {parsedQuiz.map((q, idx) => {
                        const isSelected = quizAnswers[q.id];
                        const isCorrect = isSelected === q.correct;
                        return (
                          <div
                            key={q.id}
                            className={`quiz-card ${quizSubmitted && q.type === 'mcq' ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}
                          >
                            <div className="quiz-q-title">
                              <span className="q-badge">Q{idx + 1}</span>
                              <p className="q-text">{q.question}</p>
                            </div>

                            {q.type === 'mcq' && q.options && (
                              <div className="quiz-options-group">
                                {Object.entries(q.options).map(([letter, text]) => {
                                  const isOptionSelected = quizAnswers[q.id] === letter;
                                  const isOptionCorrect = q.correct === letter;
                                  return (
                                    <button
                                      key={letter}
                                      type="button"
                                      disabled={quizSubmitted}
                                      className={`quiz-option-btn ${isOptionSelected ? 'selected' : ''} ${quizSubmitted ? (isOptionCorrect ? 'correct-highlight' : isOptionSelected ? 'wrong-highlight' : '') : ''}`}
                                      onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                                    >
                                      <span className="option-letter">{letter}</span>
                                      <span className="option-text">{text}</span>
                                      {quizSubmitted && isOptionCorrect && <span className="opt-mark">✓ Correct</span>}
                                      {quizSubmitted && isOptionSelected && !isOptionCorrect && <span className="opt-mark wrong">✕ Your choice</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {q.type === 'short' && (
                              <div className="quiz-short-answer-section">
                                <details className="short-answer-reveal">
                                  <summary>Reveal Model Answer</summary>
                                  <div className="short-answer-box">
                                    <p><strong>Correct Answer:</strong> {q.answer}</p>
                                  </div>
                                </details>
                              </div>
                            )}

                            {quizSubmitted && q.explanation && (
                              <div className="quiz-explanation-box">
                                <strong>💡 Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {parsedQuiz.some((q) => q.type === 'mcq') && !quizSubmitted && (
                      <div className="quiz-submit-row">
                        <button
                          type="button"
                          className="generate-button"
                          onClick={submitQuiz}
                          disabled={Object.keys(quizAnswers).length === 0}
                        >
                          Submit Answers &amp; Grade <span>✓</span>
                        </button>
                      </div>
                    )}

                    {quizSubmitted && (
                      <div className="quiz-post-actions">
                        <button type="button" className="secondary-button" onClick={() => { setParsedQuiz([]); setQuizAnswers({}); setQuizSubmitted(false); }}>
                          Take another quiz
                        </button>
                        {weakTopics.length > 0 && (
                          <button type="button" className="generate-button" onClick={() => setAiToolsTab('weak')}>
                            View identified weak topics ({weakTopics.length}) <span>→</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Raw quiz fallback if parsing yielded empty */}
                {parsedQuiz.length === 0 && quizOutput && (
                  <div className="quiz-raw-card">
                    <h4>Generated Quiz</h4>
                    <pre>{quizOutput}</pre>
                  </div>
                )}

                {/* Quiz History */}
                {quizHistory.length > 0 && (
                  <div className="quiz-history-card">
                    <h4>Quiz History ({quizHistory.length})</h4>
                    <div className="quiz-history-list">
                      {quizHistory.slice(0, 5).map((item) => (
                        <div key={item.id} className="quiz-history-row">
                          <span className="qh-subject"><strong>{item.subject}</strong>{item.topic ? ` · ${item.topic}` : ''}</span>
                          <span className="qh-diff">{item.difficulty}</span>
                          <span className="qh-date">{new Date(item.date).toLocaleDateString()}</span>
                          <span className={`qh-score ${item.score >= 80 ? 'good' : item.score >= 60 ? 'mid' : 'low'}`}>
                            {item.score != null ? `${item.score}%` : 'Practice'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: PDF Notes Analyzer */}
            {aiToolsTab === 'notes' && (
              <div className="ai-tab-panel notes-panel" role="tabpanel">
                <div className="panel-intro">
                  <h3>PDF &amp; Notes Analyzer</h3>
                  <p>Upload lecture notes (.pdf, .txt, .md) or paste text to generate structured summaries, key concepts, and custom quizzes.</p>
                </div>

                <form className="notes-analyzer-form" onSubmit={handleAnalyzeNotes}>
                  <div className="notes-upload-dropzone" onClick={() => notesFileInputRef.current?.click()}>
                    <span className="dropzone-icon">📄</span>
                    <strong>{pdfFileName ? `Selected: ${pdfFileName}` : 'Click or drop notes here (.pdf, .txt, .md)'}</strong>
                    <small>Client-side text extraction · stays 100% private on your machine</small>
                    <input
                      ref={notesFileInputRef}
                      type="file"
                      accept=".pdf,.txt,.md,text/plain,application/pdf"
                      onChange={handleNotesFileUpload}
                      hidden
                    />
                  </div>

                  <div className="notes-input-group">
                    <div className="label-row">
                      <label htmlFor="notes-textarea">Notes text content:</label>
                      <span className="notes-chars-count">{(notesText || '').length} / 8000 characters</span>
                    </div>
                    <textarea
                      id="notes-textarea"
                      rows={5}
                      placeholder="Paste your lecture notes, textbook excerpts, or syllabus items here…"
                      value={notesText}
                      maxLength={8000}
                      onChange={(e) => setNotesText(e.target.value)}
                    />
                  </div>

                  <div className="notes-config-row">
                    <div className="notes-field">
                      <label htmlFor="notes-subject-input">Subject Tag</label>
                      <input
                        id="notes-subject-input"
                        type="text"
                        placeholder="e.g. Operating Systems, Microeconomics…"
                        value={notesSubject}
                        onChange={(e) => setNotesSubject(e.target.value)}
                      />
                    </div>

                    <div className="notes-field">
                      <label>Analysis Mode</label>
                      <div className="quiz-pill-group">
                        <button
                          type="button"
                          className={`pill-btn ${notesMode === 'summary' ? 'active' : ''}`}
                          onClick={() => setNotesMode('summary')}
                        >
                          📑 Concepts &amp; Summary
                        </button>
                        <button
                          type="button"
                          className={`pill-btn ${notesMode === 'quiz' ? 'active' : ''}`}
                          onClick={() => setNotesMode('quiz')}
                        >
                          📝 Practice Quiz
                        </button>
                        <button
                          type="button"
                          className={`pill-btn ${notesMode === 'both' ? 'active' : ''}`}
                          onClick={() => setNotesMode('both')}
                        >
                          🌟 Full Study Pack
                        </button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="generate-button" disabled={notesLoading || !notesText.trim()}>
                    {notesLoading ? <><span className="spinner" /> Analyzing notes with AI…</> : <>Analyze notes <span>→</span></>}
                  </button>
                  {notesError && <div className="ai-error-box"><p>⚠️ {notesError}</p></div>}
                </form>

                {/* Analysis Results Display */}
                {notesAnalysis && (
                  <div className="notes-analysis-results">
                    <div className="results-header">
                      <h4>AI Notes Analysis</h4>
                      <div className="results-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => {
                            setQuizOutput(notesAnalysis);
                            const parsed = parseQuizFromText(notesAnalysis, 'mcq');
                            if (parsed.length > 0) {
                              setParsedQuiz(parsed);
                              setAiToolsTab('quiz');
                            } else {
                              navigator.clipboard.writeText(notesAnalysis);
                              setScheduleNotice('Analysis copied to clipboard!');
                              setTimeout(() => setScheduleNotice(''), 3000);
                            }
                          }}
                        >
                          {notesMode.includes('quiz') || notesAnalysis.includes('Q1.') ? '⚡ Load Quiz into Runner' : 'Copy Analysis'}
                        </button>
                      </div>
                    </div>

                    <div className="notes-analysis-body">
                      {notesAnalysis.split(/\n\s*\n/).map((para, idx) => (
                        <div key={idx} className="notes-section-block">
                          <p>{para}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 4: Weak Topic Detection & Remedy */}
            {aiToolsTab === 'weak' && (
              <div className="ai-tab-panel weak-topics-panel" role="tabpanel">
                <div className="panel-intro">
                  <h3>Weak Topic Detection</h3>
                  <p>Topics you mark as difficult in your plans or miss in practice quizzes are tracked here to guarantee extra revision time.</p>
                </div>

                <div className="weak-stats-bar">
                  <div className="weak-stat-box">
                    <span className="stat-label">FLAGGED WEAK TOPICS</span>
                    <strong>{weakTopics.length}</strong>
                  </div>
                  <div className="weak-stat-box">
                    <span className="stat-label">HARD RATED IN PLAN</span>
                    <strong>{Object.values(difficultyRatings).filter((r) => r.rating >= 2).length}</strong>
                  </div>
                  <div className="weak-stat-box">
                    <span className="stat-label">QUIZZES ATTEMPTED</span>
                    <strong>{quizHistory.length}</strong>
                  </div>
                </div>

                {/* Weak Topics List & Add Form */}
                <div className="weak-topics-manager">
                  <div className="weak-add-row">
                    <input
                      id="manual-weak-input"
                      type="text"
                      placeholder="Add a topic you find challenging (e.g. Dynamic Programming, Laplace Transforms)…"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addWeakTopic(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        const input = document.getElementById('manual-weak-input');
                        if (input && input.value) {
                          addWeakTopic(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      ＋ Add topic
                    </button>
                  </div>

                  {weakTopics.length === 0 ? (
                    <div className="weak-empty-state">
                      <span className="weak-icon">🛡️</span>
                      <strong>No weak topics flagged yet!</strong>
                      <p>Rate tasks as &ldquo;Hard&rdquo; on your study canvas or take practice quizzes. Missed concepts will automatically appear here.</p>
                    </div>
                  ) : (
                    <div className="weak-chips-grid">
                      {weakTopics.map((topic) => (
                        <div className="weak-chip-card" key={topic}>
                          <span className="weak-topic-title">{topic}</span>
                          <button
                            type="button"
                            className="weak-chip-remove"
                            onClick={() => removeWeakTopic(topic)}
                            title="Remove from weak topics"
                            aria-label={`Remove ${topic}`}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {weakTopics.length > 0 && (
                    <div className="weak-action-bar">
                      <button
                        type="button"
                        className="generate-button"
                        onClick={handleDetectWeakTopics}
                        disabled={weakLoading}
                      >
                        {weakLoading ? <><span className="spinner" /> Analyzing weak areas…</> : <>Run AI Diagnostic &amp; Action Plan <span>⚡</span></>}
                      </button>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          const weakStr = weakTopics.slice(0, 4).join(', ');
                          setSubjects((prev) => prev ? `${prev}, ${weakStr}` : weakStr);
                          setAiModalOpen(false);
                          document.getElementById('planner')?.scrollIntoView({ behavior: 'smooth' });
                          setScheduleNotice('Weak topics added to your plan builder!');
                          setTimeout(() => setScheduleNotice(''), 3000);
                        }}
                      >
                        Prioritize in Next Study Plan ↗
                      </button>
                    </div>
                  )}
                  {weakError && <div className="ai-error-box"><p>⚠️ {weakError}</p></div>}
                </div>

                {/* AI Diagnostic Output */}
                {weakAnalysis && (
                  <div className="weak-analysis-results">
                    <h4>AI Diagnostic &amp; Improvement Plan</h4>
                    <div className="weak-analysis-body">
                      {weakAnalysis.split(/\n\s*\n/).map((para, idx) => (
                        <div key={idx} className="weak-advice-card">
                          <p>{para}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 5: Exam Readiness Score */}
            {aiToolsTab === 'readiness' && (
              <div className="ai-tab-panel readiness-panel" role="tabpanel">
                <div className="panel-intro">
                  <h3>Exam Readiness Score</h3>
                  <p>Synthesizes your syllabus task completion, logged study hours, practice quiz scores, and weak areas to estimate exam preparation.</p>
                </div>

                <div className="readiness-config-row">
                  <div className="readiness-field">
                    <label htmlFor="readiness-days">Days until exam:</label>
                    <input
                      id="readiness-days"
                      type="number"
                      min="1"
                      max="365"
                      value={readinessExamDays}
                      onChange={(e) => setReadinessExamDays(e.target.value)}
                    />
                  </div>
                  <div className="readiness-field">
                    <label>Target Hours for this Subject:</label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={Number(hours) * Number(days) || 12}
                      readOnly
                      title="Calculated from your active study plan"
                    />
                  </div>
                  <button
                    type="button"
                    className="generate-button readiness-calc-btn"
                    onClick={handleCheckReadiness}
                    disabled={readinessLoading}
                  >
                    {readinessLoading ? <><span className="spinner" /> Calculating…</> : <>Compute readiness <span>🎯</span></>}
                  </button>
                </div>

                {/* Readiness Score Radial Gauge Card */}
                <div className="readiness-dashboard-card">
                  <div className="readiness-gauge-column">
                    <div className="readiness-circle-meter">
                      <svg viewBox="0 0 100 100" className="readiness-svg">
                        <circle cx="50" cy="50" r="42" className="readiness-track" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          className="readiness-fill"
                          strokeDasharray="264"
                          strokeDashoffset={
                            264 - (264 * Math.min(100, Math.round(
                              (trackableTasks.length > 0 ? (completedCount / trackableTasks.length) * 40 : 10) +
                              (Number(analyticsData.totalHours) > 0 ? Math.min(30, (Number(analyticsData.totalHours) / (Number(hours) * Number(days) || 10)) * 30) : 5) +
                              (averageQuizScore > 0 ? (averageQuizScore / 100) * 30 : 15)
                            ))) / 100
                          }
                        />
                      </svg>
                      <div className="readiness-center-label">
                        <strong>
                          {Math.min(100, Math.round(
                            (trackableTasks.length > 0 ? (completedCount / trackableTasks.length) * 40 : 10) +
                            (Number(analyticsData.totalHours) > 0 ? Math.min(30, (Number(analyticsData.totalHours) / (Number(hours) * Number(days) || 10)) * 30) : 5) +
                            (averageQuizScore > 0 ? (averageQuizScore / 100) * 30 : 15)
                          ))}
                        </strong>
                        <small>/ 100</small>
                      </div>
                    </div>
                    <span className="readiness-score-verdict">
                      {Math.min(100, Math.round(
                        (trackableTasks.length > 0 ? (completedCount / trackableTasks.length) * 40 : 10) +
                        (Number(analyticsData.totalHours) > 0 ? Math.min(30, (Number(analyticsData.totalHours) / (Number(hours) * Number(days) || 10)) * 30) : 5) +
                        (averageQuizScore > 0 ? (averageQuizScore / 100) * 30 : 15)
                      )) >= 80 ? '🌟 Well Prepared' : Math.min(100, Math.round(
                        (trackableTasks.length > 0 ? (completedCount / trackableTasks.length) * 40 : 10) +
                        (Number(analyticsData.totalHours) > 0 ? Math.min(30, (Number(analyticsData.totalHours) / (Number(hours) * Number(days) || 10)) * 30) : 5) +
                        (averageQuizScore > 0 ? (averageQuizScore / 100) * 30 : 15)
                      )) >= 60 ? '✓ Mostly Ready' : '⚡ Action Needed'}
                    </span>
                  </div>

                  <div className="readiness-factors-list">
                    <div className="factor-row">
                      <span className="factor-icon">📚</span>
                      <div className="factor-meta">
                        <strong>Syllabus Progress</strong>
                        <small>{completedCount} of {trackableTasks.length} tasks completed ({trackableTasks.length > 0 ? Math.round((completedCount / trackableTasks.length) * 100) : 0}%)</small>
                      </div>
                    </div>
                    <div className="factor-row">
                      <span className="factor-icon">⏱️</span>
                      <div className="factor-meta">
                        <strong>Study Time Logged</strong>
                        <small>{analyticsData.totalHours} hrs studied of {Number(hours) * Number(days)}h plan target</small>
                      </div>
                    </div>
                    <div className="factor-row">
                      <span className="factor-icon">📝</span>
                      <div className="factor-meta">
                        <strong>Quiz Mastery Score</strong>
                        <small>{averageQuizScore > 0 ? `${averageQuizScore}% average accuracy (${quizHistory.length} attempts)` : 'No quizzes taken yet'}</small>
                      </div>
                    </div>
                    <div className="factor-row">
                      <span className="factor-icon">⚠️</span>
                      <div className="factor-meta">
                        <strong>Flagged Weak Areas</strong>
                        <small>{weakTopics.length > 0 ? `${weakTopics.length} topics flagged for review` : 'Zero weak areas identified'}</small>
                      </div>
                    </div>
                  </div>
                </div>

                {readinessError && <div className="ai-error-box"><p>⚠️ {readinessError}</p></div>}

                {/* AI In-depth Readiness Assessment */}
                {readinessResult && (
                  <div className="readiness-ai-assessment">
                    <h4>AI Exam Readiness Assessment</h4>
                    <div className="readiness-assessment-body">
                      {readinessResult.split(/\n\s*\n/).map((para, idx) => (
                        <div key={idx} className="readiness-assessment-card">
                          <p>{para}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Spotlight Command Palette Modal */}
      {commandPaletteOpen && (
        <div
          className="command-palette-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCommandPaletteOpen(false);
          }}
        >
          <div
            className="command-palette-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <div className="command-palette-header">
              <span className="command-palette-search-icon">🔍</span>
              <input
                ref={commandInputRef}
                type="text"
                className="command-search-input"
                placeholder="Type a command or jump to… (e.g. Focus, Rain, Timetable, Backup)"
                value={commandQuery}
                onChange={(e) => {
                  setCommandQuery(e.target.value);
                  setCommandSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setCommandSelectedIndex((prev) => (filteredCommands.length ? (prev + 1) % filteredCommands.length : 0));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setCommandSelectedIndex((prev) => (filteredCommands.length ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredCommands[commandSelectedIndex]) {
                      filteredCommands[commandSelectedIndex].action();
                    }
                  }
                }}
                aria-label="Search commands"
              />
              <kbd className="command-palette-esc-kbd" onClick={() => setCommandPaletteOpen(false)}>ESC</kbd>
            </div>

            <div className="command-palette-body">
              {filteredCommands.length === 0 ? (
                <div className="command-empty-state">
                  <span>🔍</span>
                  <p>No matching commands found for &ldquo;{commandQuery}&rdquo;</p>
                </div>
              ) : (
                <div className="command-list" role="listbox">
                  {filteredCommands.map((cmd, idx) => (
                    <div
                      key={cmd.id}
                      role="option"
                      aria-selected={idx === commandSelectedIndex}
                      className={`command-item ${idx === commandSelectedIndex ? 'is-selected' : ''} ${cmd.category === 'Danger' ? 'is-danger' : ''}`}
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setCommandSelectedIndex(idx)}
                    >
                      <span className="command-item-icon">{cmd.icon}</span>
                      <div className="command-item-info">
                        <div className="command-item-title-row">
                          <strong className="command-item-title">{cmd.title}</strong>
                          <span className="command-item-category">{cmd.category}</span>
                        </div>
                        <span className="command-item-subtitle">{cmd.subtitle}</span>
                      </div>
                      {cmd.shortcut && (
                        <kbd className="command-item-shortcut">{cmd.shortcut}</kbd>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="command-palette-footer">
              <div className="command-footer-hints">
                <span><kbd className="command-mini-kbd">↑</kbd><kbd className="command-mini-kbd">↓</kbd> Navigate</span>
                <span><kbd className="command-mini-kbd">↵</kbd> Select</span>
                <span><kbd className="command-mini-kbd">Esc</kbd> Close</span>
              </div>
              <span className="command-footer-badge">StudyMate Spotlight</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
