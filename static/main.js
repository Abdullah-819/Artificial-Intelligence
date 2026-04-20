document.addEventListener('DOMContentLoaded', () => {
    // Splash screen handler
    const splash = document.getElementById('splashScreen');
    setTimeout(() => {
        splash.classList.add('fade-out');
    }, 2500);

    const summarizeBtn = document.getElementById('summarizeBtn');
    const urlInput = document.getElementById('urlInput');
    const progressBar = document.getElementById('progressBar');
    const progressFill = document.querySelector('.progress-fill');
    
    const summaryText = document.getElementById('summaryText');
    const simpleSummaryText = document.getElementById('simpleSummaryText');
    const pointsList = document.getElementById('pointsList');
    const transcriptText = document.getElementById('transcriptText');
    
    // Media elements
    const videoThumb = document.getElementById('videoThumb');
    const videoTitle = document.getElementById('videoTitle');
    const videoAuthor = document.getElementById('videoAuthor');
    const sentimentBadge = document.getElementById('sentimentBadge');

    summarizeBtn.addEventListener('click', performSummarization);
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSummarization();
    });

    async function performSummarization() {
        const url = urlInput.value.trim();
        if (!url) return;

        // Reset and start Loading
        progressFill.style.width = '0%';
        progressBar.classList.remove('hidden');
        summarizeBtn.disabled = true;
        
        // Progress Simulation
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress > 95) clearInterval(interval);
            progressFill.style.width = `${progress}%`;
        }, 300);

        try {
            const response = await fetch('/api/v1/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);

            clearInterval(interval);
            progressFill.style.width = '100%';
            
            // Populate Data
            setTimeout(() => {
                displayResults(data);
                progressBar.classList.add('hidden');
            }, 500);

        } catch (err) {
            clearInterval(interval);
            progressBar.classList.add('hidden');
            document.getElementById('errorMsg').innerText = err.message;
        } finally {
            summarizeBtn.disabled = false;
        }
    }

    function displayResults(data) {
        // Metadata
        videoThumb.src = data.metadata.thumbnail;
        videoTitle.innerText = data.metadata.title;
        videoAuthor.innerText = data.metadata.author;
        
        sentimentBadge.innerText = data.sentiment;
        sentimentBadge.className = `sentiment-badge sentiment-${data.sentiment}`;

        // Summaries
        summaryText.innerText = data.summary;
        simpleSummaryText.innerText = data.simple_summary;

        // Insights
        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fa-solid fa-arrow-right-long" style="color:var(--primary);margin-right:8px"></i> ${point}`;
            pointsList.appendChild(li);
        });

        transcriptText.innerText = data.transcript;
    }

    // Toggle Transcript
    const toggle = document.getElementById('toggleTranscript');
    const body = document.getElementById('transcriptBody');
    const arrow = document.querySelector('.arrow');
    
    toggle.addEventListener('click', () => {
        body.classList.toggle('hidden');
        body.classList.toggle('visible');
        arrow.classList.toggle('open');
    });
});
