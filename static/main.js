document.addEventListener('DOMContentLoaded', () => {
    console.log("Quantum AI Dashboard Loaded - Neural Core Active");

    const summarizeBtn = document.getElementById('summarizeBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const urlInput = document.getElementById('urlInput');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressStatus = document.getElementById('progressStatus');
    
    // Components
    const summaryText = document.getElementById('summaryText');
    const simpleSummary = document.getElementById('simpleSummary');
    const pointsList = document.getElementById('pointsList');
    const transcriptText = document.getElementById('transcriptText');
    const captionsInfo = document.getElementById('captionsInfo');
    
    // Metadata Components
    const videoThumb = document.getElementById('videoThumb');
    const videoTitle = document.getElementById('videoTitle');
    const videoAuthor = document.getElementById('videoAuthor');
    const videoMetaMini = document.getElementById('videoMetaMini');
    const miniThumb = document.getElementById('miniThumb');
    const miniTitle = document.getElementById('miniTitle');

    const originalContent = new Map();

    summarizeBtn.addEventListener('click', performSummarization);
    refreshBtn.addEventListener('click', () => window.location.reload());
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSummarization();
    });

    async function performSummarization() {
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI for new analysis
        progressContainer.style.display = 'block';
        summarizeBtn.disabled = true;
        summarizeBtn.innerText = 'PROCESSING...';
        updateProgress(0, 'Initializing Neural Signal...');
        
        transcriptText.innerText = "Connecting to video stream...";
        summaryText.innerText = "Processing summary...";
        pointsList.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted);">Extracting points...</p>';

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

                        // If it's a progress update, check if we have metadata yet
                        // (In a real implementation, metadata might arrive mid-stream)
                        // For now, we wait for the final result or update if the backend sends it early
                        
                        if (data.result) {
                            displayResults(data.result);
                        } else if (data.progress > 25 && data.status.includes("Extracting")) {
                            // If we were using a more granular stream, we'd update metadata here
                        }
                    }
                }
            }

        } catch (err) {
            updateProgress(100, `Signal Error: ${err.message}`);
            progressStatus.style.color = '#ee5d50';
            transcriptText.innerText = `Error: ${err.message}`;
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
        // Metadata & Mini Thumb
        videoThumb.src = data.metadata.thumbnail;
        videoTitle.innerText = data.metadata.title;
        videoAuthor.innerText = data.metadata.author;
        
        videoMetaMini.classList.remove('hidden');
        miniThumb.src = data.metadata.thumbnail;
        miniTitle.innerText = data.metadata.title;

        // Content
        simpleSummary.innerText = data.simple_summary;
        summaryText.innerText = data.summary;
        transcriptText.innerText = data.transcript;
        captionsInfo.innerText = `Transcribed ${data.transcript.split(' ').length} words successfully. Signal quality 100%.`;

        // Recaptulation (Key Points)
        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const div = document.createElement('div');
            div.className = 'point-item';
            div.innerHTML = `<i class="fa-solid fa-check-double"></i> <span>${point}</span>`;
            pointsList.appendChild(div);
        });

        // Smooth scroll
        document.getElementById('resultsGrid').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
