// dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const nestFileInput = document.getElementById('nest-file');
    const queryLogFileInput = document.getElementById('query-log-file');
    const opportunitiesContainer = document.getElementById('opportunities-container');
    const performanceContainer = document.getElementById('performance-container');

    nestFileInput.addEventListener('change', handleNestFile);
    queryLogFileInput.addEventListener('change', handleQueryLogFile);

    function handleNestFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const opportunities = parseNestFile(content);
            renderOpportunities(opportunities);
        };
        reader.readAsText(file);
    }

    function handleQueryLogFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                renderPerformance(data);
            } catch (error) {
                performanceContainer.innerHTML = `<p style="color: red;">Error parsing JSON: ${error.message}</p>`;
            }
        };
        reader.readAsText(file);
    }

    function parseNestFile(content) {
        const opportunities = [];
        const sections = content.split('---').filter(s => s.trim().length > 0 && s.includes('### 🦅'));
        
        sections.forEach(section => {
            const lines = section.trim().split('\n');
            const opportunity = {};
            
            opportunity.name = lines[0].replace('### 🦅', '').trim();
            
            lines.slice(1).forEach(line => {
                if (line.includes('- **Status:**')) opportunity.status = line.split(':')[1].trim();
                if (line.includes('- **Vulture Grade:**')) opportunity.grade = parseFloat(line.split(':')[1]);
                if (line.includes('- **The Gap:**')) opportunity.gap = line.split(':')[1].trim();
                if (line.includes('- **Build Brick Size:**')) opportunity.size = line.split(':')[1].trim();
                if (line.includes('- **Dossier & Build Plan:**')) {
                    const match = line.match(/\(([^)]+)\)/);
                    if (match) opportunity.dossierLink = match[1];
                }
            });
            opportunities.push(opportunity);
        });
        return opportunities;
    }

    function renderOpportunities(opportunities) {
        if (opportunities.length === 0) {
            opportunitiesContainer.innerHTML = '<p>No opportunities found in the file.</p>';
            return;
        }

        opportunitiesContainer.innerHTML = '';
        opportunities.sort((a, b) => (b.grade || 0) - (a.grade || 0)); // Sort by grade descending

        opportunities.forEach(opp => {
            const card = document.createElement('article');
            card.className = 'opportunity-card';
            
            const statusClass = opp.status === 'Build Queue' ? 'status-build-queue' : 'status-vulture-nest';
            card.classList.add(statusClass);

            const gradePercentage = ((opp.grade || 0) / 10) * 100;

            let dossierLinkHtml = '';
            if (opp.dossierLink) {
                dossierLinkHtml = `</br><a href="${opp.dossierLink}" target="_blank">View Full Dossier</a>`;
            }

            card.innerHTML = `
                <h4>${opp.name}</h4>
                <div class="meta">
                    <strong>Status:</strong> ${opp.status || 'N/A'} | 
                    <strong>Size:</strong> ${opp.size || 'N/A'}
                </div>
                <p><strong>The Gap:</strong> ${opp.gap || 'Not specified.'}</p>
                <p><strong>Grade: ${opp.grade || 'N/A'}/10</strong></p>
                <div class="grade-bar">
                    <div class="grade-fill" style="width: ${gradePercentage}%;"></div>
                </div>
                ${dossierLinkHtml}
            `;
            opportunitiesContainer.appendChild(card);
        });
    }

    function renderPerformance(data) {
        performanceContainer.innerHTML = '<canvas id="performance-chart"></canvas>'; // Clear and recreate canvas
        const ctx = document.getElementById('performance-chart').getContext('2d');

        const labels = data.map(d => new Date(d.timestamp).toLocaleDateString());
        const scores = data.map(d => d.score);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '864z Score per Cycle',
                    data: scores,
                    borderColor: 'rgb(0, 150, 255)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }
});
