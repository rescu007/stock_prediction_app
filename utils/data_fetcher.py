import yfinance as yf
import pandas as pd
from textblob import TextBlob
import requests

def fetch_stock_data(ticker_symbol, period='2y'):
    """
    Fetches historical stock data from Yahoo Finance including volume.
    Calculates technical indicators: MA20, EMA50
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        df = ticker.history(period=period)
        
        if df.empty:
            return None
            
        df = df[['Close', 'Open', 'High', 'Low', 'Volume']]
        df.dropna(inplace=True)
        
        # Calculate Moving Averages natively
        df['MA20'] = df['Close'].rolling(window=20).mean()
        df['EMA50'] = df['Close'].ewm(span=50, adjust=False).mean()
        
        df.bfill(inplace=True) # Backfill initial MAs
        
        return df
    except Exception as e:
        print(f"Error fetching data for {ticker_symbol}: {e}")
        return None

def get_indian_stocks_batch():
    """
    Returns a predefined list of top NIFTY 50 and SENSEX stocks 
    and fetches their current prices in a batch.
    """
    # Define a top subset for dashboard performance.
    # In a real heavy app, this could be cached or fetched async.
    nifty_top = [
        'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 
        'ICICIBANK.NS', 'HINDUNILVR.NS', 'SBIN.NS', 'BAJFINANCE.NS',
        'BHARTIARTL.NS', 'KOTAKBANK.NS', 'ITC.NS', 'LARSEN.NS',
        'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'SUNPHARMA.NS',
        'TITAN.NS', 'TATAMOTORS.NS', 'WIPRO.NS', 'HCLTECH.NS',
        'M&M.NS', 'BAJAJFINSV.NS', 'ULTRACEMCO.NS', 'NTPC.NS',
        'POWERGRID.NS', 'TECHM.NS', 'NESTLEIND.NS', 'ONGC.NS',
        'JSWSTEEL.NS', 'TATASTEEL.NS', 'GRASIM.NS', 'ADANIENT.NS',
        'ADANIPORTS.NS', 'COALINDIA.NS', 'BAJAJ-AUTO.NS', 'BRITANNIA.NS',
        'CIPLA.NS', 'TATACONSUM.NS', 'HDFCLIFE.NS', 'DRREDDY.NS'
    ]
    
    tickers = yf.Tickers(" ".join(nifty_top))
    
    results = []
    for symbol in nifty_top:
        try:
            # We get 2 days to calculate % change
            history = tickers.tickers[symbol].history(period='2d')
            if len(history) >= 2:
                prev_close = history['Close'].iloc[0]
                current = history['Close'].iloc[1]
                change_pct = ((current - prev_close) / prev_close) * 100
                
                results.append({
                    'symbol': symbol,
                    'name': symbol.split('.')[0], # rough approximation
                    'price': round(current, 2),
                    'change_pct': round(change_pct, 2)
                })
            elif len(history) == 1:
                results.append({
                    'symbol': symbol,
                    'name': symbol.split('.')[0],
                    'price': round(history['Close'].iloc[0], 2),
                    'change_pct': 0.0
                })
        except Exception as e:
            # Ignore fetching errors for individual stocks to prevent API fail
            print(e)
            
    # Sort to find gainers/losers
    results_sorted = sorted(results, key=lambda x: x['change_pct'], reverse=True)
    
    return {
        'top_gainers': results_sorted[:3],
        'top_losers': results_sorted[-3:],
        'all_stocks': results
    }

def get_foreign_stocks_batch():
    """
    Returns a predefined list of top Global/US tech stocks 
    and fetches their current prices in a batch.
    """
    global_top = [
        'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NFLX', 'AMD', 'SPY',
        'QQQ', 'INTC', 'CRM', 'ORCL', 'IBM', 'CSCO', 'ADBE', 'PYPL', 'DIS', 'NKE',
        'JPM', 'V', 'MA', 'WMT', 'JNJ', 'BAC', 'PG', 'HD', 'CVX', 'XOM',
        'KO', 'PEP', 'ABBV', 'MRK', 'PFE', 'TMO', 'AVGO', 'COST', 'CSX', 'UPS'
    ]
    
    tickers = yf.Tickers(" ".join(global_top))
    
    results = []
    for symbol in global_top:
        try:
            history = tickers.tickers[symbol].history(period='2d')
            if len(history) >= 2:
                prev_close = history['Close'].iloc[0]
                current = history['Close'].iloc[1]
                change_pct = ((current - prev_close) / prev_close) * 100
                
                results.append({
                    'symbol': symbol,
                    'name': symbol.split('.')[0],
                    'price': round(current, 2),
                    'change_pct': round(change_pct, 2)
                })
            elif len(history) == 1:
                results.append({
                    'symbol': symbol,
                    'name': symbol.split('.')[0],
                    'price': round(history['Close'].iloc[0], 2),
                    'change_pct': 0.0
                })
        except Exception as e:
            print(e)
            
    results_sorted = sorted(results, key=lambda x: x['change_pct'], reverse=True)
    
    return {
        'top_gainers': results_sorted[:3],
        'top_losers': results_sorted[-3:],
        'all_stocks': results
    }

def get_news_sentiment(ticker_symbol):
    """
    Fetches latest news from Yahoo Finance for the ticker and uses TextBlob
    to generate an average sentiment score (-1 to 1).
    """
    try:
        ticker = yf.Ticker(ticker_symbol)
        news = ticker.news
        
        if not news:
            return 0, "Neutral"
            
        total_polarity = 0
        for article in news[:5]:  # Analyze top 5 headlines
            title = article.get('title', '')
            blob = TextBlob(title)
            total_polarity += blob.sentiment.polarity
            
        avg_polarity = total_polarity / len(news[:5])
        
        if avg_polarity > 0.1:
            label = "Positive"
        elif avg_polarity < -0.1:
            label = "Negative"
        else:
            label = "Neutral"
            
        return round(avg_polarity, 2), label
    except Exception as e:
        print(f"Sentiment error: {e}")
        return 0, "Neutral"
