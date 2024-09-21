// Fungsi Login
function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    if (username) {
        localStorage.setItem('currentUser', username); // Simpan user saat ini
        window.location.href = 'index.html';
    }
}

// Inisialisasi aplikasi utama
function initializeApp() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'login.html'; // Jika belum login, redirect ke halaman login
    } else {
        document.getElementById('welcome-message').textContent = `Selamat datang, ${currentUser}!`;
        setupKategori();
        refreshSaldo();
        refreshRiwayat();
        setupPencarianDanFilter();
        buatGrafik();
    }
}

// Fungsi Logout
function logout() {
    if (confirm("Apakah Anda yakin ingin logout?")) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html'; // Redirect ke halaman login
    }
}

// Fungsi untuk menambah transaksi baru
function tambahTransaksi(event) {
    event.preventDefault();

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert("Silakan login terlebih dahulu!");
        window.location.href = 'login.html';
        return;
    }

    const jenis = document.getElementById('jenis').value;
    const kategori = document.getElementById('kategori').value;
    const jumlah = parseFloat(document.getElementById('jumlah').value);
    const keterangan = document.getElementById('keterangan').value;
    const tanggal = new Date().toLocaleString('id-ID', {
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit'
    });

    // Ambil data pengguna dari localStorage
    let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
    if (!usersData[currentUser]) {
        usersData[currentUser] = { saldo: 0, transaksi: [] };
    }

    // Update saldo dan transaksi
    if (jenis === 'pemasukan') {
        usersData[currentUser].saldo += jumlah;
    } else if (jenis === 'pengeluaran') {
        usersData[currentUser].saldo -= jumlah;
    }

    usersData[currentUser].transaksi.push({ jenis, kategori, jumlah, keterangan, tanggal });
    localStorage.setItem('usersData', JSON.stringify(usersData));

    document.getElementById('form-transaksi').reset();
    refreshSaldo();
    refreshRiwayat();
    buatGrafik();
}

// Fungsi untuk merefresh saldo
function refreshSaldo() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
    const saldoEl = document.getElementById('saldo');
    const saldo = usersData[currentUser] ? usersData[currentUser].saldo : 0;
    saldoEl.textContent = `Rp ${saldo.toLocaleString()}`;
}

// Fungsi untuk merefresh riwayat transaksi
function refreshRiwayat() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const filterKategori = document.getElementById('filter-kategori').value;
    const filterTanggalStart = document.getElementById('filter-tanggal-start').value;
    const filterTanggalEnd = document.getElementById('filter-tanggal-end').value;

    let transaksi = usersData[currentUser] ? usersData[currentUser].transaksi : [];

    if (searchInput) {
        transaksi = transaksi.filter(t => t.keterangan.toLowerCase().includes(searchInput));
    }

    if (filterKategori) {
        transaksi = transaksi.filter(t => t.kategori === filterKategori);
    }

    if (filterTanggalStart) {
        transaksi = transaksi.filter(t => new Date(t.tanggal) >= new Date(filterTanggalStart));
    }

    if (filterTanggalEnd) {
        transaksi = transaksi.filter(t => new Date(t.tanggal) <= new Date(filterTanggalEnd));
    }

    const riwayatTbody = document.getElementById('riwayat-transaksi');
    riwayatTbody.innerHTML = '';

    transaksi.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${t.tanggal}</td>
            <td>${t.jenis}</td>
            <td>${t.kategori}</td>
            <td>Rp ${t.jumlah.toLocaleString()}</td>
            <td>${t.keterangan}</td>
        `;
        riwayatTbody.appendChild(tr);
    });
}

// Fungsi untuk reset riwayat transaksi
function resetRiwayat() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    if (confirm("Apakah Anda yakin ingin menghapus semua riwayat transaksi?")) {
        let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
        usersData[currentUser].transaksi = [];
        usersData[currentUser].saldo = 0;
        localStorage.setItem('usersData', JSON.stringify(usersData));
        refreshSaldo();
        refreshRiwayat();
        buatGrafik();
        alert("Riwayat transaksi telah di-reset.");
    }
}

// Fungsi untuk membuat grafik keuangan
function buatGrafik() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
    const ctx = document.getElementById('grafikBar').getContext('2d');

    const groupedByKategori = usersData[currentUser].transaksi.reduce((acc, cur) => {
        if (!acc[cur.kategori]) {
            acc[cur.kategori] = { pemasukan: 0, pengeluaran: 0 };
        }
        acc[cur.kategori][cur.jenis] += cur.jumlah;
        return acc;
    }, {});

    const labels = Object.keys(groupedByKategori);
    const pemasukanData = labels.map(label => groupedByKategori[label].pemasukan);
    const pengeluaranData = labels.map(label => groupedByKategori[label].pengeluaran);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: pemasukanData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                },
                {
                    label: 'Pengeluaran',
                    data: pengeluaranData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                },
            ],
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Fungsi untuk backup data ke file Excel
function backupData() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
    if (!usersData[currentUser]) {
        alert('Tidak ada data untuk di-backup!');
        return;
    }

    const data = usersData[currentUser];
    let excelData = [['Tanggal', 'Jenis', 'Kategori', 'Jumlah', 'Keterangan']];
    data.transaksi.forEach((item) => {
        excelData.push([item.tanggal, item.jenis, item.kategori, item.jumlah, item.keterangan]);
    });

    let worksheet = XLSX.utils.aoa_to_sheet(excelData);
    let workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");

    XLSX.writeFile(workbook, `${currentUser}_keuangan_backup.xlsx`);
}

// Fungsi untuk restore data dari file JSON
function restoreData(event) {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = JSON.parse(e.target.result);
        let usersData = localStorage.getItem('usersData') ? JSON.parse(localStorage.getItem('usersData')) : {};
        usersData[currentUser] = data;
        localStorage.setItem('usersData', JSON.stringify(usersData));
        refreshSaldo();
        refreshRiwayat();
        buatGrafik();
        alert("Data berhasil dipulihkan!");
    };
    reader.readAsText(file);
}

// Fungsi untuk mengatur kategori transaksi berdasarkan jenis
function setupKategori() {
    const kategoriPemasukan = ['Gaji', 'Bonus', 'Investasi', 'Lainnya'];
    const kategoriPengeluaran = ['Makanan', 'Transportasi', 'Hiburan', 'Belanja', 'Tagihan', 'Lainnya'];

    const jenisSelect = document.getElementById('jenis');
    const kategoriSelect = document.getElementById('kategori');

    jenisSelect.addEventListener('change', function () {
        const jenis = this.value;
        kategoriSelect.innerHTML = '<option value="">Pilih kategori</option>';

        if (jenis) {
            const kategoriList = jenis === 'pemasukan' ? kategoriPemasukan : kategoriPengeluaran;
            kategoriList.forEach(kategori => {
                const option = document.createElement('option');
                option.value = kategori.toLowerCase();
                option.textContent = kategori;
                kategoriSelect.appendChild(option);
            });
        }
    });
}

// Fungsi untuk mengatur filter pencarian dan kategori
function setupPencarianDanFilter() {
    const searchInput = document.getElementById('search-input');
    const filterKategori = document.getElementById('filter-kategori');
    const filterTanggalStart = document.getElementById('filter-tanggal-start');
    const filterTanggalEnd = document.getElementById('filter-tanggal-end');

    searchInput.addEventListener('input', refreshRiwayat);
    filterKategori.addEventListener('change', refreshRiwayat);
    filterTanggalStart.addEventListener('change', refreshRiwayat);
    filterTanggalEnd.addEventListener('change', refreshRiwayat);
}

// Fungsi untuk mereset filter pencarian dan kategori
function resetFilter() {
    document.getElementById('search-input').value = '';
    document.getElementById('filter-kategori').value = '';
    document.getElementById('filter-tanggal-start').value = '';
    document.getElementById('filter-tanggal-end').value = '';
    refreshRiwayat();
}
