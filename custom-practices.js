/* Personal media stays in IndexedDB; only small category definitions use localStorage. */
const MEDIA_LIMIT = 50 * 1024 * 1024;
let mediaDatabase;
function openMediaDatabase() {
  if (!mediaDatabase) mediaDatabase = new Promise((resolve,reject)=>{
    const request=indexedDB.open('vratha-personal-media',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('practices');
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>{mediaDatabase=null;reject(new Error('Media storage is unavailable in this browser.'));};
  });
  return mediaDatabase;
}
async function mediaStore(id, value, remove=false) {
  const db=await openMediaDatabase();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('practices',value!==undefined||remove?'readwrite':'readonly');
    const store=tx.objectStore('practices');
    const request=remove?store.delete(id):value!==undefined?store.put(value,id):store.get(id);
    tx.oncomplete=()=>resolve(request.result);
    tx.onerror=tx.onabort=()=>reject(new Error('Could not save uploads. Free browser storage and try again.'));
  });
}
function emptyMedia() { return {references:[],audio:null,cover:null}; }
async function checkedFile(file, kind) {
  const ext=file.name.split('.').pop().toLowerCase();
  const types={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',pdf:'application/pdf',mp3:'audio/mpeg',wav:'audio/wav',m4a:'audio/mp4',aac:'audio/aac',ogg:'audio/ogg',webm:'audio/webm'};
  const allowed=kind==='audio'?['mp3','wav','m4a','aac','ogg','webm']:kind==='cover'?['png','jpg','jpeg','webp']:['png','jpg','jpeg','webp','pdf'];
  if(!allowed.includes(ext)) throw new Error('Unsupported '+kind+' file. Use the formats listed beside the upload field.');
  const limit=(kind==='audio'?25:kind==='cover'?5:10)*1024*1024;
  if(!file.size||file.size>limit) throw new Error(file.name+': choose a nonempty file under '+limit/1024/1024+' MB.');
  const bytes=new Uint8Array(await file.slice(0,16).arrayBuffer());
  const ascii=String.fromCharCode(...bytes);
  const matches={png:ascii.startsWith('\x89PNG\r\n\x1a\n'),jpg:bytes[0]===255&&bytes[1]===216,jpeg:bytes[0]===255&&bytes[1]===216,webp:ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP',pdf:ascii.startsWith('%PDF-'),wav:ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WAVE',m4a:ascii.slice(4,8)==='ftyp',mp3:ascii.startsWith('ID3')||(bytes[0]===255&&(bytes[1]&224)===224),aac:bytes[0]===255&&(bytes[1]&240)===240,ogg:ascii.startsWith('OggS'),webm:bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163};
  if(!matches[ext]) throw new Error(file.name+': the file contents do not match its format.');
  return {name:file.name.slice(0,160),type:types[ext],blob:new Blob([file],{type:types[ext]})};
}
function mediaEntries(media) { return [...media.references,media.audio,media.cover].filter(Boolean); }
function validateMediaSize(media) {
  if(media.references.length>6||mediaEntries(media).reduce((sum,item)=>sum+item.blob.size,0)>MEDIA_LIMIT) throw new Error('Use up to 6 reading sheets and no more than 50 MB of uploads per practice.');
}
function refreshPracticePicker() {
  const select=document.getElementById('practiceSelect');
  select.replaceChildren();
  for(const [id,practice] of Object.entries(PRACTICES)) select.add(new Option(practice.name+(practice.custom?' · Personal':''),id));
  select.value=activePractice;
}
let customEditId=null, customEditRevision=null, editorLoading=false;
async function openCustomEditor(edit=false) {
  const form=document.getElementById('customPracticeForm');
  form.reset(); customEditId=edit&&PRACTICES[activePractice].custom?activePractice:null;
  const practice=customEditId?PRACTICES[customEditId]:null;
  customEditRevision=practice?.revision;
  document.getElementById('customHeading').textContent=practice?'Edit personal practice':'Create your own practice';
  document.getElementById('customName').value=practice?.name||'';
  document.getElementById('customText').value=practice?.en||'';
  document.getElementById('customMeaning').value=practice?.meaning||'';
  document.getElementById('customStart').value=todayISO();
  document.getElementById('customGoals').hidden=Boolean(practice);
  document.getElementById('customEditGoalsHint').hidden=!practice;
  document.getElementById('customDelete').hidden=!practice;
  document.getElementById('customError').textContent='';
  document.getElementById('existingUploads').textContent='';
  document.getElementById('customSubmit').disabled=true; editorLoading=true;
  document.getElementById('customDialog').showModal();
  try {
    const media=practice?await mediaStore(customEditId)||emptyMedia():emptyMedia();
    document.getElementById('existingUploads').textContent=mediaEntries(media).map(item=>item.name).join(' · ')||'No uploads yet. Text-only practices work too.';
  } catch(error) {document.getElementById('customError').textContent=error.message;}
  finally {editorLoading=false;document.getElementById('customSubmit').disabled=false;}
}
async function saveCustomPractice(event) {
  event.preventDefault();
  if(editorLoading)return;
  const button=document.getElementById('customSubmit'); button.disabled=true;
  const id=customEditId||'custom_'+crypto.randomUUID();
  try {
    const references=[...document.getElementById('customReferences').files];
    if(references.length>6)throw new Error('Choose up to 6 reading sheets.');
    const replacements={};
    if(references.length) replacements.references=await Promise.all(references.map(file=>checkedFile(file,'reference')));
    for(const kind of ['audio','cover']) {
      const file=document.getElementById('custom'+(kind==='audio'?'Audio':'Cover')).files[0];
      if(file) replacements[kind]=await checkedFile(file,kind);
    }
    const definition=customDefinition({id,custom:true,name:document.getElementById('customName').value,en:document.getElementById('customText').value.trim(),meaning:document.getElementById('customMeaning').value.trim(),revision:Date.now()});
    if(!validCustomPractice(definition))throw new Error('Enter a category name of 1–80 characters and mantra text of up to 20,000 characters.');
    const config={chants:Number(document.getElementById('customChants').value),days:Number(document.getElementById('customDays').value),templeRequired:document.getElementById('customTemple').checked};
    if(!validConfig(config))throw new Error('Choose 1–1008 chants and 1–365 days.');
    await practiceLock(async()=>{
      refreshCustomRegistry();
      if(customEditId&&PRACTICES[id]?.revision!==customEditRevision)throw new Error('This category changed in another tab. Close this editor and reopen it to see the latest version.');
      const previous=await mediaStore(id)||emptyMedia();
      const media={...previous};
      if(document.getElementById('removeReferences').checked)media.references=[];
      if(document.getElementById('removeAudio').checked)media.audio=null;
      if(document.getElementById('removeCover').checked)media.cover=null;
      Object.assign(media,replacements); validateMediaSize(media);
      if(!definition.en&&!media.references.length&&!media.audio)throw new Error('Add mantra text, a reading sheet, or an audio recording.');
      await mediaStore(id,media);
      try {localStorage.setItem(CUSTOM_PREFIX+id,JSON.stringify(definition));}
      catch(error) {await mediaStore(id,previous);throw new Error('Browser storage is full or disabled. The category was not changed.');}
      PRACTICES[id]=definition;
      if(!customEditId) {
        try { localStorage.setItem(practiceStorageKey(id),JSON.stringify({config,sharedCountMigrated:true,practiceId:id})); }
        catch(error) {localStorage.removeItem(CUSTOM_PREFIX+id);delete PRACTICES[id];await mediaStore(id,undefined,true);throw new Error('Could not save this practice. Free browser storage and try again.');}
      }
    });
    const creating=!customEditId, start=document.getElementById('customStart').value;
    document.getElementById('customDialog').close();refreshPracticePicker();
    await switchPractice(id);
    if(creating) {document.getElementById('startDate').value=start;applyStartDate();}
    showToast('Personal practice saved. Download a backup to keep a separate copy.');
    navigator.storage?.persist?.().catch(()=>{});
  } catch(error) {document.getElementById('customError').textContent=error.message;}
  finally {button.disabled=false;}
}
async function deleteCustomPractice() {
  const id=customEditId;
  if(!id||!PRACTICES[id]?.custom)return;
  if(!confirm('Delete “'+PRACTICES[id].name+'”, its uploads, progress and archives from this browser? Download a backup first if you want to keep them.'))return;
  try {
    stopGuidedAudio();
    await practiceLock(async()=>{
      await mediaStore(id,undefined,true);
      localStorage.removeItem(CUSTOM_PREFIX+id);localStorage.removeItem(practiceStorageKey(id));
      document.cookie=practiceCookieKey(id)+'=; max-age=0; path=/';
      delete PRACTICES[id];
    });
    document.getElementById('customDialog').close();refreshPracticePicker();await switchPractice('ganapati');
    showToast('Personal practice deleted.');
  } catch(error) {document.getElementById('customError').textContent=error.message;}
}
let mediaGeneration=0, mediaURLs=[], currentPracticeMedia=emptyMedia();
let practiceAudioReady=true;
async function configurePracticeMedia() {
  const generation=++mediaGeneration,id=activePractice,practice=PRACTICES[id];
  mediaURLs.forEach(url=>URL.revokeObjectURL(url));mediaURLs=[];currentPracticeMedia=emptyMedia();
  document.getElementById('editCustomPractice').hidden=!practice.custom;
  document.getElementById('practiceArt').src=practice.custom?'assets/naam-jaap-logo.png':'assets/'+id+'.svg';
  document.getElementById('practiceArt').alt='';
  document.getElementById('readerAttachments').replaceChildren();
  practiceAudioReady=!practice.custom;
  if(!practice.custom)return;
  document.getElementById('audioHint').textContent='Loading your saved uploads…';
  try {
    const media=await mediaStore(id)||emptyMedia();
    if(generation!==mediaGeneration||id!==activePractice)return;
    currentPracticeMedia=media;
    for(const item of mediaEntries(media)) {item.url=URL.createObjectURL(item.blob);mediaURLs.push(item.url);}
    if(media.cover) document.getElementById('practiceArt').src=media.cover.url;
    if(media.audio) {
      document.getElementById('manthramAudio1').src=media.audio.url;
      document.getElementById('manthramAudio1').load(); practiceAudioReady=true;
    }
    document.getElementById('audioHint').textContent=media.audio?'Your recording · One complete playback counts as one chant.':'No audio attached. Use manual counting or add a recording in Edit practice.';
    renderReaderAttachments();renderAudioControls();
  } catch(error) {
    if(generation!==mediaGeneration)return;
    document.getElementById('audioHint').textContent=error.message+' Manual counting is available.';
    renderAudioControls();
  }
}
function renderReaderAttachments() {
  const container=document.getElementById('readerAttachments');container.replaceChildren();
  if(!PRACTICES[activePractice].custom)return;
  for(const item of currentPracticeMedia.references) {
    const figure=document.createElement('figure');
    const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener';
    if(item.type.startsWith('image/')) {const image=document.createElement('img');image.src=item.url;image.alt=item.name;image.loading='lazy';link.append(image);}
    const caption=document.createElement('span');caption.textContent=(item.type==='application/pdf'?'Open PDF: ':'Open image: ')+item.name+' ↗';link.append(caption);
    const download=document.createElement('a');download.href=item.url;download.download=item.name;download.textContent='Download';download.className='attachment-download';
    figure.append(link,download);container.append(figure);
  }
}
function fileAsDataURL(blob) {
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read an attachment.'));reader.readAsDataURL(blob);});
}
async function portablePracticeBackup(data,id) {
  const snapshot=structuredClone(data);snapshot.practiceId=id;
  if(!PRACTICES[id]?.custom)return snapshot;
  snapshot.customPractice=customDefinition(PRACTICES[id]);
  const media=await mediaStore(id)||emptyMedia();
  async function encode(item){return item?{name:item.name,data:await fileAsDataURL(item.blob)}:null;}
  snapshot.media={references:await Promise.all(media.references.map(encode)),audio:await encode(media.audio),cover:await encode(media.cover)};
  return snapshot;
}
async function downloadPracticeBackup(data,id,name) {
  try {downloadFile(name,JSON.stringify(await portablePracticeBackup(data,id),null,2),'application/json');return true;}
  catch(error) {showToast('Backup failed: '+error.message,5000);return false;}
}
async function decodeBackupMedia(bundle) {
  if(!bundle||!Array.isArray(bundle.references)||bundle.references.length>6)throw new Error('Invalid media backup.');
  async function decode(item,kind) {
    if(item===null||item===undefined)return null;
    if(typeof item.name!=='string'||item.name.length>160||typeof item.data!=='string'||!/^data:(image\/(png|jpeg|webp)|application\/pdf|audio\/(mpeg|wav|mp4|aac|ogg|webm));base64,[a-zA-Z0-9+/=]+$/.test(item.data))throw new Error('Invalid attachment.');
    const binary=atob(item.data.slice(item.data.indexOf(',')+1));
    const bytes=Uint8Array.from(binary,char=>char.charCodeAt(0));
    return checkedFile(new File([bytes],item.name),kind);
  }
  const references=await Promise.all(bundle.references.map(item=>decode(item,'reference')));
  if(references.some(item=>!item))throw new Error('Invalid reading sheet.');
  const media={references,audio:await decode(bundle.audio,'audio'),cover:await decode(bundle.cover,'cover')};validateMediaSize(media);return media;
}
async function restorePracticeBackup(data) {
  if(!validBackup(data))throw new Error('Invalid practice backup.');
  const id=data.practiceId||'ganapati';
  const definition=data.customPractice?customDefinition(data.customPractice):null;
  if(definition&&(definition.id!==id||!validCustomPractice(definition)))throw new Error('Invalid category definition.');
  const media=definition?await decodeBackupMedia(data.media):null;
  if(definition&&!definition.en&&!media.references.length&&!media.audio)throw new Error('This category has no mantra content.');
  const existing=localStorage.getItem(practiceStorageKey(id));
  if(existing&&!confirm('Restore this backup for '+(definition?.name||PRACTICES[id].name)+'? It will replace that practice’s current progress'+(definition?' and uploads':'')+'.'))return false;
  const clean=structuredClone(data);delete clean.customPractice;delete clean.media;delete clean.lastBackup;
  stopGuidedAudio();
  await practiceLock(async()=>{
    const previousDefinition=definition?localStorage.getItem(CUSTOM_PREFIX+id):null;
    const previousMedia=definition?await mediaStore(id):null;
    try {
      if(definition) {
        await mediaStore(id,media);
        localStorage.setItem(CUSTOM_PREFIX+id,JSON.stringify({...definition,revision:Date.now()}));
      }
      // Persist before switching so configurePractice sees the restored goals.
      clean.updatedAt=Date.now();clean.practiceId=id;clean.sharedCountMigrated=true;
      localStorage.setItem(practiceStorageKey(id),JSON.stringify(clean));
    } catch(error) {
      if(definition) {
        if(previousMedia)await mediaStore(id,previousMedia);else await mediaStore(id,undefined,true);
        if(previousDefinition)localStorage.setItem(CUSTOM_PREFIX+id,previousDefinition);else localStorage.removeItem(CUSTOM_PREFIX+id);
      }
      throw new Error('Not enough browser storage to restore this practice.');
    }
    refreshCustomRegistry();
  });
  refreshPracticePicker();await switchPractice(id,{restoring:true});
  state=clean;saveState(state);buildCards();renderCompanion();closeWelcomeModal();
  showToast('Practice restored, including its saved uploads.');return true;
}
document.getElementById('customPracticeForm').addEventListener('submit',saveCustomPractice);
document.getElementById('customDialog').addEventListener('cancel',event=>{if(document.getElementById('customSubmit').disabled)event.preventDefault();});
window.addEventListener('storage',async event=>{
  if(event.key!==null&&!event.key.startsWith(CUSTOM_PREFIX))return;
  const previous=PRACTICES[activePractice]?.revision;
  refreshCustomRegistry();refreshPracticePicker();
  if(!PRACTICES[activePractice])await switchPractice('ganapati',{restoring:true});
  else if(previous!==PRACTICES[activePractice]?.revision) {
    const draft=noteDirty?{value:document.getElementById('dailyNote').value,day:noteDay}:null;
    stopGuidedAudio();configurePractice();
    if(draft) {document.getElementById('dailyNote').value=draft.value;noteDay=draft.day;noteDirty=true;}
    renderCompanion();
  }
});
