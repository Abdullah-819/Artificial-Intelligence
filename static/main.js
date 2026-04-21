document.addEventListener('DOMContentLoaded', () => {
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

        // UI Initialization
        resultsGrid.classList.add('hidden');
        progressContainer.style.display = 'block';
        summarizeBtn.disabled = true;
        summarizeBtn.innerText = 'PROCESSING...';
        updateProgress(0, 'Connecting to Neural Core...');

        try {
            const response = await fetch('/api/v1/summarize-stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) throw new Error("Connection lost.");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop(); // Keep partial line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.replace('data: ', ''));
                        
                        if (data.error) {
                            throw new Error(data.error);
                        }

                        // Update Real-Time Progress
                        updateProgress(data.progress, data.status);

                        // If final result arrived
                        if (data.result) {
                            displayResults(data.result);
                        }
                    }
                }
            }

        } catch (err) {
            console.error(err);
            updateProgress(100, `Error: ${err.message}`);
            progressStatus.classList.add('text-danger');
        } finally {
            summarizeBtn.disabled = false;
            summarizeBtn.innerText = 'GENERATE';
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 3000);
        }
    }

    function updateProgress(percent, status) {
        progressFill.style.width = `${percent}%`;
        progressStatus.innerText = status;
    }

    function displayResults(data) {
        resultsGrid.classList.remove('hidden');
        
        // Metadata
        videoThumb.src = data.metadata.thumbnail;
        videoTitle.innerText = data.metadata.title;
        videoAuthor.innerText = data.metadata.author;
        
        // Sentiment
        sentimentBadge.innerText = `Sentiment: ${data.sentiment}`;
        sentimentBadge.style.background = getSentimentBg(data.sentiment);
        sentimentBadge.style.color = getSentimentColor(data.sentiment);

        // Content
        simpleSummary.innerText = data.simple_summary;
        summaryText.innerText = data.summary;
        transcriptText.innerText = data.transcript;

        // Key Points
        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const div = document.createElement('div');
            div.className = 'point-item';
            div.innerHTML = `
                <i class="fa-solid fa-circle-check"></i>
                <p style="font-size: 0.95rem; font-weight: 600;">${point}</p>
            `;
            pointsList.appendChild(div);
        });

        // Smooth scroll to results
        resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function getSentimentBg(s) {
        if (s === 'Positive') return '#e6fffb';
        if (s === 'Negative') return '#fff1f0';
        return '#f5f5f5';
    }

    function getSentimentColor(s) {
        if (s === 'Positive') return '#05cd99';
        if (s === 'Negative') return '#ee5d50';
        return '#a3aed0';
    }

    // Translation Logic
    document.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-translate')) {
            const btn = e.target;
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            if (!originalContent.has(targetId)) {
                originalContent.set(targetId, targetEl.innerText);
            }
            
            btn.disabled = true;
            btn.innerText = 'Translating...';
            
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
                    btn.innerText = 'Reset to English';
                    btn.classList.add('btn-reset');
                    btn.classList.remove('btn-translate');
                }
            } catch (err) {
                btn.innerText = 'Error!';
            } finally {
                btn.disabled = false;
            }
        } else if (e.target.classList.contains('btn-reset')) {
            const btn = e.target;
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            
            if (originalContent.has(targetId)) {
                targetEl.innerText = originalContent.get(targetId);
                targetEl.classList.remove('urdu-text');
                btn.innerText = 'Translate to Urdu';
                btn.classList.remove('btn-reset');
                btn.classList.add('btn-translate');
            }
        }
    });
});
