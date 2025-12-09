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

function updateNowPlaying() {
  const tbody = document.querySelector('#csv-table tbody');
  const h1 = document.querySelector('.content h1');

  if (activeRowIndex >= 0 && tbody && tbody.children[activeRowIndex]) {
    const cells = tbody.children[activeRowIndex].querySelectorAll('td');
    const song = cells[0] ? cells[0].textContent : '';
    const recommender = cells[1] ? cells[1].textContent : '';
    let text = `Now Playing: ${song} - ${recommender}`;

    const nextIndex = activeRowIndex + 1;
    if (tbody.children[nextIndex]) {
      const nextCells = tbody.children[nextIndex].querySelectorAll('td');
      const nextSong = nextCells[0] ? nextCells[0].textContent : '';
      const nextRecommender = nextCells[1] ? nextCells[1].textContent : '';
      text += `\nNext: ${nextSong} - ${nextRecommender}`;
    }

    if (h1) h1.textContent = text;
  } else {
    if (h1) h1.textContent = 'Jazz Setlist Overlay';
  }
}

document.getElementById('edit-btn').addEventListener('click', () => {
  let csvData = localStorage.getItem('csvData');
  if (csvData) {
    const { headers, data } = parseCSV(csvData);
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
  } else {
    fetch('setlist.csv')
      .then((response) => response.text())
      .then((csv) => {
        localStorage.setItem('csvData', csv);
        const { headers, data } = parseCSV(csv);
        populateTable(headers, data);
        const tbody = document.querySelector('#csv-table tbody');
        activeRowIndex = 0;
        if (tbody && tbody.children[0]) {
          tbody.children[0].classList.add('active-row');
        }
        updateNowPlaying();
        document.getElementById('modal').style.display = 'flex';
      });
  }
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