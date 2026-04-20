document.addEventListener('DOMContentLoaded', () => {
    const summarizeBtn = document.getElementById('summarizeBtn');
    const urlInput = document.getElementById('urlInput');
    const resultsGrid = document.getElementById('resultsGrid');
    const loadingState = document.getElementById('loadingState');
    const errorMsg = document.getElementById('errorMsg');

    const summaryText = document.getElementById('summaryText');
    const pointsList = document.getElementById('pointsList');
    const transcriptText = document.getElementById('transcriptText');
    
    const toggleTranscript = document.getElementById('toggleTranscript');
    const transcriptBody = document.getElementById('transcriptBody');
    const toggleIcon = document.querySelector('.toggle-icon');

    // Handle Summarize Action
    summarizeBtn.addEventListener('click', performSummarization);
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSummarization();
    });

    async function performSummarization() {
        const url = urlInput.value.trim();
        if (!url) {
            showError('Please enter a valid YouTube URL');
            return;
        }

        // Reset UI
        clearError();
        resultsGrid.classList.add('hidden');
        document.getElementById('metadataHeader').classList.add('hidden');
        loadingState.classList.remove('hidden');
        summarizeBtn.disabled = true;

        try {
            const response = await fetch('/api/v1/summarize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            const data = await response.json();

            if (!response.ok) {
                const message = data.detail || 'An unexpected error occurred';
                throw new Error(message);
            }

            // Display Results
            displayResults(data);
        } catch (err) {
            showError(err.message);
        } finally {
            loadingState.classList.add('hidden');
            summarizeBtn.disabled = false;
        }
    }

    function displayResults(data) {
        // Metadata populate
        document.getElementById('videoTitle').innerText = data.metadata.title;
        document.getElementById('videoThumb').src = data.metadata.thumbnail;
        document.getElementById('videoAuthor').innerText = `By ${data.metadata.author}`;
        
        const badge = document.getElementById('sentimentBadge');
        badge.innerText = data.sentiment;
        badge.className = `sentiment-badge sentiment-${data.sentiment}`;
        
        document.getElementById('wordCount').innerText = data.transcript.split(' ').length;
        document.getElementById('metadataHeader').classList.remove('hidden');

        summaryText.innerText = data.summary;
        
        // Populate bullet points
        pointsList.innerHTML = '';
        data.key_points.forEach(point => {
            const li = document.createElement('li');
            li.innerText = point;
            pointsList.appendChild(li);
        });

        transcriptText.innerText = data.transcript;
        
        resultsGrid.classList.remove('hidden');
        resultsGrid.scrollIntoView({ behavior: 'smooth' });
    }

    // Toggle Transcript
    toggleTranscript.addEventListener('click', () => {
        transcriptBody.classList.toggle('hidden');
        toggleIcon.classList.toggle('rotate');
    });

    // Copy Summary Action
    document.getElementById('copySummary').addEventListener('click', () => {
        navigator.clipboard.writeText(summaryText.innerText);
        const originalText = document.getElementById('copySummary').innerHTML;
        document.getElementById('copySummary').innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => {
            document.getElementById('copySummary').innerHTML = originalText;
        }, 2000);
    });

    // New Summary Action
    document.getElementById('newSummary').addEventListener('click', () => {
        urlInput.value = '';
        resultsGrid.classList.add('hidden');
        urlInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function showError(msg) {
        errorMsg.innerText = msg;
        setTimeout(() => clearError(), 5000);
    }

    function clearError() {
        errorMsg.innerText = '';
    }
});
