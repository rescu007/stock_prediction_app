document.addEventListener('DOMContentLoaded', () => {
    const predictBtn = document.getElementById('predict-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    const heroSection = document.getElementById('hero-section');
    const loadingSection = document.getElementById('loading-section');
    const resultDashboard = document.getElementById('result-dashboard');
    const errorMsg = document.getElementById('error-message');
    
    // Result elements
    const resTicker = document.getElementById('res-ticker');
    const resPrice = document.getElementById('res-price');
    const resTrend = document.getElementById('res-trend');
    const trendIcon = document.getElementById('trend-icon');
    const trendText = document.getElementById('trend-text');
    const resRmse = document.getElementById('res-rmse');
    
    predictBtn.addEventListener('click', async () => {
        const ticker = document.getElementById('ticker').value.trim();
        const days = document.getElementById('days').value;
        
        if (!ticker) {
            showError("Please enter a valid stock ticker symbol.");
            return;
        }
        
        errorMsg.classList.add('hidden');
        
        // Hide Hero, Show Loading
        heroSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        loadingSection.classList.add('flex');
        
        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ticker, days })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to predict stock data.');
            }
            
            // Populate Results
            resTicker.textContent = data.ticker;
            resPrice.textContent = `$${data.latest_price.toLocaleString()}`;
            resRmse.textContent = data.rmse;
            
            if (data.trend === 'Upward') {
                trendText.textContent = 'Upward';
                trendText.classList.remove('text-red-500');
                trendText.classList.add('text-success');
                trendIcon.innerHTML = `<svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>`;
            } else {
                trendText.textContent = 'Downward';
                trendText.classList.remove('text-success');
                trendText.classList.add('text-red-500');
                trendIcon.innerHTML = `<svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"></path></svg>`;
            }
            
            // Render Plotly Charts
            // Plotly expects target div ID, data, layout
            Plotly.newPlot('plot-historical', data.historical_plot.data, data.historical_plot.layout, {responsive: true});
            Plotly.newPlot('plot-comparative', data.comparative_plot.data, data.comparative_plot.layout, {responsive: true});
            Plotly.newPlot('plot-future', data.future_plot.data, data.future_plot.layout, {responsive: true});
            
            // Hide Loading, Show Dashboard
            loadingSection.classList.add('hidden');
            loadingSection.classList.remove('flex');
            resultDashboard.classList.remove('hidden');
            
        } catch (err) {
            // Restore Hero, Show Error
            loadingSection.classList.add('hidden');
            loadingSection.classList.remove('flex');
            heroSection.classList.remove('hidden');
            showError(err.message);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        // Clear inputs and reset UI
        document.getElementById('ticker').value = '';
        resultDashboard.classList.add('hidden');
        heroSection.classList.remove('hidden');
    });
    
    // Allow pressing purely "Enter" to trigger
    document.getElementById('ticker').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            predictBtn.click();
        }
    });

    function showError(message) {
        errorMsg.textContent = message;
        errorMsg.classList.remove('hidden');
    }
});
