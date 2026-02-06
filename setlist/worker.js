const fullscreenBtn = document.getElementById('fullscreen-btn');

function enterFullscreen() {
  if (document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen();
  } else if (document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen();
  } else if (document.documentElement.msRequestFullscreen) {
    document.documentElement.msRequestFullscreen();
  }
}

function exitFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    document.msExitFullscreen();
  }
}

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    enterFullscreen();
  } else {
    exitFullscreen();
  }
});

window.addEventListener('load', () => {});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.fullscreenElement) {
    exitFullscreen();
  }
});

const cursor = document.getElementById('cursor');

document.addEventListener('mousemove', (e) => {
  cursor.style.left = e.clientX - 12 + 'px';
  cursor.style.top = e.clientY - 12 + 'px';
  cursor.style.opacity = '1';
});

document.addEventListener('mouseleave', () => {
  cursor.style.opacity = '0';
});

document.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('mouseenter', () => {
    cursor.style.transform = 'scale(1.5)';
  });
  btn.addEventListener('mouseleave', () => {
    cursor.style.transform = 'scale(1)';
  });
});

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  const data = lines.slice(1).map((line) => line.split(','));
  return { headers, data };
}

function loadSetlist() {
  if (window.fetchSetlistFromFirebase && typeof window.fetchSetlistFromFirebase === 'function') {
    return Promise.resolve()
      .then(() => window.fetchSetlistFromFirebase())
      .then((csv) => {
        if (typeof csv === 'string' && csv.trim()) return csv;
        try {
          if (Array.isArray(csv)) {
            if (Array.isArray(csv[0])) return csv.map(r => r.join(',')).join('\n');
            const keys = Object.keys(csv[0] || {});
            const rows = csv.map(obj => keys.map(k => obj[k] ?? '').join(','));
            return [keys.join(','), ...rows].join('\n');
          }
          if (typeof csv === 'object' && csv !== null) {
            const vals = Object.values(csv);
            if (vals.length && typeof vals[0] === 'string') return vals.join('\n');
            if (vals.length && typeof vals[0] === 'object') {
              const keys = Object.keys(vals[0]);
              const rows = vals.map(obj => keys.map(k => obj[k] ?? '').join(','));
              return [keys.join(','), ...rows].join('\n');
            }
          }
        } catch (e) {
        }
        return fetch('setlist.csv').then(r => r.text());
      })
      .catch(() => fetch('setlist.csv').then(r => r.text()));
  }
  return fetch('setlist.csv').then((response) => response.text());
}

function populateTable(headers, data) {
  const table = document.getElementById('csv-table');
  table.innerHTML = '';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');

  headers.forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  data.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.dataset.index = index;
    row.forEach((cell) => {
      const td = document.createElement('td');
      td.textContent = cell;
      td.contentEditable = true;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
}

let activeRowIndex = -1;

function updateNowPlaying(){
        const tbody = document.querySelector('#csv-table tbody');
        const nowSongEl = document.querySelector('.now-song');
        const nextSongEl = document.querySelector('.next-song');
        const upcomingList = document.getElementById('upcoming-list');
        if(!nowSongEl || !upcomingList) return;
        let rows = tbody ? Array.from(tbody.children) : [];
        if(typeof activeRowIndex === 'undefined' || activeRowIndex === null){
            const activeInDom = rows.findIndex(r=>r.classList.contains('active-row'));
            if(activeInDom>=0) activeRowIndex = activeInDom;
            else {
                const saved = localStorage.getItem('activeRow');
                const n = saved!==null ? parseInt(saved,10) : NaN;
                if(!isNaN(n) && n>=0 && n<rows.length) activeRowIndex = n;
                else activeRowIndex = -1;
            }
        }
        if(activeRowIndex>=0 && rows[activeRowIndex]){
            const cells = rows[activeRowIndex].querySelectorAll('td');
            const song = cells[0] ? cells[0].textContent.trim() : '';
            const recommender = cells[1] ? cells[1].textContent.trim() : '';
            nowSongEl.textContent = song ? `${song}${recommender ? ' — ' + recommender : ''}` : '—';
        } else {
            nowSongEl.textContent = '—';
        }
        const nextIndex = (activeRowIndex>=0) ? activeRowIndex+1 : -1;
        if(nextIndex>=0 && rows[nextIndex]){
          const nCells = rows[nextIndex].querySelectorAll('td');
          const nSong = nCells[0] ? nCells[0].textContent.trim() : '';
          const nRec = nCells[1] ? nCells[1].textContent.trim() : '';
          nextSongEl.textContent = nSong ? `${nSong}${nRec ? ' — ' + nRec : ''}` : '—';
        } else {
          nextSongEl.textContent = '—';
        }
        upcomingList.innerHTML = '';
        const isFullScreen = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
        const maxUpcoming = isFullScreen ? 5 : 3; 
        if(rows.length === 0) return;

        let start = 0;
        if(typeof activeRowIndex === 'number' && activeRowIndex >= 0){
            start = activeRowIndex - 2;
        } else {
            start = 0;
        }
        start = Math.max(0, start);
        if(start + maxUpcoming > rows.length) start = Math.max(0, rows.length - maxUpcoming);

        const end = Math.min(rows.length - 1, start + maxUpcoming - 1);

        if(start > 0){
            const above = document.createElement('div');
            above.className = 'upcoming-line';
            above.style.opacity = '0.75';
            above.textContent = `+${start} above`;
            upcomingList.appendChild(above);
        }

        for(let i=start;i<=end;i++){
            const rCells = rows[i].querySelectorAll('td');
            const rSong = rCells[0] ? rCells[0].textContent.trim() : '';
            const rRec = rCells[1] ? rCells[1].textContent.trim() : '';
            const line = document.createElement('div');
            line.className = 'upcoming-line';
            if(i===activeRowIndex) line.classList.add('active');
            line.textContent = rSong ? `${rSong}${rRec ? ' — ' + rRec : ''}` : '';
            upcomingList.appendChild(line);
        }

        if(end < rows.length - 1){
            const more = document.createElement('div');
            more.className = 'upcoming-line';
            more.style.opacity = '0.75';
            more.textContent = `+${rows.length - 1 - end} more`;
            upcomingList.appendChild(more);
        }

        ['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(evt=>{
            document.removeEventListener(evt, updateNowPlaying);
            document.addEventListener(evt, ()=>{ try{ updateNowPlaying(); }catch(_){} });
        });
    }

document.getElementById('edit-btn').addEventListener('click', () => {
  loadSetlist().then((csv) => {
    try { localStorage.setItem('csvData', csv); } catch(_){}
    const { headers, data } = parseCSV(csv);
    populateTable(headers, data);
    const tbody = document.querySelector('#csv-table tbody');

    const savedActive = localStorage.getItem('activeRow');
    if (
      savedActive !== null &&
      savedActive !== '-1' &&
      tbody &&
      tbody.children[parseInt(savedActive, 10)]
    ) {
      activeRowIndex = parseInt(savedActive, 10);
      tbody.children[activeRowIndex].classList.add('active-row');
    } else {
      activeRowIndex = 0;
      if (tbody && tbody.children[0]) {
        tbody.children[0].classList.add('active-row');
      }
    }

    updateNowPlaying();
    document.getElementById('modal').style.display = 'flex';
  }).catch(()=>{
  });
});

document.getElementById('csv-table').addEventListener('click', (e) => {
  if (e.target && e.target.tagName === 'TD') {
    const row = e.target.parentElement;
    document.querySelectorAll('#csv-table tr').forEach((r) => r.classList.remove('active-row'));
    row.classList.add('active-row');
    activeRowIndex = parseInt(row.dataset.index, 10);
    updateNowPlaying();
  }
});

document.getElementById('csv-table').addEventListener('input', () => {
  saveTableToLocalStorage();
});

document.getElementById('close-btn').addEventListener('click', () => {
  saveTableToLocalStorage();
  document.getElementById('modal').style.display = 'none';
});

function saveTableToLocalStorage() {
  const table = document.getElementById('csv-table');
  const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent);
  const rows = Array.from(table.querySelectorAll('tbody tr'))
    .map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => td.textContent))
    .filter((row) => row.some((cell) => cell.trim() !== ''));

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  localStorage.setItem('csvData', csv);
  localStorage.setItem('activeRow', activeRowIndex.toString());

  try{
    if(window.writeSetlistToFirebase && typeof window.writeSetlistToFirebase === 'function'){
      window.writeSetlistToFirebase(csv).catch(()=>{});
    }
  }catch(_){ }
}

document.getElementById('add-row-btn').addEventListener('click', () => {
  const tbody = document.querySelector('#csv-table tbody');
  const tr = document.createElement('tr');
  const headers = document.querySelectorAll('#csv-table th');
  headers.forEach(() => {
    const td = document.createElement('td');
    td.contentEditable = true;
    td.textContent = '';
    tr.appendChild(td);
  });
  tbody.appendChild(tr);
});

function downloadCSV() {
  const table = document.getElementById('csv-table');
  const headers = Array.from(table.querySelectorAll('th')).map((th) => th.textContent);
  const rows = Array.from(table.querySelectorAll('tbody tr')).map((tr) =>
    Array.from(tr.querySelectorAll('td')).map((td) => td.textContent)
  );
  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'setlist.csv';
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById('download-btn').addEventListener('click', downloadCSV);

function updateTime() {
  const now = new Date();
  const time = now.toLocaleTimeString('en-AU', { timeZone: 'Australia/Sydney', hour12: false });
  const date = now.toLocaleDateString('en-AU', {
    timeZone: 'Australia/Sydney',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  document.getElementById('time').innerHTML = `<div class="t">${time}</div><div class="d">${date}</div>`;
}

updateTime();
setInterval(updateTime, 1000);
try{updateNowPlaying()}catch(e){}
window.updateNowPlaying = updateNowPlaying;
const hint = document.getElementById('nav-hint');
if(hint) hint.textContent = 'Use ←   → to change selection';
function getRows(){const tbody=document.querySelector('#csv-table tbody');return tbody?Array.from(tbody.children):[]}
function findActiveIndex(){
    const rows=getRows();
    const active = rows.findIndex(r=>r.classList.contains('active-row'));
    if(active>=0) return active;
    const saved = localStorage.getItem('activeRow');
    if(saved!==null){ const n=parseInt(saved,10); if(!isNaN(n) && n>=0 && n<rows.length) return n; }
    return -1;
}
function applyActive(idx){
    const rows=getRows(); if(idx<0||idx>=rows.length) return;
    const row = rows[idx];
    const cells = Array.from(row.querySelectorAll('td'));
    const hasContent = cells.some(td=>td.textContent && td.textContent.trim()!=='');
    if(!hasContent) return;
    rows.forEach((r,i)=> r.classList.toggle('active-row', i===idx));
    try{ activeRowIndex = idx }catch(e){}
    try{ window.activeRowIndex = idx }catch(e){}
    localStorage.setItem('activeRow', String(idx));
    try{ rows[idx].scrollIntoView({behavior:'smooth',block:'center'}) }catch(e){}
    if(typeof updateNowPlaying === 'function'){ try{ updateNowPlaying() }catch(e){} }
}

window.addEventListener('load', ()=>{
  const table = document.getElementById('csv-table');
  if(!table || table.querySelector('tbody')) return;

  loadSetlist().then(csv => {
    if(!csv) return;
    try{ localStorage.setItem('csvData', csv); }catch(_){ }
    try{
      const {headers,data} = parseCSV(csv);
      populateTable(headers,data);
      const tbody = document.querySelector('#csv-table tbody');
      const savedActive = localStorage.getItem('activeRow');
      let idx = -1;
      if(savedActive!==null && savedActive!=='-1' && tbody && tbody.children[parseInt(savedActive)]){
        idx = parseInt(savedActive);
      }
      if(idx>=0){
        tbody.children[idx].classList.add('active-row');
        activeRowIndex = idx; window.activeRowIndex = idx;
      } else if(tbody && tbody.children[0]){
        tbody.children[0].classList.add('active-row');
        activeRowIndex = 0; window.activeRowIndex = 0;
      }
      if(typeof updateNowPlaying === 'function') updateNowPlaying();
    }catch(e){ console.warn('failed to parse fetched csv', e); }
  }).catch(()=>{
  });
});

document.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight' || e.key==='ArrowLeft'){
        const rows = getRows(); if(!rows.length) return;
        const domActive = rows.findIndex(r=>r.classList.contains('active-row'));
        if(domActive===-1){
            if(e.key==='ArrowRight'){ applyActive(0); e.preventDefault(); return; }
            if(e.key==='ArrowLeft'){ applyActive(rows.length-1); e.preventDefault(); return; }
        }
        const idx = domActive>=0 ? domActive : findActiveIndex();
        if(e.key==='ArrowRight' && idx<rows.length-1) applyActive(idx+1);
        if(e.key==='ArrowLeft' && idx>0) applyActive(idx-1);
        e.preventDefault();
    }
});
document.addEventListener('click',function(e){ if(e.target&&e.target.tagName==='TD'){ const tr=e.target.parentElement; const tbody=tr.parentElement; const idx=Array.from(tbody.children).indexOf(tr); if(idx>=0) applyActive(idx); } });
window.setActiveRow = applyActive;
function setBackgroundUrl(url){
    try{
        document.body.style.backgroundImage = `url("${url}")`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
        try{ localStorage.setItem('bgImage', url); }catch(_){}
    }catch(e){console.warn('failed to set background',e)}
    scheduleUpdateContrast();
}

let _contrastTimer = null;
function scheduleUpdateContrast(){
    if(_contrastTimer) clearTimeout(_contrastTimer);
    _contrastTimer = setTimeout(updateContrast, 120);
}

function updateContrast(){
    _contrastTimer = null;
    const bg = window.getComputedStyle(document.body).backgroundImage;
    const selectors = [
        '.now-card',
        '#upcoming-list',
        '#nav-hint',
        '#logo',
        '#modal-content',
        '#time',
        '.now-song',
        '.next-item',
        '#edit-btn',
        '#fullscreen-btn',
        '#qr',
        '#qr .qr-img-wrap',
        '#qr .qr-link'
    ];

    function applyForElement(el, lum){
        if(!el) return;
        if(lum > 0.62){
            el.classList.add('dark-foreground');
        } else {
            el.classList.remove('dark-foreground');
        }
    }

    const m = bg && bg !== 'none' ? bg.match(/url\((?:"|')?(.*?)(?:"|')?\)/) : null;
    if(m && m[1]){
        const src = m[1];
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = function(){
            try{
                const w = window.innerWidth;
                const h = window.innerHeight;
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                const iw = img.naturalWidth, ih = img.naturalHeight;
                const scale = Math.max(w/iw, h/ih);
                const sw = iw * scale; const sh = ih * scale;
                const sx = (w - sw)/2; const sy = (h - sh)/2;
                ctx.drawImage(img, sx, sy, sw, sh);
                selectors.forEach(sel=>{
                    const el = document.querySelector(sel);
                    if(!el) return;
                    const r = el.getBoundingClientRect();
                    const cx = Math.round(r.left + r.width/2);
                    const cy = Math.round(r.top + r.height/2);
                    try{
                        const p = ctx.getImageData(cx, cy, 1, 1).data;
                        const rV = p[0], gV = p[1], bV = p[2];
                        const lum = (0.2126*rV + 0.7152*gV + 0.0722*bV)/255;
                        applyForElement(el, lum);
                    }catch(e){
                        try{
                            const area = ctx.getImageData(Math.max(0,cx-2), Math.max(0,cy-2), 5, 5).data;
                            let rSum=0,gSum=0,bSum=0,n=0;
                            for(let i=0;i<area.length;i+=4){ rSum+=area[i]; gSum+=area[i+1]; bSum+=area[i+2]; n++; }
                            const lum = (0.2126*(rSum/n) + 0.7152*(gSum/n) + 0.0722*(bSum/n))/255;
                            applyForElement(el, lum);
                        }catch(_){ }
                    }
                });
            }catch(e){console.warn('contrast sample failed',e)}
        };
        try{ img.src = src; }
        catch(e){ /**/ }
        return;
    }

    const bgColor = window.getComputedStyle(document.body).backgroundColor || 'rgb(0,0,0)';
    const m2 = bgColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    let lum = 0;
    if(m2){ const r=parseInt(m2[1],10), g=parseInt(m2[2],10), b=parseInt(m2[3],10); lum = (0.2126*r + 0.7152*g + 0.0722*b)/255; }
    selectors.forEach(sel=>{ const el=document.querySelector(sel); if(el) applyForElement(el, lum); });
}

window.addEventListener('resize', ()=> scheduleUpdateContrast());

document.addEventListener('dragover', function(e){ e.preventDefault(); try{ if(e.dataTransfer) e.dataTransfer.dropEffect='copy'; }catch(_){} });
document.addEventListener('drop', function(e){
    e.preventDefault();
    const dt = e.dataTransfer; if(!dt) return;
    if(dt.files && dt.files.length){
        const imgFile = Array.from(dt.files).find(f=>f.type && f.type.startsWith('image'));
        if(imgFile){
            const reader = new FileReader();
            reader.onload = function(ev){ setBackgroundUrl(ev.target.result); };
            reader.readAsDataURL(imgFile);
            return;
        }
    }
    const html = dt.getData && dt.getData('text/html');
    if(html){ const m = html.match(/src\s*=\s*"([^"]+)"/i); if(m && m[1]){ setBackgroundUrl(m[1]); return; } }
    const uri = (dt.getData && (dt.getData('text/uri-list') || dt.getData('text/plain'))) || '';
    if(uri) setBackgroundUrl(uri.trim());
});
document.addEventListener('paste', function(e){
    try{
        const items = (e.clipboardData && e.clipboardData.items) ? Array.from(e.clipboardData.items) : [];
        const imgItem = items.find(it=>it.type && it.type.startsWith('image'));
        if(imgItem){
            const file = imgItem.getAsFile();
            const reader = new FileReader();
            reader.onload = function(ev){ setBackgroundUrl(ev.target.result); };
            reader.readAsDataURL(file);
        }
    }catch(_){ }
});

try{
    const savedBg = localStorage.getItem('bgImage');
    if(savedBg){ setBackgroundUrl(savedBg); }
}catch(_){}
scheduleUpdateContrast();