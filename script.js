// Cấu hình
const DEFAULT_CSV_URL = 'data.csv'; // Đặt cùng thư mục với index.html
const CSV_DELIMITER = ';'; // Dấu phân cách trong file của bạn

let records = []; // Mảng object mỗi thí sinh
let header = [];  // Tên cột

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const statusEl = $('#status');
const resultCard = $('#result');
const theadEl = $('#thead');
const tbodyEl = $('#tbody');
const sbdInput = $('#sbdInput');
const searchBtn = $('#searchBtn');
const fileInput = $('#csvFile');

function setStatus(msg) { statusEl.textContent = msg || ''; }

function normalizeKeyName(name) {
  // Chuẩn hóa nhẹ tên cột để hiển thị (tùy chọn)
  if (!name) return name;
  const map = {
    'To n': 'Toan', 'V?n': 'Van', 'Lˇ': 'Ly', 'H˘a': 'Hoa', 'Sinh': 'Sinh',
    'Tin h?c': 'Tinhoc', 'C“ng ngh? c“ng nghi?p': 'CN_CN',
    'C“ng ngh? n“ng nghi?p': 'CN_NN',
    'S?': 'Su', '??a': 'Dia',
    'Gi o d?c kinh t? v… ph p lu?t': 'GDCD',
    'Ngo?i ng?': 'Ngoaingu',
    'M? m“n ngo?i ng?': 'MaMonNN',
  };
  return map[name] || name;
}

function renderTableRow(obj) {
  const tr = document.createElement('tr');
  header.forEach((key) => {
    const td = document.createElement('td');
    const val = obj[key] ?? '';
    td.textContent = val;
    tr.appendChild(td);
  });
  return tr;
}

function renderTableHeader() {
  theadEl.innerHTML = '';
  const tr = document.createElement('tr');
  header.forEach((key) => {
    const th = document.createElement('th');
    th.textContent = normalizeKeyName(key);
    tr.appendChild(th);
  });
  theadEl.appendChild(tr);
}

function showResult(rowObj) {
  if (!rowObj) {
    resultCard.classList.add('hidden');
    return;
  }
  renderTableHeader();
  tbodyEl.innerHTML = '';
  tbodyEl.appendChild(renderTableRow(rowObj));

  // Hiển thị meta
  const metaEl = $('#meta');
  const sbd = rowObj['SOBAODANH'] || rowObj['SOBD'] || rowObj['SBD'] || '';
  metaEl.innerHTML = `SBD: <span class="badge">${sbd}</span>`;
  resultCard.classList.remove('hidden');
}

function searchBySBD(sbd) {
  if (!sbd) return null;
  const keyNames = ['SOBAODANH','SOBD','SBD'];
  // Tối ưu: dùng map nếu muốn rất nhanh:
  // Nhưng với 1 truy vấn mỗi lần, linear search vẫn ổn.
  sbd = sbd.trim();
  return records.find((row) => {
    return keyNames.some(k => row[k] && String(row[k]).trim() === sbd);
  }) || null;
}

function parseCSVFile(fileOrUrl) {
  return new Promise((resolve, reject) => {
    Papa.parse(fileOrUrl, {
      header: true,
      delimiter: CSV_DELIMITER,
      skipEmptyLines: true,
      encoding: 'utf-8',
      worker: true, // tăng tốc
      complete: (res) => {
        if (res.errors && res.errors.length) {
          console.warn('CSV parse errors:', res.errors);
        }
        resolve(res.data);
      },
      error: (err) => reject(err),
    });
  });
}

async function loadDefaultCSV() {
  try {
    setStatus('Đang tải dữ liệu mặc định (data.csv)...');
    const data = await parseCSVFile(DEFAULT_CSV_URL);
    if (!Array.isArray(data) || !data.length) throw new Error('Không có dữ liệu');
    records = data;
    header = Object.keys(records[0]);
    setStatus(`Đã nạp ${records.length.toLocaleString('vi-VN')} bản ghi từ data.csv`);
  } catch (e) {
    console.warn('Không thể tải data.csv:', e.message);
    setStatus('Chưa nạp dữ liệu. Bạn có thể chọn file CSV bằng nút phía trên.');
  }
}

searchBtn.addEventListener('click', () => {
  const sbd = sbdInput.value;
  if (!records.length) {
    setStatus('Chưa có dữ liệu. Hãy chọn file CSV hoặc đặt data.csv cùng thư mục.');
    return;
  }
  if (!sbd.trim()) {
    setStatus('Vui lòng nhập Số báo danh.');
    return;
  }
  setStatus('Đang tra cứu...');
  const found = searchBySBD(sbd);
  if (found) {
    showResult(found);
    setStatus('Đã tìm thấy.');
  } else {
    showResult(null);
    setStatus('Không tìm thấy SBD tương ứng.');
  }
});

fileInput.addEventListener('change', async (e) => {
  const file = e.target.files?.;
  if (!file) return;
  try {
    setStatus('Đang đọc file CSV...');
    const data = await parseCSVFile(file);
    if (!Array.isArray(data) || !data.length) {
      setStatus('File CSV không có dữ liệu hợp lệ.');
      return;
    }
    records = data;
    header = Object.keys(records);
    setStatus(`Đã nạp ${records.length.toLocaleString('vi-VN')} bản ghi từ file đã chọn.`);
    resultCard.classList.add('hidden');
  } catch (e) {
    console.error(e);
    setStatus('Lỗi đọc file CSV.');
  } finally {
    fileInput.value = '';
  }
});

window.addEventListener('DOMContentLoaded', () => {
  loadDefaultCSV();
});
