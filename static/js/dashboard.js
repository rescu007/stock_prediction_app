document.addEventListener("DOMContentLoaded", () => {
    // 1. Sidebar Toggle
    const sidebarToggle = document.body.querySelector('#sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', event => {
            event.preventDefault();
            document.body.classList.toggle('sb-sidenav-toggled');
        });
    }

    // 2. Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const html = document.documentElement;
            if (html.getAttribute('data-bs-theme') === 'dark') {
                html.setAttribute('data-bs-theme', 'light');
                themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i> Theme';
            } else {
                html.setAttribute('data-bs-theme', 'dark');
                themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i> Theme';
            }
            // Trigger Plotly relayout if needed
        });
    }

    // 3. Indian Stocks Listing Logics
    const indianStocksBody = document.getElementById('indianStocksBody');
    if (indianStocksBody) {
        fetch('/api/indian_stocks_batch')
            .then(res => res.json())
            .then(data => {
                if (data.all_stocks && data.all_stocks.length > 0) {
                    indianStocksBody.innerHTML = '';
                    data.all_stocks.forEach(stock => {
                        let color = stock.change_pct >= 0 ? 'text-success' : 'text-danger';
                        let icon = stock.change_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                        let row = `
                            <tr>
                                <td class="fw-bold">${stock.symbol}</td>
                                <td>${stock.name}</td>
                                <td>₹${stock.price}</td>
                                <td class="${color}"><i class="fa-solid ${icon}"></i> ${stock.change_pct}%</td>
                                <td><a href="/predict_detail?ticker=${stock.symbol}" class="btn btn-sm btn-outline-primary">Analyze</a></td>
                            </tr>
                        `;
                        indianStocksBody.innerHTML += row;
                    });
                }
            })
            .catch(err => {
                indianStocksBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Failed to load live data</td></tr>';
            });
            
        // Table Search
        const searchInput = document.getElementById('tableSearch');
        if (searchInput) {
            searchInput.addEventListener('keyup', function() {
                const filter = searchInput.value.toLowerCase();
                const rows = indianStocksBody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    const symbolCol = rows[i].getElementsByTagName('td')[0];
                    if (symbolCol) {
                        const txtValue = symbolCol.textContent || symbolCol.innerText;
                        if (txtValue.toLowerCase().indexOf(filter) > -1) {
                            rows[i].style.display = "";
                        } else {
                            rows[i].style.display = "none";
                        }
                    }
                }
            });
        }
    }

    // 3.B. Foreign Stocks Listing Logics
    const foreignStocksBody = document.getElementById('foreignStocksBody');
    if (foreignStocksBody) {
        fetch('/api/foreign_stocks_batch')
            .then(res => res.json())
            .then(data => {
                if (data.all_stocks && data.all_stocks.length > 0) {
                    foreignStocksBody.innerHTML = '';
                    data.all_stocks.forEach(stock => {
                        let color = stock.change_pct >= 0 ? 'text-success' : 'text-danger';
                        let icon = stock.change_pct >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                        let row = `
                            <tr>
                                <td class="fw-bold">${stock.symbol}</td>
                                <td>${stock.name}</td>
                                <td>$${stock.price}</td>
                                <td class="${color}"><i class="fa-solid ${icon}"></i> ${stock.change_pct}%</td>
                                <td><a href="/predict_detail?ticker=${stock.symbol}" class="btn btn-sm btn-outline-primary">Analyze</a></td>
                            </tr>
                        `;
                        foreignStocksBody.innerHTML += row;
                    });
                }
            })
            .catch(err => {
                foreignStocksBody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Failed to load live data</td></tr>';
            });
            
        // Table Search
        const globalSearchInput = document.getElementById('globalTableSearch');
        if (globalSearchInput) {
            globalSearchInput.addEventListener('keyup', function() {
                const filter = globalSearchInput.value.toLowerCase();
                const rows = foreignStocksBody.getElementsByTagName('tr');
                for (let i = 0; i < rows.length; i++) {
                    const symbolCol = rows[i].getElementsByTagName('td')[0];
                    if (symbolCol) {
                        const txtValue = symbolCol.textContent || symbolCol.innerText;
                        if (txtValue.toLowerCase().indexOf(filter) > -1) {
                            rows[i].style.display = "";
                        } else {
                            rows[i].style.display = "none";
                        }
                    }
                }
            });
        }
    }

    // 4. Quick Dashboard Movers Logic
    const moversContainer = document.getElementById('moversContainer');
    if (moversContainer) {
        fetch('/api/indian_stocks_batch')
            .then(res => res.json())
            .then(data => {
                moversContainer.innerHTML = '';
                // Render Top Gainers only
                data.top_gainers.forEach(gainer => {
                    moversContainer.innerHTML += `
                        <div class="col-md-4 mb-2">
                            <div class="p-3 border rounded border-success bg-opacity-10 bg-success">
                                <h6 class="mb-1">${gainer.symbol}</h6>
                                <h4 class="mb-0 text-success">+${gainer.change_pct}%</h4>
                            </div>
                        </div>
                    `;
                });
            });
    }

    // 5. Watchlist Logic
    const watchlistContainer = document.getElementById('watchlistContainer');
    const toggleWatchlistBtn = document.getElementById('toggleWatchlistBtn');
    
    // Fetch for dashboard
    if (watchlistContainer) {
        fetch('/api/watchlist')
            .then(res => res.json())
            .then(data => {
                watchlistContainer.innerHTML = '';
                if (data.watchlist && data.watchlist.length > 0) {
                    data.watchlist.forEach(ticker => {
                        watchlistContainer.innerHTML += `
                            <li class="list-group-item d-flex justify-content-between align-items-center">
                                ${ticker}
                                <a href="/predict_detail?ticker=${ticker}" class="badge bg-primary rounded-pill text-decoration-none">Analyze</a>
                            </li>
                        `;
                    });
                } else {
                    watchlistContainer.innerHTML = '<li class="list-group-item text-muted text-center">Your watchlist is empty</li>';
                }
            });
    }

    // 6. Predict Detail API Logic
    const pageTickerEl = document.getElementById('pageTicker');
    if (pageTickerEl) {
        const ticker = pageTickerEl.value;
        const loaderUI = document.getElementById('loaderUI');
        const resultsUI = document.getElementById('resultsUI');
        
        // Handle Watchlist State Top Button
        if (toggleWatchlistBtn) {
            fetch('/api/watchlist')
                .then(res => res.json())
                .then(data => {
                    if (data.watchlist && data.watchlist.includes(ticker)) {
                        toggleWatchlistBtn.innerHTML = '<i class="fa-solid fa-star"></i> Remove Watchlist';
                        toggleWatchlistBtn.classList.replace('btn-outline-warning', 'btn-warning');
                    } else {
                        toggleWatchlistBtn.innerHTML = '<i class="fa-regular fa-star"></i> Add to Watchlist';
                        toggleWatchlistBtn.classList.replace('btn-warning', 'btn-outline-warning');
                    }
                });
                
            toggleWatchlistBtn.addEventListener('click', () => {
                fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ticker: ticker })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'added') {
                        toggleWatchlistBtn.innerHTML = '<i class="fa-solid fa-star"></i> Remove Watchlist';
                        toggleWatchlistBtn.classList.replace('btn-outline-warning', 'btn-warning');
                    } else {
                        toggleWatchlistBtn.innerHTML = '<i class="fa-regular fa-star"></i> Add to Watchlist';
                        toggleWatchlistBtn.classList.replace('btn-warning', 'btn-outline-warning');
                    }
                });
            });
        }

        // Fire LSTM Logic
        fetch(`/api/predict_advanced/${ticker}`)
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    loaderUI.innerHTML = `<h3 class="text-danger">Error: ${data.error}</h3>`;
                    return;
                }

                // Hide Loader, Show Content
                loaderUI.classList.add('d-none');
                resultsUI.classList.remove('d-none');

                // Fill KPI
                document.getElementById('resClose').innerText = data.latest_close.toFixed(2);
                document.getElementById('resRmse').innerText = data.rmse.toFixed(2);
                
                const sigBadge = document.getElementById('resSignal');
                sigBadge.innerText = data.trade_signal;
                if(data.trade_signal === "BUY") sigBadge.className = "fw-bold mb-0 text-success";
                if(data.trade_signal === "SELL") sigBadge.className = "fw-bold mb-0 text-danger";
                
                document.getElementById('sentimentBadge').innerText = `(${data.sentiment_label})`;
                document.getElementById('resSentiment').innerText = data.sentiment_score;

                // ----------------------------------------
                // Plotly Candlestick + MA
                // ----------------------------------------
                const candleTrace = {
                    x: data.historical_dates,
                    close: data.close,
                    high: data.high,
                    low: data.low,
                    open: data.open,
                    type: 'candlestick',
                    xaxis: 'x',
                    yaxis: 'y',
                    name: 'Price'
                };
                
                const ma20Trace = {
                    x: data.historical_dates,
                    y: data.ma20,
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: 'rgba(255, 165, 0, 0.8)', width: 2 },
                    name: 'MA 20'
                };
                
                const ema50Trace = {
                    x: data.historical_dates,
                    y: data.ema50,
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: 'rgba(128, 0, 128, 0.8)', width: 2 },
                    name: 'EMA 50'
                };

                const layoutTheme = document.documentElement.getAttribute('data-bs-theme') === 'dark' ? 
                    { paper_bgcolor: '#1e1e1e', plot_bgcolor: '#1e1e1e', font: { color: '#ffffff' } } : {};

                Plotly.newPlot('candlestickChart', [candleTrace, ma20Trace, ema50Trace], {
                    ...layoutTheme,
                    margin: { t: 10, r: 10, b: 30, l: 40 },
                    xaxis: { rangeslider: { visible: false } }
                }, {responsive: true});

                // ----------------------------------------
                // Plotly Test Predictions (Line)
                // ----------------------------------------
                Plotly.newPlot('testPredictChart', [
                    { x: data.test_dates, y: data.y_test_actual, type: 'scatter', mode: 'lines', name: 'Actual' },
                    { x: data.test_dates, y: data.y_test_pred, type: 'scatter', mode: 'lines', name: 'Predicted' }
                ], { ...layoutTheme, margin: { t: 10, r: 10, b: 30, l: 40 } }, {responsive: true});

                // ----------------------------------------
                // Plotly Future Predictions (Line)
                // ----------------------------------------
                Plotly.newPlot('futurePredictChart', [
                    { 
                        x: data.future_dates, 
                        y: data.future_predictions, 
                        type: 'scatter', mode: 'lines', name: 'Forecast',
                        line: { dash: 'dot', color: '#10b981', width: 3 }
                    }
                ], { ...layoutTheme, margin: { t: 10, r: 10, b: 30, l: 40 } }, {responsive: true});

            })
            .catch(err => {
                loaderUI.innerHTML = `<h3 class="text-danger">Internal API Error. Make sure you are running Python 3.10/3.11 with TensorFlow installed natively.</h3>`;
            });
    }
});
