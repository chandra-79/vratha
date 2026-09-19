// Traditional mantra texts; source links are shown in the reader.
const PRACTICES = {
  ganapati: {name:'Ganapati',title:'Ganapati Manthram',audio:'Manthram.mpeg',audio2:'Manthram_Variation.mp3',source:null},
  rama: {name:'Rama',title:'Rama Naam Jaap',sa:'ॐ श्री रामाय नमः।',te:'ఓం శ్రీ రామాయ నమః।',en:'Om Shri Ramaya Namah.',meaning:'Salutations to Shri Rama.',audio:'audio/rama.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  hanuman: {name:'Hanuman',title:'Hanuman Naam Jaap',sa:'ॐ श्री हनुमते नमः।',te:'ఓం శ్రీ హనుమతే నమః।',en:'Om Shri Hanumate Namah.',meaning:'Salutations to Shri Hanuman.',audio:'audio/hanuman.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  shiva: {name:'Shiva',title:'Shiva Naam Jaap',sa:'ॐ नमः शिवाय।',te:'ఓం నమః శివాయ।',en:'Om Namah Shivaya.',meaning:'Salutations to Shiva.',audio:'audio/shiva.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'},
  gayatri: {name:'Gayatri Matha',title:'Gayatri Mantra',sa:'ॐ भूर्भुवः स्वः।\nतत्सवितुर्वरेण्यं।\nभर्गो देवस्य धीमहि।\nधियो यो नः प्रचोदयात्॥',te:'ఓం భూర్భువః స్వః।\nతత్సవితుర్వరేణ్యం।\nభర్గో దేవస్య ధీమహి।\nధియో యో నః ప్రచోదయాత్॥',en:'Om Bhur Bhuvah Svah.\nTat Savitur Varenyam.\nBhargo Devasya Dhimahi.\nDhiyo Yo Nah Prachodayat.',meaning:'A prayer meditating on the divine radiance of Savitr and asking for illumination of the intellect.',audio:'audio/gayatri.m4a',source:'https://www.sathyasai.org/gayatri-mantra'},
  durga: {name:'Durga Devi',title:'Durga Devi Naam Jaap',sa:'ॐ श्री दुर्गायै नमः।',te:'ఓం శ్రీ దుర్గాయై నమః।',en:'Om Shri Durgayai Namah.',meaning:'Salutations to Shri Durga.',audio:'audio/durga.m4a',source:'https://www.dlshq.org/teachings/japa-yoga/'}
};
let activePractice = 'ganapati';
try { const saved = sessionStorage.getItem('vratha_active_practice'); if (Object.hasOwn(PRACTICES,saved)) activePractice=saved; } catch (_) {}
function practiceStorageKey(id) { return id === 'ganapati' ? 'ganapatiVratha_v2' : 'vratha_practice_'+id+'_v1'; }
function practiceCookieKey(id) { return id === 'ganapati' ? 'gvt2' : 'gvt_'+id; }
