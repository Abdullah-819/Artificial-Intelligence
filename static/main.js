document.addEventListener('DOMContentLoaded', () => {
    // Splash screen handler
    const splash = document.getElementById('splashScreen');
    setTimeout(() => {
        splash.classList.add('fade-out');
        setTimeout(() => { splash.style.display = 'none'; }, 1000);
    }, 2500);

    const summarizeBtn = document.getElementById('summarizeBtn');
    const urlInput = document.getElementById('urlInput');
    const progressBar = document.getElementById('progressBar');
    
    // Core Display Elements
    const summaryText = document.getElementById('summaryText');
    const simpleSummaryText = document.getElementById('simpleSummaryText');
    const pointsList = document.getElementById('pointsList');
    const transcriptText = document.getElementById('transcriptText');
    
    // Metadata Elements
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

        // Reset UI
        progressBar.style.width = '0%';
        progressBar.classList.remove('hidden');
        summarizeBtn.disabled = true;
        
        // Progress Simulation for Professional feel
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 8;
            if (progress > 96) clearInterval(interval);
            progressBar.style.width = `${progress}%`;
        }, 200);

        try {
            const response = await fetch('/api/v1/summarize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.detail);

            clearInterval(interval);
            progressBar.style.width = '100%';
            
            setTimeout(() => {
                displayResults(data);
                progressBar.classList.add('hidden');
            }, 600);

        } catch (err) {
            clearInterval(interval);
            progressBar.classList.add('hidden');
            document.getElementById('errorMsg').innerText = `Error: ${err.message}`;
        } finally {
            summarizeBtn.disabled = false;
        }
    }

    function displayResults(data) {
        // Metadata populate
        videoThumb.src = data.metadata.thumbnail;
        videoTitle.innerText = data.metadata.title;
        videoAuthor.innerText = data.metadata.author;
        
        sentimentBadge.innerText = data.sentiment;
        sentimentBadge.className = `badge-tier sentiment-${data.sentiment}`;

        // Text populate
        summaryText.innerText = data.summary;
        simpleSummaryText.innerText = data.simple_summary;

        // Key points build
        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const div = document.createElement('div');
            div.className = 'point-item';
            div.innerHTML = `
                <i class="fa-solid fa-check-double point-icon"></i>
                <p>${point}</p>
            `;
            pointsList.appendChild(div);
        });

        transcriptText.innerText = data.transcript;
        
        // Smooth scroll to top of content
        window.scrollTo({ top: 300, behavior: 'smooth' });
    }

    // Toggle logic for transcript
    const toggle = document.getElementById('toggleTranscript');
    const body = document.getElementById('transcriptBody');
    const arrow = toggle.querySelector('.arrow');
    
    toggle.addEventListener('click', () => {
        body.classList.toggle('hidden');
        arrow.classList.toggle('rotate-90');
    });
});
