document.addEventListener('DOMContentLoaded', () => {
    // Initialize Charts
    initCharts();

    const summarizeBtn = document.getElementById('summarizeBtn');
    const urlInput = document.getElementById('urlInput');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressStatus = document.getElementById('progressStatus');
    const resultsGrid = document.getElementById('resultsGrid');
    
    // Core Display Elements
    const summaryText = document.getElementById('summaryText');
    const simpleSummary = document.getElementById('simpleSummary');
    const pointsList = document.getElementById('pointsList');
    const transcriptText = document.getElementById('transcriptText');
    const videoThumb = document.getElementById('videoThumb');
    const videoTitle = document.getElementById('videoTitle');
    const videoAuthor = document.getElementById('videoAuthor');
    const sentimentBadge = document.getElementById('sentimentBadge');

    const originalContent = new Map();

    summarizeBtn.addEventListener('click', performSummarization);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSummarization();
    });

    async function performSummarization() {
        const url = urlInput.value.trim();
        if (!url) return;

        resultsGrid.classList.add('hidden');
        progressContainer.style.display = 'block';
        summarizeBtn.disabled = true;
        summarizeBtn.innerText = 'PROCESSING...';
        updateProgress(0, 'Initializing Neural Signal...');

        try {
            const response = await fetch('/api/v1/summarize-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.replace('data: ', ''));
                        if (data.error) throw new Error(data.error);
                        
                        updateProgress(data.progress, data.status);
                        if (data.result) displayResults(data.result);
                    }
                }
            }

        } catch (err) {
            updateProgress(100, `Signal Error: ${err.message}`);
            progressStatus.style.color = '#ee5d50';
        } finally {
            summarizeBtn.disabled = false;
            summarizeBtn.innerText = 'GENERATE';
            setTimeout(() => { progressContainer.style.display = 'none'; }, 5000);
        }
    }

    function updateProgress(percent, status) {
        progressFill.style.width = `${percent}%`;
        progressStatus.innerText = status;
    }

    function displayResults(data) {
        resultsGrid.classList.remove('hidden');
        videoThumb.src = data.metadata.thumbnail;
        videoTitle.innerText = data.metadata.title;
        videoAuthor.innerText = data.metadata.author;
        
        sentimentBadge.innerText = `Pattern Sentiment: ${data.sentiment}`;
        sentimentBadge.style.color = data.sentiment === 'Positive' ? '#05cd99' : (data.sentiment === 'Negative' ? '#ee5d50' : '#a3aed0');

        simpleSummary.innerText = data.simple_summary;
        summaryText.innerText = data.summary;
        transcriptText.innerText = data.transcript;

        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const div = document.createElement('div');
            div.className = 'point-item';
            div.innerHTML = `<i class="fa-solid fa-check-double"></i> <span>${point}</span>`;
            pointsList.appendChild(div);
        });

        resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function initCharts() {
        // Line Chart (Data Graphic)
        const ctxLine = document.getElementById('lineChart').getContext('2d');
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Video Processing Activity',
                    data: [150, 320, 180, 140, 250, 420, 350, 480, 280, 320, 410, 310],
                    borderColor: '#4318ff',
                    backgroundColor: 'rgba(67, 24, 255, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 5,
                    pointBackgroundColor: '#ffb547'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } }
                }
            }
        });

        // Pie Chart (Project Company)
        const ctxPie = document.getElementById('pieChart').getContext('2d');
        new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['Summaries', 'Transcripts', 'Analytics'],
                datasets: [{
                    data: [250, 150, 100],
                    backgroundColor: ['#4318ff', '#00d2ff', '#ffb547'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                }
            }
        });
    }

    // Translation Logic
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-translate')) {
            const btn = e.target;
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (!originalContent.has(targetId)) originalContent.set(targetId, targetEl.innerText);
            
            btn.disabled = true;
            btn.innerText = 'Analyzing...';
            try {
                const response = await fetch('/api/v1/translate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: targetEl.innerText, target_lang: 'ur' })
                });
                const data = await response.json();
                if (response.ok) {
                    targetEl.classList.add('urdu-text');
                    targetEl.innerText = data.translated_text;
                    btn.innerText = 'Reset Signal';
                    btn.classList.add('btn-reset');
                    btn.classList.remove('btn-translate');
                }
            } catch (err) { btn.innerText = 'Error!'; } finally { btn.disabled = false; }
        } else if (e.target.classList.contains('btn-reset')) {
            const btn = e.target;
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (originalContent.has(targetId)) {
                targetEl.innerText = originalContent.get(targetId);
                targetEl.classList.remove('urdu-text');
                btn.innerText = 'Urdu View';
                btn.classList.remove('btn-reset');
                btn.classList.add('btn-translate');
            }
        }
    });
});
