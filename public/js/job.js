pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

class JobRecommendations {
    constructor() {
        this.uploadBtn = document.getElementById('upload-btn');
        this.resumeUpload = document.getElementById('resume-upload');
        this.uploadAnimation = document.getElementById('upload-animation');
        this.statusText = document.querySelector('.status-text');
        this.progressBar = document.querySelector('.progress-bar');
        this.progressContainer = document.querySelector('.progress-bar-container');
        this.recommendationsGrid = document.querySelector('.recommendations-grid');
        this.apiKey = 'YOUR_JSEARCH_API_KEY'; // Replace with your actual API key

        this.initializeUpload();
    }

    initializeUpload() {
        this.uploadBtn.addEventListener('click', () => {
            if (this.resumeUpload.files.length > 0) {
                this.handleFile(this.resumeUpload.files[0]);
            } else {
                this.statusText.textContent = 'Please select a PDF file first';
            }
        });

        this.resumeUpload.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.statusText.textContent = 'File selected: ' + e.target.files[0].name;
            }
        });
    }

    async handleFile(file) {
        if (file.type !== 'application/pdf') {
            this.statusText.textContent = 'Please upload a PDF file';
            return;
        }

        this.progressContainer.style.display = 'block';
        this.statusText.textContent = 'Processing resume...';
        this.uploadAnimation.style.display = 'block';
        
        try {
            const text = await this.extractTextFromPDF(file);
            const keywords = this.extractKeywords(text);
            const jobs = await this.fetchJobRecommendations(keywords);
            
            this.statusText.textContent = 'Resume processed successfully!';
            setTimeout(() => {
                this.uploadAnimation.style.display = 'none';
            }, 2000);
            
            this.displayJobs(jobs.data || []);
        } catch (error) {
            console.error('Error processing file:', error);
            this.statusText.textContent = 'Error processing resume. Please try again.';
            this.uploadAnimation.style.display = 'none';
        }

        this.progressContainer.style.display = 'none';
    }

    async extractTextFromPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(' ');
            this.progressBar.style.width = `${(i / pdf.numPages) * 100}%`;
        }

        return text;
    }

    extractKeywords(text) {
        // Simple keyword extraction - enhance this based on your needs
        const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to']);
        const words = text.toLowerCase().match(/\b\w+\b/g) || [];
        const keywords = words.filter(word => 
            word.length > 3 && !commonWords.has(word)
        );
        return [...new Set(keywords)].slice(0, 10);
    }

    async fetchJobRecommendations(keywords) {
        const options = {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': this.apiKey,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
            }
        };

        const query = keywords.join(' ');
        const response = await fetch(
            `https://jsearch.p.rapidapi.com/search?query=${query}&page=1&num_pages=1`,
            options
        );
        return await response.json();
    }

    displayJobs(jobs) {
        this.recommendationsGrid.innerHTML = jobs.map(job => `
            <div class="job-card">
                <h3>${job.job_title}</h3>
                <p class="company">${job.employer_name}</p>
                <p class="location">${job.job_city || 'Remote'}, ${job.job_country}</p>
                <p class="salary">${job.job_salary || 'Salary not specified'}</p>
                <button class="apply-btn" onclick="window.open('${job.job_apply_link}', '_blank')">
                    Apply Now
                </button>
            </div>
        `).join('');

        this.recommendationsGrid.classList.add('visible');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JobRecommendations();
});



