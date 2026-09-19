/* Daily practice UI. Existing ganapatiVratha_v2 backups remain compatible. */
const PRACTICE_LOCK = 'vratha-practice-write';
const $ = id => document.getElementById(id);
let undoEntry = null;
let editingDay = null;
let noteDay = null;
let noteDirty = false;
let companionReady = false;
let audioRun = null;
let gapTimer = null;
let sessionStarted = null;
let focusReturn = null;
let wakeLock = null;
let preferences = {};
try { preferences = JSON.parse(localStorage.getItem('vratha_preferences')) || {}; } catch (_) {}
const playbackChannel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('vratha-playback') : null;
if (playbackChannel) playbackChannel.onmessage = () => stopGuidedAudio();

function practiceLock(action) {
  return navigator.locks ? navigator.locks.request(PRACTICE_LOCK, action) : Promise.resolve().then(action);
}
function getDayForToday() {
  for (let d = 1; d <= DAYS; d++) if (state['d' + d]?.date === todayISO()) return d;
  return null;
}
function dayCount(d) { return d ? state['d' + d].marks.filter(Boolean).length : 0; }
function announce(message) { $('practiceAnnouncement').textContent = message; }
function isDayComplete(day, config = getPracticeConfig(state)) { return dayIsComplete(day, config); }

async function changeDay(d, mutate, message = 'Progress saved', options = {}) {
  const cycle = state.cycleId || null;
  const configVersion = JSON.stringify(getPracticeConfig(state));
  const practice = activePractice;
  return practiceLock(() => {
    if (activePractice !== practice) return false;
    syncTrackerState();
    if (JSON.stringify(getPracticeConfig(state)) !== configVersion) { showToast('Practice goals changed. Please try again.'); return false; }
    if ((state.cycleId || null) !== cycle) { showToast('The cycle changed in another tab. Please try again.'); return false; }
    if (!d || !state['d' + d] || isFuture(d)) return false;
    const before = JSON.stringify(state['d' + d]);
    mutate(state['d' + d]);
    const after = JSON.stringify(state['d' + d]);
    if (before === after) return false;
    if (options.undo !== false) undoEntry = { d, before, after, expires: Date.now() + 30000, cycle: state.cycleId || null };
    saveState(state);
    if (options.celebrate !== false && !$('focusDialog').open) refreshCard(d);
    else buildCards();
    updateStats();
    renderCompanion();
    announce(message);
    return true;
  });
}
async function countChant() {
  const d = getDayForToday();
  const changed = await changeDay(d, day => {
    if (day.date !== todayISO()) return;
    const next = day.marks.indexOf(false);
    if (next >= 0) day.marks[next] = true;
  }, 'Chant recorded');
  if (changed) {
    if (!sessionStarted) sessionStarted = Date.now();
    feedback(dayCount(d) === CHANTS);
    if ([Math.ceil(CHANTS/3), Math.ceil(CHANTS*2/3), CHANTS].includes(dayCount(d))) announce(dayCount(d) + ' of ' + CHANTS + ' chants completed');
  }
  return changed;
}
function toggleDailyTemple() {
  return changeDay(getDayForToday(), day => { day.temple = !day.temple; }, 'Temple visit updated');
}
async function undoPractice() {
  return practiceLock(() => {
    if (!undoEntry || undoEntry.expires < Date.now()) { undoEntry = null; renderCompanion(); return; }
    const entry = undoEntry;
    syncTrackerState();
    const {d, before, after, cycle} = entry;
    if ((state.cycleId || null) !== cycle || JSON.stringify(state['d' + d]) !== after) {
      undoEntry = null; renderCompanion(); showToast('This entry changed elsewhere. Use Edit entry to correct it.'); return;
    }
    stopGuidedAudio();
    state['d' + d] = JSON.parse(before);
    undoEntry = null;
    closeGitaQuote();
    saveState(state); buildCards(); renderCompanion(); announce('Last action undone');
  });
}
function renderCompanion() {
  if (!companionReady) return;
  const d = getDayForToday();
  const count = dayCount(d);
  const day = d ? state['d' + d] : null;
  $('todayHeading').textContent = PRACTICES[activePractice].name + ' · Today’s practice';
  $('todaySubtitle').textContent = d ? 'Day ' + d + ' of ' + DAYS + ' · ' + fmtDate(todayISO()) : fmtDate(todayISO());
  $('practiceHint').textContent = !d ? 'Choose a start date above to schedule your practice.' : count === CHANTS ? (isDayComplete(day) ? 'Today’s practice is complete. Take a quiet moment.' : CHANTS + ' chants complete. Record your temple visit when ready.') : 'One repetition. One tap.';
  $('dailyCount').textContent = $('focusCount').textContent = count;
  ['dailyTap','focusTap'].forEach(id => {
    $(id).style.setProperty('--progress', (count / CHANTS * 360) + 'deg');
    $(id).disabled = !d || count >= CHANTS;
    $(id).setAttribute('aria-label', count + ' of ' + CHANTS + ' chants completed. Count one chant');
  });
  $('focusLaunch').disabled = !d;
  $('dailyTemple').disabled = !d;
  $('dailyTemple').textContent = day?.temple ? '✓ Temple visited' : 'Record temple visit';
  $('dailyTemple').setAttribute('aria-pressed', String(Boolean(day?.temple)));
  $('focusDay').textContent = d ? PRACTICES[activePractice].name + ' · Day ' + d + ' · ' + fmtDate(todayISO()) : 'No day scheduled for today';
  $('focusHint').textContent = count === CHANTS ? 'Your ' + CHANTS + ' chants are complete. 🙏' : 'Tap the circle or press Space.';
  $('dailyNote').disabled = $('saveNote').disabled = !d;
  if (noteDay !== d || !noteDirty) { $('dailyNote').value = day?.note || ''; noteDay = d; noteDirty = false; }
  if (undoEntry && (JSON.stringify(state['d'+undoEntry.d]) !== undoEntry.after || (state.cycleId || null) !== undoEntry.cycle)) undoEntry = null;
  const canUndo = Boolean(undoEntry && undoEntry.expires > Date.now());
  $('undoButton').disabled = $('focusUndo').disabled = !canUndo;
  let complete = 0;
  const grid = $('journeyGrid');
  // Preserve focus while updating calendar tiles after a cross-tab save.
  if (grid.children.length !== DAYS) {
    grid.replaceChildren();
    for (let i = 1; i <= DAYS; i++) {
      const button = document.createElement('button');
      button.className = 'journey-day'; button.type = 'button';
      button.innerHTML = '<span></span><small></small>';
      button.addEventListener('click', () => revealDay(i));
      grid.appendChild(button);
    }
  }
  for (let i = 1; i <= DAYS; i++) {
    ensureDay(i);
    const entry = state['d' + i];
    const n = entry.marks.filter(Boolean).length;
    const status = isDayComplete(entry) ? 'complete' : n || entry.temple ? 'partial' : isFuture(i) ? 'future' : 'empty';
    if (status === 'complete') complete++;
    const button = grid.children[i - 1];
    button.dataset.status = status;
    button.firstElementChild.textContent = i;
    button.lastElementChild.textContent = { complete: '✓', partial: '◐', future: '·', empty: '○' }[status];
    button.setAttribute('aria-label', 'Day ' + i + ', ' + (entry.date ? fmtDate(entry.date) + ', ' : '') + n + ' of ' + CHANTS + ' chants, ' + (entry.temple ? 'temple visited' : 'temple not recorded'));
    if (i === d) button.setAttribute('aria-current', 'date'); else button.removeAttribute('aria-current');
  }
  $('journeySummary').textContent = complete + ' of ' + DAYS + ' complete';
  $('lastBackup').textContent = state.lastBackup ? 'Last backup: ' + new Date(state.lastBackup).toLocaleString() : 'No backup downloaded yet.';
  renderArchives();
  renderAudioControls();
  renderGoalSettings();
  renderInsights();
}
function revealDay(d) {
  detailDay = d;
  buildCards();
  $('dayDetails').open = true;
  const card = $('card' + d);
  card.focus({preventScroll:true});
  card.scrollIntoView({behavior:scrollBehavior(),block:'start'});
}
function saveDailyNote() {
  const d = noteDay, value = $('dailyNote').value;
  return changeDay(d, day => { day.note = value; }, 'Note saved').then(() => { noteDirty = false; renderCompanion(); });
}
$('dailyNote').addEventListener('input', () => { noteDirty = true; });
function openDayEditor(d) {
  if (isFuture(d)) return;
  editingDay = d;
  $('editDayHeading').textContent = 'Correct day ' + d;
  $('editChants').max = CHANTS;
  $('editChants').value = dayCount(d);
  $('editTemple').checked = state['d' + d].temple;
  $('editNote').value = state['d' + d].note || '';
  $('editDayDialog').showModal();
}
$('editDayForm').addEventListener('submit', async event => {
  event.preventDefault();
  const count = Number($('editChants').value), temple = $('editTemple').checked, note = $('editNote').value;
  if (!Number.isInteger(count) || count < 0 || count > CHANTS) return;
  stopGuidedAudio();
  await changeDay(editingDay, day => { day.marks = Array.from({length:CHANTS}, (_,i) => i < count); day.temple = temple; day.note = note; }, 'Entry corrected', {celebrate:false});
  $('editDayDialog').close();
});

function openFocus() {
  if (!getDayForToday()) return;
  focusReturn = document.activeElement;
  $('focusDialog').showModal();
  if (!sessionStarted) sessionStarted = Date.now();
  $('focusTap').focus();
  if (navigator.wakeLock) navigator.wakeLock.request('screen').then(lock => { wakeLock = lock; if (!$('focusDialog').open) lock.release(); }).catch(() => {});
}
function closeFocus() { $('focusDialog').close(); }
$('focusDialog').addEventListener('close', () => { if (wakeLock) wakeLock.release().catch(() => {}); wakeLock = null; focusReturn?.focus(); });
$('focusDialog').addEventListener('keydown', event => {
  if (event.repeat) return;
  if (event.code === 'Space' && !event.target.closest('button,input,select,textarea')) { event.preventDefault(); countChant(); }
  if (event.key === 'Backspace') { event.preventDefault(); undoPractice(); }
});
function feedback(completed) {
  if (preferences.haptics && navigator.vibrate) navigator.vibrate(completed ? [80,80,80] : 20);
  if (!completed || !preferences.chime) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass(), oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.frequency.value = 528; oscillator.connect(gain); gain.connect(context.destination);
    gain.gain.setValueAtTime(.12, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + 1);
    oscillator.start(); oscillator.stop(context.currentTime + 1); oscillator.onended = () => context.close();
  } catch (_) {}
}
function currentAudio() { return $('manthramAudio' + $('audioVersion').value); }
function renderAudioControls() {
  const d = getDayForToday(), count = dayCount(d);
  const playing = Boolean(audioRun);
  $('audioToggle').textContent = playing ? 'Ⅱ Pause' : '▶ Play';
  $('focusAudio').textContent = playing ? 'Ⅱ Pause audio' : '▶ Audio';
  $('audioToggle').disabled = $('focusAudio').disabled = !practiceAudioReady || !d || count >= CHANTS;
  [1,2].forEach(n => { $('audioCount'+n).textContent = 'Today: ' + count + ' / ' + CHANTS; });
  if (count >= CHANTS && audioRun) stopGuidedAudio();
}
function stopGuidedAudio() {
  audioRun = null;
  clearTimeout(gapTimer); gapTimer = null;
  [1,2].forEach(n => $('manthramAudio'+n).pause());
  if (companionReady) renderAudioControls();
}
function selectRecording() { stopGuidedAudio(); saveAudioPreferences(); }
function saveAudioPreferences() {
  preferences = {...preferences, version:$('audioVersion').value, speed:$('audioSpeed').value, gap:$('audioGap').value, chime:$('completionSound').checked, haptics:$('hapticFeedback').checked};
  try { localStorage.setItem('vratha_preferences', JSON.stringify(preferences)); } catch (_) {}
  [1,2].forEach(n => { $('manthramAudio'+n).playbackRate = Number(preferences.speed) || 1; });
}
async function toggleGuidedAudio() {
  if (audioRun) { stopGuidedAudio(); return; }
  syncTrackerState();
  const d = getDayForToday();
  if (!practiceAudioReady || !d || dayCount(d) >= CHANTS) return;
  const audio = currentAudio();
  if (audio.ended) audio.currentTime = 0;
  audioRun = { d, date: todayISO(), cycle:state.cycleId || null, practice:activePractice, audio };
  playbackChannel?.postMessage('playing');
  if (!sessionStarted) sessionStarted = Date.now();
  renderAudioControls();
  try { await audio.play(); } catch (_) { stopGuidedAudio(); showToast('Unable to play. Try again when the recording is available.'); }
}
[1,2].forEach(n => {
  const audio = $('manthramAudio'+n);
  audio.preload = 'metadata';
  audio.addEventListener('error', () => { if (audioRun?.audio === audio) { stopGuidedAudio(); showToast('Recording unavailable. Manual counting is still ready.'); } });
  audio.addEventListener('ended', async () => {
    const run = audioRun;
    if (!run || run.audio !== audio) return;
    if (run.practice !== activePractice || run.date !== todayISO() || (state.cycleId || null) !== run.cycle) { stopGuidedAudio(); return; }
    const changed = await changeDay(run.d, day => {
      if (run.practice !== activePractice || day.date !== run.date || (state.cycleId || null) !== run.cycle) return;
      const next = day.marks.indexOf(false); if (next >= 0) day.marks[next] = true;
    }, 'Audio repetition completed');
    if (changed) feedback(dayCount(run.d) === CHANTS);
    if (audioRun !== run || $('stopAfter').checked || dayCount(run.d) >= CHANTS) { stopGuidedAudio(); return; }
    const delay = Number($('audioGap').value) * 1000;
    gapTimer = setTimeout(async () => {
      gapTimer = null;
      if (audioRun !== run) return;
      if ($('stopAfter').checked || run.date !== todayISO()) { stopGuidedAudio(); return; }
      audio.currentTime = 0;
      try { await audio.play(); } catch (_) { stopGuidedAudio(); showToast('Tap Play to continue.'); }
    }, delay);
  });
});
function resetAudio(n) { stopGuidedAudio(); $('manthramAudio'+n).currentTime = 0; }

function validISODate(value) {
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const date=new Date(value+'T00:00:00Z');
  return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;
}
function validDay(day, chants = 21) {
  return day && typeof day === 'object' && Array.isArray(day.marks) && day.marks.length === chants && day.marks.every(v => typeof v === 'boolean') && typeof day.temple === 'boolean' && typeof day.date === 'string' && (!day.date || validISODate(day.date)) && (day.note === undefined || (typeof day.note === 'string' && day.note.length <= 2000));
}
function validBackup(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  if (data.customPractice !== undefined && (!validCustomPractice(data.customPractice) || data.practiceId !== data.customPractice.id)) return false;
  if (data.practiceId !== undefined && !Object.hasOwn(PRACTICES, data.practiceId) && !data.customPractice) return false;
  if (data.practiceId?.startsWith('custom_') && !data.customPractice && !PRACTICES[data.practiceId]?.custom) return false;
  if (data.datesFixed !== undefined && typeof data.datesFixed !== 'boolean') return false;
  if (data.cycleId !== undefined && (typeof data.cycleId !== 'string' || data.cycleId.length > 100)) return false;
  if (data.updatedAt !== undefined && (!Number.isSafeInteger(data.updatedAt) || data.updatedAt < 0)) return false;
  if (data.lastBackup !== undefined && (typeof data.lastBackup !== 'string' || !Number.isFinite(Date.parse(data.lastBackup)))) return false;
  if (data.config !== undefined && !validConfig(data.config)) return false;
  const config = getPracticeConfig(data);
  const keys = Object.keys(data).filter(k => /^d\d+$/.test(k));
  if (!keys.length || keys.some(k => Number(k.slice(1)) < 1 || Number(k.slice(1)) > config.days || !validDay(data[k], config.chants))) return false;
  if (data.archives !== undefined && (!Array.isArray(data.archives) || data.archives.some(a => {
    if(!a || typeof a.endedAt !== 'string' || !a.days || (a.config!==undefined&&!validConfig(a.config))) return true;
    const archivedConfig=getPracticeConfig(a);
    return !Array.from({length:archivedConfig.days}, (_,i) => a.days['d'+(i+1)]).every(day=>validDay(day,archivedConfig.chants));
  }))) return false;
  return true;
}
function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], {type}));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadReminder() {
  const time = $('reminderTime').value;
  if (!/^\d{2}:\d{2}$/.test(time)) { showToast('Choose a reminder time.'); return; }
  let start = todayISO();
  if (state.d1?.date > start) start = state.d1.date;
  const end = state['d'+DAYS]?.date;
  if (end && end < start) { showToast('This cycle has ended. Start a new cycle for reminders.'); return; }
  const count = end ? Math.round((Date.parse(end) - Date.parse(start))/86400000)+1 : DAYS;
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const calendarName=PRACTICES[activePractice].name.replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Vratha//Daily Practice//EN','BEGIN:VEVENT','UID:vratha-'+Date.now()+'@ajnacs.com','DTSTAMP:'+stamp,'DTSTART:'+start.replace(/-/g,'')+'T'+time.replace(':','')+'00','DURATION:PT10M','RRULE:FREQ=DAILY;COUNT='+count,'SUMMARY:'+calendarName+' — daily practice','DESCRIPTION:Chant '+CHANTS+' times'+(getPracticeConfig(state).templeRequired?' and record your temple visit.':'.'),'BEGIN:VALARM','TRIGGER:PT0M','ACTION:DISPLAY','DESCRIPTION:Time for your '+calendarName+' practice','END:VALARM','END:VEVENT','END:VCALENDAR'];
  downloadFile('vratha-reminder.ics', lines.join('\r\n')+'\r\n','text/calendar;charset=utf-8');
  showToast('Open the downloaded reminder in your calendar app.');
}
async function archiveAndRestart() {
  const date = $('nextCycleDate').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) { showToast('Choose the next cycle’s start date.'); return; }
  if (!confirm('Save this cycle to your archive and start a new '+DAYS+'-day cycle on '+fmtDate(date)+'?')) return;
  stopGuidedAudio();
  await practiceLock(() => {
    syncTrackerState();
    const days = {};
    for (let d=1;d<=DAYS;d++) { ensureDay(d); days['d'+d] = structuredClone(state['d'+d]); }
    const archives = [...(state.archives || []), {id:Date.now().toString(), endedAt:new Date().toISOString(), config:{...getPracticeConfig(state)}, days}];
    state = {config:{...getPracticeConfig(state)}, archives, cycleId:Date.now().toString(), lastBackup:state.lastBackup, sharedCountMigrated:true};
    undoEntry = null; noteDirty = false; sessionStarted = null;
    $('sessionTime').textContent = 'Session · 00:00';
    $('startDate').value = date;
    applyStartDate();
    renderCompanion();
    announce('Previous cycle archived. Your new cycle is ready.');
  });
}
let archiveSignature = '';
function renderArchives() {
  const archives = state.archives || [];
  const signature = JSON.stringify(archives);
  if (signature === archiveSignature) return;
  archiveSignature = signature;
  $('archiveList').replaceChildren();
  for (const archive of [...archives].reverse()) {
    const details = document.createElement('details'), summary = document.createElement('summary');
    const config=getPracticeConfig(archive);
    const days = Object.values(archive.days), complete = days.filter(day=>isDayComplete(day,config)).length;
    summary.textContent = (archive.days.d1.date ? fmtDate(archive.days.d1.date) : 'Unscheduled cycle')+' · '+complete+'/'+config.days+' days complete · '+config.chants+' chants/day';
    details.appendChild(summary);
    const exportButton = document.createElement('button'); exportButton.textContent = 'Download this cycle';
    exportButton.addEventListener('click', () => downloadPracticeBackup({...archive.days,config,datesFixed:true},activePractice,'vratha-archive-'+archive.id+'.json'));
    details.appendChild(exportButton);
    for (let d=1;d<=config.days;d++) {
      const day=archive.days['d'+d], row=document.createElement('p'); row.className='archive-entry';
      row.textContent='Day '+d+' · '+(day.date || 'No date')+' · '+day.marks.filter(Boolean).length+'/'+config.chants+' · '+(day.temple?'Temple visited':'Temple not recorded')+(day.note?' — '+day.note:'');
      details.appendChild(row);
    }
    $('archiveList').appendChild(details);
  }
}

const mantraText = {
  en: [
    ['Vighnu Naashaka Ganapati Stotram', 'Param Dhaama Param Brahmaa Paresham Parameeshvaram |\nVighnu Nighnakaram Shaantam Pushtam Kaantamanantakam ||\n\nSuraasurendrai: Siddhendrai: Stutam Stomi Paraatparam |\nSurapadma Dinesham Cha Ganesham Mangalayanam ||\n\nIdam Stotram Mahaapunyam Vighnashoka Haaram Param |\nYa: Paret Praatarutthaaya Sarva Vighnaat Pramuchyate ||'],
    ['Mahaalakshmi Anugraha Vighnu Raja Stotram', 'Om Namo Vighnu Raajaaya Sarva Saukhya Pradaayine |\nDushtaarishta Vinaashaaya Paraaya Paramaatmane |\n\nLambodharam Mahaaveeryam Naagayajnopa Shobhitam |\nArdha Chandradharam Devam Vighnu Vyooha Vinaashanam ||\n\nOm Hrom – Hreem – Hroom – Hraim – Hraum – Hra: Herambaaya Namo Nama: |\n\nSarva Siddhi Pradokasatyam Siddhi Buddhi Pradobhava ||\nChintitaartha Pradasyam Hi Satatam Modakapriya: |\nSindooraroona Vastraischa Poojito Varadaayaka: ||\n\nIdam Ganapati Stotram Ya: Pared Bhaktimaan Nara: |\nTasya Dehaancha Gehaancha Swayam Lakshmeer Na Munchati ||'],
    ['Guru Ganapati Moola Mantra', 'Om Gam Ganapataye Sarva Vighnu Haaraaya – Sarvaaya – Sarva Gurave Lambodaraaya – Hreem Gam Nama: ||']
  ],
  te: [
    ['విఘ్న నాశక గణపతి స్తోత్రం', 'పరం ధామ పరం బ్రహ్మ పరేశం పరమేశ్వరం |\nవిఘ్న నిఘ్నకరం శాంతం పుష్టం కాంతమనంతకం ||\n\nసురాసురేంద్రైః సిద్ధేంద్రైః స్తుతం స్తౌమి పరాత్పరం |\nసురపద్మ దినేశం చ గణేశం మంగళాయనం ||\n\nఇదం స్తోత్రం మహాపుణ్యం విఘ్నశోక హరం పరం |\nయః పఠేత్ ప్రాతరుత్థాయ సర్వ విఘ్నాత్ ప్రముచ్యతే ||'],
    ['మహాలక్ష్మీ అనుగ్రహ విఘ్న రాజ స్తోత్రం', 'ఓం నమో విఘ్న రాజాయ సర్వ సౌఖ్య ప్రదాయినే |\nదుష్టారిష్ట వినాశాయ పరాయ పరమాత్మనే |\n\nలంబోదరం మహావీర్యం నాగయజ్ఞోప శోభితం |\nఅర్ధ చంద్రధరం దేవం విఘ్న వ్యూహ వినాశనం ||\n\nఓం హ్రోం – హ్రీం – హ్రూం – హ్రైం – హ్రౌం – హ్రః హేరంబాయ నమో నమః |\n\nసర్వ సిద్ధి ప్రదోకసత్యం సిద్ధి బుద్ధి ప్రదోభవ ||\nచింతితార్థ ప్రదస్యంహి సతతం మోదకప్రియః |\nసిందూరారుణ వస్త్రైశ్చ పూజితో వరదాయకః ||\n\nఇదం గణపతి స్తోత్రం యః పఠేద్ భక్తిమాన్ నరః |\nతస్య దేహాంచ గేహాంచ స్వయం లక్ష్మీర్ న ముంచతి ||'],
    ['గురు గణపతి మూల మంత్రం', 'ఓం గం గణపతయే సర్వ విఘ్న హారాయ – సర్వాయ – సర్వ గురవే లంబోదరాయ – హ్రీం గం నమః ||']
  ],
  meaning: [
    ['An overview of the prayer', 'These verses praise Ganapati and invoke his blessings for the removal of obstacles, wisdom, well-being, and auspiciousness. The second prayer also invokes the blessings of Lakshmi. The closing mantra offers salutations to Ganapati as the remover of obstacles and a spiritual guide.'],
    ['Reading alongside the recording', 'This is a brief thematic overview, not a line-by-line translation. The Telugu and transliteration views follow the reference sheets provided with this tracker. You can also open the original reference images below the dashboard.']
  ]
};
function openReader() { renderReader(); $('readerDialog').showModal(); }
function renderReader() {
  const practice = PRACTICES[activePractice];
  const language = $('readerLanguage').value;
  $('readerHeading').textContent = practice.title;
  $('readerText').replaceChildren();
  $('readerLanguage').disabled=Boolean(practice.custom);
  $('readerText').lang = practice.custom ? '' : language === 'te' ? 'te' : language === 'sa' ? 'sa' : 'en';
  const sections = activePractice === 'ganapati' ? (mantraText[language] || mantraText.en) : [[practice.title, practice.custom ? (practice.en || 'Open your reading sheets below, or listen to your recording.') : (practice[language] || practice.en)]];
  for (const [title, text] of sections) {
    const h = document.createElement('h3'), p = document.createElement('p');
    h.textContent = title; p.textContent = text; $('readerText').append(h, p);
  }
  if(practice.custom && practice.meaning) {const p=document.createElement('p');p.textContent=practice.meaning;$('readerText').appendChild(p);}
  renderReaderAttachments();
  if (practice.source) {
    const link = document.createElement('a');
    link.href = practice.source; link.target = '_blank'; link.rel = 'noopener noreferrer';
    link.textContent = 'Mantra text reference ↗'; link.className = 'mantra-source';
    $('readerText').appendChild(link);
  }
}
function setReadingSize(size) {
  size = Math.min(32, Math.max(16, Number(size) || 20));
  document.documentElement.style.setProperty('--reading-size', size+'px');
  $('readingSize').value = $('readerSize').value = size;
  preferences.readingSize = size;
  try { localStorage.setItem('vratha_preferences', JSON.stringify(preferences)); } catch (_) {}
}

// Legacy overlays get the same keyboard containment and return-focus behavior as dialogs.
const overlays = [...document.querySelectorAll('.modal-overlay, .quote-overlay')];
let activeOverlay = null, overlayReturn = null;
const inertBefore = new Map();
function visibleFocusables(element) {
  return [...element.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length);
}
function syncOverlayAccessibility() {
  const open = overlays.filter(el => getComputedStyle(el).display !== 'none').at(-1) || null;
  if (open === activeOverlay) return;
  for (const [el, value] of inertBefore) el.inert = value;
  inertBefore.clear();
  if (!open) { activeOverlay = null; if (overlayReturn?.isConnected) overlayReturn.focus({preventScroll:true}); overlayReturn = null; return; }
  if (!activeOverlay) overlayReturn = document.activeElement;
  activeOverlay = open;
  open.setAttribute('role','dialog'); open.setAttribute('aria-modal','true'); open.tabIndex = -1;
  const heading = open.querySelector('h2, .quote-day-label');
  if (heading) { if (!heading.id) heading.id = open.id+'Title'; open.setAttribute('aria-labelledby',heading.id); }
  for (const sibling of document.body.children) {
    if (sibling === open || sibling.contains(open) || sibling.matches('script, link, #toast, #practiceAnnouncement')) continue;
    inertBefore.set(sibling,sibling.inert); sibling.inert = true;
  }
  (visibleFocusables(open)[0] || open).focus();
}
const overlayObserver = new MutationObserver(syncOverlayAccessibility);
overlays.forEach(el => overlayObserver.observe(el,{attributes:true,attributeFilter:['class','style']}));
document.addEventListener('keydown', event => {
  if (!activeOverlay) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (activeOverlay.id === 'welcomeModal') closeWelcomeModal();
    else if (activeOverlay.id === 'resetModal') closeResetModal();
    else if (activeOverlay.id === 'onboardModal') dismissOnboard(false);
    else closeGitaQuote();
  }
  if (event.key === 'Tab') {
    const items=visibleFocusables(activeOverlay), first=items[0], last=items.at(-1);
    if (!items.length) { event.preventDefault(); activeOverlay.focus(); }
    else if (event.shiftKey && (document.activeElement === first || !activeOverlay.contains(document.activeElement))) {event.preventDefault();last.focus();}
    else if (!event.shiftKey && (document.activeElement === last || !activeOverlay.contains(document.activeElement))) {event.preventDefault();first.focus();}
  }
});

function configurePractice() {
  applyPracticeConfig();
  detailDay = getDayForToday() || 1;
  const practice = PRACTICES[activePractice], ganapati = activePractice === 'ganapati';
  refreshPracticePicker();
  $('practiceSelect').value = activePractice;
  document.title = practice.name + ' · Naam Jaap & Vratha Tracker';
  $('mantraPreview').hidden = ganapati;
  $('mantraScript').textContent = practice.sa || '';
  $('mantraTransliteration').dir=practice.custom?'auto':'ltr';
  $('mantraTransliteration').textContent = practice.en || (practice.custom ? 'Your personal practice. Open the reader for your sheets, or listen to your recording.' : '');
  $('focusMantra').textContent = practice.en || '';
  $('focusMantra').hidden = ganapati;
  const version = ganapati && preferences.version === '2' ? '2' : '1';
  $('audioVersion').replaceChildren();
  const first = new Option(ganapati ? 'Manthram V1' : practice.custom ? 'Your recording' : 'Spoken guide', '1');
  $('audioVersion').add(first);
  if (ganapati) $('audioVersion').add(new Option('Manthram V2','2'));
  $('audioVersion').value = version;
  [1,2].forEach(n => {
    const audio = $('manthramAudio'+n);
    audio.pause();
    if(practice.audio)audio.src = n === 2 ? (practice.audio2 || practice.audio) : practice.audio;
    else audio.removeAttribute('src');
    audio.load();
  });
  $('audioHint').textContent = ganapati ? 'Each finished recording adds one chant to today’s count.' : 'Synthetic spoken guide · Each full mantra adds one chant. Not a traditional sung recitation.';
  configurePracticeMedia();
  $('readerLanguage').querySelector('option[value="sa"]').disabled = ganapati;
  if (ganapati && $('readerLanguage').value === 'sa') $('readerLanguage').value = 'en';
  document.querySelector('.about-section').hidden = !ganapati;
  document.querySelector('.quick-links').hidden = !ganapati;
  document.querySelectorAll('.manthram-image-panel').forEach(panel => { panel.hidden = !ganapati; panel.classList.remove('open'); });
  $('qImgBtn').classList.remove('active'); $('qEngBtn').classList.remove('active');
  $('startDate').value = state.d1?.date || todayISO();
  $('dailyNote').value = ''; noteDay = null; noteDirty = false;
  $('sessionTime').textContent = 'Session · 00:00';
  renderReader();
}
async function switchPractice(id, options = {}) {
  if (!Object.hasOwn(PRACTICES,id)) return;
  if (noteDirty && !options.restoring) await saveDailyNote();
  stopGuidedAudio();
  $('practiceSelect').disabled = true;
  try {
    await practiceLock(() => {
      activePractice = id;
      LS_KEY = practiceStorageKey(id); COOKIE_KEY = practiceCookieKey(id);
      try { sessionStorage.setItem('vratha_active_practice',id); } catch (_) {}
      state = loadState();
      applyPracticeConfig();
      detailDay = getDayForToday() || 1;
      undoEntry = null; sessionStarted = null; editingDay = null;
      document.querySelectorAll('.practice-dialog[open]').forEach(dialog => dialog.close());
      closeGitaQuote();
      configurePractice(); buildCards(); renderCompanion();
      $('dayDetails').open = false;
      announce(PRACTICES[id].name + ' practice selected');
    });
  } finally { $('practiceSelect').disabled = false; }
}

let settingsSignature = '';
function renderGoalSettings() {
  const config=getPracticeConfig(state), signature=activePractice+JSON.stringify(config);
  if(signature!==settingsSignature) {
    settingsSignature=signature;
    $('configChants').value=config.chants; $('configDays').value=config.days; $('configTemple').checked=config.templeRequired;
    $('configMessage').textContent='';
  }
  $('configPracticeName').textContent=PRACTICES[activePractice].name;
  $('goalProjection').textContent=(config.chants*config.days).toLocaleString()+' chants across '+config.days+' days.';
  $('journeyHeading').textContent='Your '+DAYS+'-day journey';
  document.querySelector('.header-title p').textContent=DAYS+'-Day Practice · '+CHANTS+' Chantings Daily';
  document.querySelectorAll('.chant-ring small').forEach(el=>el.textContent='of '+CHANTS+' chants');
  // At larger goals, use a smooth ring instead of indistinguishable bead segments.
  $('focusTap').classList.toggle('smooth-ring',CHANTS>108);
  $('focusTap').style.setProperty('--bead-angle',(360/CHANTS)+'deg');
  $('focusTap').style.setProperty('--bead-fill',(360/CHANTS*.88)+'deg');
}
$('practiceConfigForm').addEventListener('submit', async event=>{
  event.preventDefault();
  const config={chants:Number($('configChants').value),days:Number($('configDays').value),templeRequired:$('configTemple').checked};
  if(!validConfig(config)) { $('configMessage').textContent='Choose 1–1008 chants and 1–365 days.'; return; }
  const practice=activePractice;
  stopGuidedAudio();
  await practiceLock(()=>{
    if(practice!==activePractice)return;
    syncTrackerState();
    const previous=getPracticeConfig(state);
    for(let d=1;d<=previous.days;d++) {
      const day=state['d'+d];
      if(!day)continue;
      const count=day.marks.filter(Boolean).length;
      if(count>config.chants || (d>config.days&&(count||day.temple||day.note))) {
        $('configMessage').textContent='These settings would remove recorded progress. Use a larger target or archive this cycle before changing it.';
        return;
      }
    }
    for(let d=1;d<=config.days;d++) {
      const key='d'+d, day=state[key];
      if(day) {
        // Preserve checked positions where possible; compact only if the target shrinks.
        const count=day.marks.filter(Boolean).length;
        day.marks=config.chants<day.marks.length?Array.from({length:config.chants},(_,i)=>i<count):day.marks.concat(Array(config.chants-day.marks.length).fill(false));
      } else {
        const prev=state['d'+(d-1)]?.date;
        const date=prev?serialDate((parseInt(dateSerial(prev),36)+1).toString(36)):'';
        state[key]={date,marks:Array(config.chants).fill(false),temple:false};
      }
    }
    for(let d=config.days+1;d<=previous.days;d++) delete state['d'+d];
    state.config=config;
    undoEntry=null;
    applyPracticeConfig();saveState(state);buildCards();
    $('configMessage').textContent='Goals saved for '+PRACTICES[activePractice].name+'. Your recorded counts have been kept.';
    announce('Practice goals saved');
  });
});
function renderInsights() {
  const config=getPracticeConfig(state);
  const entries=Array.from({length:DAYS},(_,i)=>state['d'+(i+1)]);
  const archived=(state.archives||[]).flatMap(a=>Object.values(a.days));
  const total=[...entries,...archived].reduce((sum,day)=>sum+day.marks.filter(Boolean).length,0);
  const completedDates=new Set(entries.filter(day=>dayIsComplete(day,config)&&day.date).map(day=>dateSerial(day.date)));
  let serial=parseInt(dateSerial(todayISO()),36), streak=0;
  if(!completedDates.has(serial.toString(36)))serial--;
  while(completedDates.has(serial.toString(36))){streak++;serial--;}
  $('practiceInsights').replaceChildren();
  for(const [value,label] of [[total.toLocaleString(),'Recorded chants · all cycles'],[streak,'Current streak · days'],[(config.days*config.chants).toLocaleString(),'Current cycle target']]) {
    const box=document.createElement('div'),number=document.createElement('strong'),caption=document.createElement('span');
    number.textContent=value;caption.textContent=label;box.append(number,caption);$('practiceInsights').appendChild(box);
  }
  $('weeklyHistory').replaceChildren();
  const today=parseInt(dateSerial(todayISO()),36);
  for(let offset=6;offset>=0;offset--) {
    const date=serialDate((today-offset).toString(36));
    const count=entries.filter(day=>day.date===date).reduce((sum,day)=>sum+day.marks.filter(Boolean).length,0);
    const item=document.createElement('div'),bar=document.createElement('span'),label=document.createElement('small'),value=document.createElement('strong');
    item.className='history-day';item.setAttribute('aria-label',fmtDate(date)+': '+count+' chants');
    bar.className='history-bar';bar.style.setProperty('--fill',Math.min(100,count/CHANTS*100)+'%');bar.setAttribute('aria-hidden','true');
    label.textContent=new Date(date+'T12:00').toLocaleDateString(undefined,{weekday:'short'});value.textContent=count;
    item.append(value,bar,label);$('weeklyHistory').appendChild(item);
  }
}

// Retain any legacy audio progress once; daily marks are authoritative thereafter.
if (activePractice === 'ganapati' && !state.sharedCountMigrated) {
  try {
    const legacy = JSON.parse(localStorage.getItem('vratha_audio_counts_v1'));
    const d = getDayForToday();
    if (d && legacy?.date === todayISO() && Array.isArray(legacy.counts)) {
      const count = Math.min(CHANTS, Math.max(dayCount(d), ...legacy.counts.filter(Number.isInteger)));
      for (let i=0;i<count;i++) state['d'+d].marks[i] = true;
    }
  } catch (_) {}
  state.sharedCountMigrated = true;
  saveState(state);
  try { localStorage.removeItem('vratha_audio_counts_v1'); } catch (_) {}
}
$('audioVersion').value = ['1','2'].includes(preferences.version) ? preferences.version : '1';
$('audioSpeed').value = ['0.75','1','1.25'].includes(preferences.speed) ? preferences.speed : '1';
$('audioGap').value = ['0','2','5','10'].includes(preferences.gap) ? preferences.gap : '0';
$('completionSound').checked = Boolean(preferences.chime);
$('hapticFeedback').checked = Boolean(preferences.haptics);
setReadingSize(preferences.readingSize || 20);
saveAudioPreferences();
$('nextCycleDate').value = todayISO();
if (!$('startDate').value) $('startDate').value = todayISO();
$('todayDashboard').insertBefore($('startDateRow'), document.querySelector('.today-layout'));
companionReady = true;
configurePractice();
buildCards();
renderCompanion();
syncOverlayAccessibility();
setInterval(() => {
  if (undoEntry && undoEntry.expires < Date.now()) { undoEntry = null; renderCompanion(); }
  if (sessionStarted) {
    const seconds = Math.floor((Date.now()-sessionStarted)/1000);
    $('sessionTime').textContent = 'Session · '+String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
  }
  if (audioRun && audioRun.date !== todayISO()) stopGuidedAudio();
},1000);
