document.addEventListener('DOMContentLoaded', () => {
    // === ELEMEN DOM ===
    const motivationalQuote = document.getElementById('motivational-quote');
    const dashboardTitle = document.getElementById('dashboard-title');
    const targetContainer = document.getElementById('target-container');
    const historyTableBody = document.getElementById('history-table-body');
    const quickAddButtonsContainer = document.querySelector('.quick-add-buttons');
    const punishmentSection = document.getElementById('punishment-section');
    const accordionHeaders = document.querySelectorAll('.accordion-header');

    // === TARGET MINGGUAN (DITENTUKAN OLEH SISTEM) ===
    const weeklyTargets = {
        "TIU": { target: 2, unit: "sesi" }, "TWK": { target: 2, unit: "sesi" },
        "TKP": { target: 2, unit: "sesi" }, "TPA/TPS": { target: 2, unit: "sesi" },
        "Bahasa Inggris": { target: 2, unit: "sesi" }, "Lari": { target: 7, unit: "km" },
        "Push Up": { target: 150, unit: "reps" }, "Sit Up": { target: 150, unit: "reps" },
        "Shuttle Run": { target: 10, unit: "sesi" }, "Pull Up/Chinning": { target: 20, unit: "reps" }
    };

    // === TUGAS TAMBAHAN (HUKUMAN) ===
    const punishments = {
        "TIU": "Kerjakan 20 soal TIU campuran dalam 15 menit.",
        "TWK": "Hafalkan dan pahami 5 pasal UUD 1945 beserta amandemennya.",
        "TKP": "Analisis 5 soal studi kasus TKP dan tuliskan justifikasi jawaban terbaikmu.",
        "TPA/TPS": "Kerjakan 1 paket soal penalaran kuantitatif tanpa kalkulator.",
        "Bahasa Inggris": "Baca 1 artikel berita berbahasa Inggris dan tulis rangkumannya.",
        "Lari": "Lakukan lari interval: 2 menit lari cepat, 1 menit jalan kaki, ulangi 5 kali.",
        "Push Up": "Lakukan 3 set push up hingga batas maksimal (failure) dengan jeda 1 menit.",
        "Sit Up": "Lakukan 3 set sit up hingga batas maksimal (failure) dengan jeda 1 menit.",
        "Shuttle Run": "Lakukan 5 repetisi shuttle run dengan fokus pada kecepatan terbaik.",
        "Pull Up/Chinning": "Lakukan 5 set pull up/chinning hingga batas maksimal (failure)."
    };
    
    // === DATA MOTIVASI & LOCAL STORAGE ===
    const quotes = [ "Sakit dalam perjuangan itu sementara. Namun jika menyerah, sakitnya terasa selamanya.", "Disiplin adalah jembatan antara tujuan dan pencapaian.", "Jangan berhenti ketika lelah. Berhentilah ketika selesai."];
    let logs = JSON.parse(localStorage.getItem('stanTrackerLogs_Final')) || [];
    let activePunishments = JSON.parse(localStorage.getItem('stanTrackerPunishments_Final')) || [];
    const saveLogs = () => localStorage.setItem('stanTrackerLogs_Final', JSON.stringify(logs));
    const savePunishments = () => localStorage.setItem('stanTrackerPunishments_Final', JSON.stringify(activePunishments));

    // === FUNGSI LOGIKA UTAMA ===
    const getWeekInfo = (date) => {
        const today = new Date(date); const dayOfWeek = today.getDay();
        const monday = new Date(today); const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        monday.setDate(today.getDate() + diffToMonday); monday.setHours(0, 0, 0, 0);
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
        const options = { day: 'numeric', month: 'short' };
        return { start: monday, end: sunday, rangeText: `${monday.toLocaleDateString('id-ID', options)} - ${sunday.toLocaleDateString('id-ID', options)}` };
    };

    const isDateInWeek = (date, weekInfo) => { const checkDate = new Date(date); return checkDate >= weekInfo.start && checkDate <= weekInfo.end; };

    const checkForFailures = () => {
        const lastWeekInfo = getWeekInfo(new Date(new Date().setDate(new Date().getDate() - 7)));
        activePunishments = []; 
        for (const activity in weeklyTargets) {
            const targetValue = weeklyTargets[activity].target;
            const logsLastWeek = logs.filter(log => log.activity === activity && isDateInWeek(new Date(log.date), lastWeekInfo));
            let progress = 0;
            if (["TIU", "TWK", "TKP", "TPA/TPS", "Bahasa Inggris", "Shuttle Run"].includes(activity)) { progress = logsLastWeek.length; } 
            else { progress = logsLastWeek.reduce((sum, log) => sum + (parseFloat(log.details) || 0), 0); }
            if (progress < targetValue) { activePunishments.push({ activity: activity, task: punishments[activity] }); }
        }
        savePunishments();
    };

    const renderPunishments = () => {
        punishmentSection.innerHTML = '';
        if (activePunishments.length > 0) {
            let listHtml = '<h2>🚨 Tugas Tambahan Minggu Lalu!</h2>';
            activePunishments.forEach((p, index) => {
                listHtml += `<div class="punishment-item" data-index="${index}"><p class="punishment-text"><strong>${p.activity}:</strong> ${p.task}</p><button class="dismiss-punishment-btn">Selesai</button></div>`;
            });
            punishmentSection.innerHTML = listHtml;
            punishmentSection.classList.remove('hide');
        } else { punishmentSection.classList.add('hide'); }
    };

    const renderDashboard = () => {
        const currentWeekInfo = getWeekInfo(new Date());
        dashboardTitle.textContent = `Progres Minggu Ini (${currentWeekInfo.rangeText})`;
        targetContainer.innerHTML = '';
        for (const activity in weeklyTargets) {
            const targetData = weeklyTargets[activity];
            const targetValue = targetData.target;
            const logsThisWeek = logs.filter(log => log.activity === activity && isDateInWeek(new Date(log.date), currentWeekInfo));
            let currentProgress = 0;
            if (["TIU", "TWK", "TKP", "TPA/TPS", "Bahasa Inggris", "Shuttle Run"].includes(activity)) { currentProgress = logsThisWeek.length; } 
            else { currentProgress = logsThisWeek.reduce((sum, log) => sum + (parseFloat(log.details) || 0), 0); }
            const progressPercentage = Math.min((currentProgress / targetValue) * 100, 100);
            const targetItem = document.createElement('div');
            targetItem.classList.add('target-item');
            targetItem.innerHTML = `<div class="label"><span>${activity}</span><span>${currentProgress} / ${targetValue} ${targetData.unit}</span></div><div class="progress-bar"><div class="progress-bar-inner" style="width: ${progressPercentage}%;"></div></div>`;
            targetContainer.appendChild(targetItem);
        }
        historyTableBody.innerHTML = '';
        const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
        sortedLogs.forEach(log => {
            const row = historyTableBody.insertRow();
            row.innerHTML = `<td>${new Date(log.date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short'})}</td><td>${log.activity}</td><td>${log.details || ''}</td><td><button class="delete-btn" data-id="${log.id}">🗑️</button></td>`;
        });
    };

    const addLog = (activity) => {
        let details = "1"; let unit = "sesi";
        let isAcademic = ["TIU", "TWK", "TKP", "TPA/TPS", "Bahasa Inggris"].includes(activity);
        if (isAcademic) {
            details = prompt(`Detail untuk sesi ${activity} (opsional):`, "");
            if (details === null) return;
            if (details.trim() === "") details = "1 Sesi Selesai";
        } else if (activity !== "Shuttle Run") {
             details = prompt(`Masukkan jumlah untuk ${activity} (contoh: 30 untuk repetisi, 5 untuk km):`);
             if (details === null || isNaN(parseFloat(details)) || parseFloat(details) <= 0) { alert("Harap masukkan angka yang valid."); return; }
             unit = weeklyTargets[activity].unit;
        }
        logs.push({ id: Date.now(), date: new Date().toISOString(), activity: activity, details: details.trim(), unit: unit });
        saveLogs();
        renderDashboard();
    };

    // --- Logika untuk Accordion ---
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('active');
            const content = header.nextElementSibling;
            content.style.maxHeight = content.style.maxHeight ? null : content.scrollHeight + "px";
        });
    });

    // === INISIALISASI PROGRAM ===
    const init = () => {
        const lastCheck = localStorage.getItem('stanTrackerLastCheck_Final');
        const lastCheckDate = lastCheck ? new Date(parseInt(lastCheck)) : null;
        if (!lastCheckDate || getWeekInfo(new Date()).rangeText !== getWeekInfo(lastCheckDate).rangeText) {
             if (lastCheckDate) { checkForFailures(); }
            localStorage.setItem('stanTrackerLastCheck_Final', new Date().getTime().toString());
        }
        motivationalQuote.innerText = quotes[Math.floor(Math.random() * quotes.length)];
        renderPunishments();
        renderDashboard();
    };

    // === EVENT LISTENERS ===
    quickAddButtonsContainer.addEventListener('click', (e) => { if (e.target.classList.contains('quick-btn')) addLog(e.target.dataset.activity); });
    historyTableBody.addEventListener('click', (e) => { if (e.target.classList.contains('delete-btn')) { const logId = parseInt(e.target.dataset.id); logs = logs.filter(log => log.id !== logId); saveLogs(); renderDashboard(); } });
    punishmentSection.addEventListener('click', (e) => { if (e.target.classList.contains('dismiss-punishment-btn')) { const itemToRemove = e.target.closest('.punishment-item'); const index = parseInt(itemToRemove.dataset.index); activePunishments.splice(index, 1); savePunishments(); renderPunishments(); } });
    
    init();
});