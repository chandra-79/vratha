// Traditional mantra texts; source links are shown in the reader.
const PRACTICES = {
  ganapati: {name:'Ganapati',title:'Ganapati Manthram',audio:'Manthram.mpeg',audio2:'Manthram_Variation.mp3',source:null},
  rama: {name:'Rama',title:'Rama Naam Jaap',sa:'ॐ श्री रामाय नमः।',te:'ఓం శ్రీ రామాయ నమః।',en:'Om Shri Ramaya Namah.',meaning:'Salutations to Shri Rama.',audio:'audio/rama.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  krishna: {name:'Krishna',title:'Hare Krishna Maha Mantra',sa:'हरे कृष्ण हरे कृष्ण\nकृष्ण कृष्ण हरे हरे।\nहरे राम हरे राम\nराम राम हरे हरे॥',te:'హరే కృష్ణ హరే కృష్ణ\nకృష్ణ కృష్ణ హరే హరే।\nహరే రామ హరే రామ\nరామ రామ హరే హరే॥',en:'Hare Krishna Hare Krishna\nKrishna Krishna Hare Hare.\nHare Rama Hare Rama\nRama Rama Hare Hare.',meaning:'The Maha Mantra: a call to the divine names of Krishna and Rama. Some traditions begin with the Hare Rama line; both orders are chanted.',audio:'audio/krishna.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  hanuman: {name:'Hanuman',title:'Hanuman Naam Jaap',sa:'ॐ श्री हनुमते नमः।',te:'ఓం శ్రీ హనుమతే నమః।',en:'Om Shri Hanumate Namah.',meaning:'Salutations to Shri Hanuman.',audio:'audio/hanuman.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  shiva: {name:'Shiva',title:'Shiva Naam Jaap',sa:'ॐ नमः शिवाय।',te:'ఓం నమః శివాయ।',en:'Om Namah Shivaya.',meaning:'Salutations to Shiva.',audio:'audio/shiva.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  mrityunjaya: {name:'Maha Mrityunjaya',title:'Maha Mrityunjaya Mantra',sa:'ॐ त्र्यम्बकं यजामहे\nसुगन्धिं पुष्टिवर्धनम्।\nउर्वारुकमिव बन्धनान्\nमृत्योर्मुक्षीय मामृतात्॥',te:'ఓం త్ర్యంబకం యజామహే\nసుగంధిం పుష్టివర్ధనమ్।\nఉర్వారుకమివ బంధనాన్\nమృత్యోర్ముక్షీయ మామృతాత్॥',en:'Om Tryambakam yajamahe\nsugandhim pushti-vardhanam.\nUrvarukam iva bandhanan\nmrityor mukshiya mamritat.',meaning:'We worship the three-eyed Shiva, fragrant, who nourishes all. As a ripe cucumber is released from its stem, may we be freed from death, not from immortality. Chanted for health and healing.',audio:'audio/mrityunjaya.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  narayana: {name:'Narayana',title:'Narayana Ashtakshari',sa:'ॐ नमो नारायणाय।',te:'ఓం నమో నారాయణాయ।',en:'Om Namo Narayanaya.',meaning:'Salutations to Narayana, the all-pervading Vishnu. The eight-syllable (Ashtakshara) mantra.',audio:'audio/narayana.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  gayatri: {name:'Gayatri Matha',title:'Gayatri Mantra',sa:'ॐ भूर्भुवः स्वः।\nतत्सवितुर्वरेण्यं।\nभर्गो देवस्य धीमहि।\nधियो यो नः प्रचोदयात्॥',te:'ఓం భూర్భువః స్వః।\nతత్సవితుర్వరేణ్యం।\nభర్గో దేవస్య ధీమహి।\nధియో యో నః ప్రచోదయాత్॥',en:'Om Bhur Bhuvah Svah.\nTat Savitur Varenyam.\nBhargo Devasya Dhimahi.\nDhiyo Yo Nah Prachodayat.',meaning:'A prayer meditating on the divine radiance of Savitr and asking for illumination of the intellect.',audio:'audio/gayatri.m4a',source:'https://www.sathyasai.org/gayatri-mantra'},
  durga: {name:'Durga Devi',title:'Durga Devi Naam Jaap',sa:'ॐ श्री दुर्गायै नमः।',te:'ఓం శ్రీ దుర్గాయై నమః।',en:'Om Shri Durgayai Namah.',meaning:'Salutations to Shri Durga.',audio:'audio/durga.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  lakshmi: {name:'Lakshmi Devi',title:'Lakshmi Naam Jaap',sa:'ॐ श्री महालक्ष्म्यै नमः।',te:'ఓం శ్రీ మహాలక్ష్మ్యై నమః।',en:'Om Shri Maha-Lakshmyai Namah.',meaning:'Salutations to Shri Mahalakshmi, goddess of prosperity and grace.',audio:'audio/lakshmi.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  saraswati: {name:'Saraswati Devi',title:'Saraswati Naam Jaap',sa:'ॐ श्री सरस्वत्यै नमः।',te:'ఓం శ్రీ సరస్వత్యై నమః।',en:'Om Shri Sarasvatyai Namah.',meaning:'Salutations to Shri Saraswati, goddess of learning, speech and the arts.',audio:'audio/saraswati.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  subrahmanya: {name:'Subrahmanya',title:'Subrahmanya Naam Jaap',sa:'ॐ श्री शरवणभवाय नमः।',te:'ఓం శ్రీ శరవణభవాయ నమః।',en:'Om Shri Saravanabhavaya Namah.',meaning:'Salutations to Subrahmanya (Kartikeya, Murugan), Saravanabhava — born of the reed forest.',audio:'audio/subrahmanya.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'}
};
const CUSTOM_PREFIX = 'vratha_custom_';
function validCustomPractice(value) {
  return value && /^custom_[a-z0-9-]{8,64}$/.test(value.id) && value.custom === true &&
    typeof value.name === 'string' && value.name.trim().length > 0 && value.name.length <= 80 && !/[\u0000-\u001f\u007f]/.test(value.name) &&
    typeof value.en === 'string' && value.en.length <= 20000 &&
    typeof value.meaning === 'string' && value.meaning.length <= 2000 &&
    Number.isSafeInteger(value.revision) && value.revision > 0;
}
function customDefinition(value) {
  return {id:value.id, custom:true, name:value.name.trim(), title:value.name.trim(), en:value.en,
    meaning:value.meaning, revision:value.revision};
}
function refreshCustomRegistry() {
  const found = {};
  try {
    for (let i=0;i<localStorage.length;i++) {
      const key=localStorage.key(i);
      if (!key.startsWith(CUSTOM_PREFIX)) continue;
      try {
        const entry=JSON.parse(localStorage.getItem(key));
        if(validCustomPractice(entry) && key===CUSTOM_PREFIX+entry.id) found[entry.id]=customDefinition(entry);
      } catch (_) {}
    }
  } catch (_) { return; }
  Object.keys(PRACTICES).filter(id=>PRACTICES[id].custom).forEach(id=>delete PRACTICES[id]);
  Object.assign(PRACTICES,found);
}
refreshCustomRegistry();
let activePractice = 'ganapati';
// Selection order: ?practice=<id> in the URL, then this tab's last choice.
// The URL wins so a shared link and a home-screen shortcut both land on the
// practice they name, regardless of what this tab was showing before.
function practiceFromUrl() {
  try {
    const id = new URLSearchParams(location.search).get('practice');
    return id && Object.hasOwn(PRACTICES, id) ? id : null;
  } catch (_) { return null; }
}
try { const saved = sessionStorage.getItem('vratha_active_practice'); if (Object.hasOwn(PRACTICES,saved)) activePractice=saved; } catch (_) {}
{ const fromUrl = practiceFromUrl(); if (fromUrl) activePractice = fromUrl; }
function practiceStorageKey(id) { return id === 'ganapati' ? 'ganapatiVratha_v2' : 'vratha_practice_'+id+'_v1'; }
function practiceCookieKey(id) { return id === 'ganapati' ? 'gvt2' : 'gvt_'+id; }

const DEFAULT_CONFIG = Object.freeze({ chants: 21, days: 48, templeRequired: true });
function validConfig(config) {
  return config && Number.isInteger(config.chants) && config.chants >= 1 && config.chants <= 1008 && Number.isInteger(config.days) && config.days >= 1 && config.days <= 365 && typeof config.templeRequired === 'boolean';
}
function getPracticeConfig(st) { return validConfig(st?.config) ? st.config : {...DEFAULT_CONFIG}; }
function dayIsComplete(day, config) {
  return Boolean(day && day.marks.filter(Boolean).length >= config.chants && (!config.templeRequired || day.temple));
}
function dateSerial(iso) { return iso ? Math.floor(Date.parse(iso+'T00:00:00Z') / 86400000).toString(36) : ''; }
function serialDate(serial) { return serial ? new Date(parseInt(serial,36)*86400000).toISOString().slice(0,10) : ''; }
// A bounded ASCII record keeps up to 365 daily statuses in a single cookie.
// Notes, archives and individual mark positions stay in the full local backup.
function encodePracticeCookie(st) {
  const config = getPracticeConfig(st);
  const records = [];
  for (let d=1;d<=config.days;d++) {
    const day = st['d'+d];
    records.push(day ? dateSerial(day.date)+'.'+(day.marks.filter(Boolean).length*2+Number(day.temple)).toString(36) : '.0');
  }
  return ['v3',config.chants,config.days,Number(config.templeRequired),Number(Boolean(st.datesFixed)),Number(st.updatedAt||0).toString(36),encodeURIComponent(st.cycleId||'').slice(0,100),records.join('_')].join('~');
}
function decodePracticeCookie(value) {
  if (!value.startsWith('v3~')) return JSON.parse(decodeURIComponent(value));
  const [version,chants,days,temple,fixed,updated,cycle,records] = value.split('~');
  const config = {chants:Number(chants),days:Number(days),templeRequired:temple==='1'};
  if (!validConfig(config)) throw new Error('Invalid cookie settings');
  const entries=records.split('_');
  if(entries.length!==config.days) throw new Error('Incomplete cookie');
  const st={config,datesFixed:fixed==='1',updatedAt:parseInt(updated,36),cycleId:decodeURIComponent(cycle),sharedCountMigrated:true,practiceId:activePractice};
  entries.forEach((entry,i)=>{
    const [date,bits]=entry.split('.'), n=parseInt(bits,36), count=Math.floor(n/2);
    if(!Number.isInteger(n)||count<0||count>config.chants)throw new Error('Invalid cookie count');
    st['d'+(i+1)]={date:serialDate(date),marks:Array.from({length:config.chants},(_,j)=>j<count),temple:Boolean(n%2)};
  });
  return st;
}
function writePracticeCookie(st) {
  const value=encodePracticeCookie(st);
  if(value.length>3800) return false;
  const expires=new Date(Date.now()+365*86400000).toUTCString();
  document.cookie=COOKIE_KEY+'='+value+'; expires='+expires+'; path=/; SameSite=Lax'+(location.protocol==='https:'?'; Secure':'');
  return document.cookie.split('; ').some(part=>part===COOKIE_KEY+'='+value);
}

const practiceUpdates = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('vratha-status') : null;
