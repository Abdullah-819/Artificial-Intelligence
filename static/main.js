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

    console.log("Summarize Button Element:", summarizeBtn);

    // Smooth Scrolling for Sidebar Routes
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            console.log("Navigating to:", targetId);
            const targetEl = document.querySelector(targetId);
            
            // Update Active State
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    });

    if (summarizeBtn) {
        summarizeBtn.addEventListener('click', () => {
            console.log("Generate Button Clicked");
            performSummarization();
        });
    }

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSummarization();
    });

    async function performSummarization() {
        const url = urlInput.value.trim();
        console.log("URL Input Value:", url);
        
        if (!url) {
            alert("Please paste a valid YouTube URL first.");
            return;
        }

        // Reset UI
        if (progressContainer) progressContainer.classList.remove('hidden');
        summarizeBtn.disabled = true;
        summarizeBtn.innerText = 'PROCESSING...';
        updateProgress(5, 'Connecting to Neural Hub...');
        
        if (transcriptText) transcriptText.innerText = "Initiating signal decomposition...";
        if (summaryText) summaryText.innerText = "";
        if (pointsList) pointsList.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Filtering signals...</p>';

        try {
            console.log("Starting stream fetch...");
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
                        console.log("Stream data received:", data);
                        if (data.error) throw new Error(data.error);
                        
                        updateProgress(data.progress, data.status);
                        
                        if (data.result) {
                            displayResults(data.result);
                        }
                    }
                }
            }

        } catch (err) {
            console.error("Transcription Error:", err);
            updateProgress(100, `Signal Failed: ${err.message}`);
            if (progressStatus) progressStatus.style.color = '#f87171';
            if (transcriptText) transcriptText.innerText = `Error: ${err.message}`;
        } finally {
            summarizeBtn.disabled = false;
            summarizeBtn.innerText = 'GENERATE TRANSCRIPTION';
            setTimeout(() => { if (progressContainer) progressContainer.classList.add('hidden'); }, 8000);
        }
    }

    function updateProgress(percent, status) {
        if (progressFill) progressFill.style.width = `${percent}%`;
        if (progressStatus) progressStatus.innerText = status;
    }

    function displayResults(data) {
        console.log("Displaying final results:", data);
        // Metadata
        if (videoThumb) videoThumb.src = data.metadata.thumbnail;
        if (videoTitle) videoTitle.innerText = data.metadata.title;
        if (videoAuthor) videoAuthor.innerText = data.metadata.author;

        // Content
        if (simpleSummary) simpleSummary.innerText = data.simple_summary;
        if (summaryText) summaryText.innerText = data.summary;
        if (transcriptText) transcriptText.innerText = data.transcript;

        // Bullet Points
        if (pointsList) {
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
        }

        // Final Scroll to results
        if (videoThumb) videoThumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Translation Logic
    const originalContent = new Map();
    
    // PDF Download Logic
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', async () => {
            const transcript = transcriptText.innerText;
            const title = videoTitle.innerText || "Transcription";
            
            if (!transcript || transcript.includes("Awaiting") || transcript.includes("Initiating")) {
                alert("Please generate a transcription first.");
                return;
            }

            downloadPdfBtn.disabled = true;
            downloadPdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing...';

            try {
                const response = await fetch('/api/v1/download-pdf', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title: title, content: transcript })
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcription.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                } else {
                    throw new Error("Failed to generate PDF");
                }
            } catch (err) {
                console.error(err);
                alert("Could not download PDF. Please try again.");
            } finally {
                downloadPdfBtn.disabled = false;
                downloadPdfBtn.innerHTML = 'Download PDF <i class="fa-solid fa-file-pdf"></i>';
            }
        });
    }

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
