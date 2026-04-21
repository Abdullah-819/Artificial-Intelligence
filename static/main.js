document.addEventListener('DOMContentLoaded', () => {
    console.log("Supersonic AI Dashboard Loaded - Liquid Glass Theme Active");

    const summarizeBtn = document.getElementById('summarizeBtn');
    const urlInput = document.getElementById('urlInput');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressStatus = document.getElementById('progressStatus');
    
    // Wireframe Components
    const summaryText = document.getElementById('summaryText');
    const simpleSummary = document.getElementById('simpleSummary');
    const pointsList = document.getElementById('pointsList');
    const transcriptText = document.getElementById('transcriptText');
    const videoThumb = document.getElementById('videoThumb');
    const videoTitle = document.getElementById('videoTitle');
    const videoAuthor = document.getElementById('videoAuthor');

    // Smooth Scrolling for Sidebar Routes
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetEl = document.querySelector(targetId);
            
            // Update Active State
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    summarizeBtn.addEventListener('click', performSummarization);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSummarization();
    });

    async function performSummarization() {
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset UI
        progressContainer.classList.remove('hidden');
        summarizeBtn.disabled = true;
        summarizeBtn.innerText = 'PROCESSING...';
        updateProgress(5, 'Connecting to Neural Hub...');
        
        transcriptText.innerText = "Initiating signal decomposition...";
        summaryText.innerText = "";
        pointsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Filtering signals...</p>';

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
                        
                        if (data.result) {
                            displayResults(data.result);
                        }
                    }
                }
            }

        } catch (err) {
            updateProgress(100, `Signal Failed: ${err.message}`);
            progressStatus.style.color = '#f87171';
            transcriptText.innerText = `Error: ${err.message}`;
        } finally {
            summarizeBtn.disabled = false;
            summarizeBtn.innerText = 'GENERATE TRANSCRIPTION';
            setTimeout(() => { progressContainer.classList.add('hidden'); }, 8000);
        }
    }

    function updateProgress(percent, status) {
        progressFill.style.width = `${percent}%`;
        progressStatus.innerText = status;
    }

    function displayResults(data) {
        // Metadata
        videoThumb.src = data.metadata.thumbnail;
        videoTitle.innerText = data.metadata.title;
        videoAuthor.innerText = data.metadata.author;

        // Content
        simpleSummary.innerText = data.simple_summary;
        summaryText.innerText = data.summary;
        transcriptText.innerText = data.transcript;

        // Bullet Points
        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.gap = '10px';
            div.style.padding = '10px';
            div.style.background = 'rgba(255,255,255,0.03)';
            div.style.borderRadius = '10px';
            div.innerHTML = `<i class="fa-solid fa-square-rss" style="color: var(--accent); margin-top: 4px;"></i> <p style="font-size: 0.85rem; font-weight: 600;">${point}</p>`;
            pointsList.appendChild(div);
        });

        // Final Scroll to Thumbnail to show results
        videoThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Translation Logic (Reset capability)
    const originalContent = new Map();
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
