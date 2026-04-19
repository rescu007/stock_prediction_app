import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from models import db, User, Watchlist
from utils.data_fetcher import fetch_stock_data, get_indian_stocks_batch, get_foreign_stocks_batch, get_news_sentiment
from utils.ml_logic import prepare_and_train_model
import traceback

app = Flask(__name__)
# Configurations
app.config['SECRET_KEY'] = 'dev_trading_super_secret_key'
# Ensure database is created in the same folder as the app
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'trading.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.login_view = 'auth_login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Create DB schema before first request if it doesn't exist
with app.app_context():
    db.create_all()

# --- Auth Routes ---
@app.route('/login', methods=['GET', 'POST'])
def auth_login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        user = User.query.filter_by(username=username).first()
        if user and user.check_password(password):
            login_user(user)
            return redirect(url_for('dashboard'))
        flash('Invalid username or password')
    return render_template('auth.html', is_login=True)

@app.route('/register', methods=['GET', 'POST'])
def auth_register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))
    
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
        else:
            new_user = User(username=username)
            new_user.set_password(password)
            db.session.add(new_user)
            db.session.commit()
            login_user(new_user)
            return redirect(url_for('dashboard'))
    return render_template('auth.html', is_login=False)

@app.route('/logout')
@login_required
def auth_logout():
    logout_user()
    return redirect(url_for('auth_login'))

# --- Dashboard & View Routes ---
@app.route('/')
def dashboard():
    # Show main market overview
    return render_template('dashboard.html')

@app.route('/indian_stocks')
def indian_stocks():
    return render_template('indian_stocks.html')

@app.route('/foreign_stocks')
def foreign_stocks():
    return render_template('foreign_stocks.html')

@app.route('/predict_detail')
def predict_detail():
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    return render_template('predict_detail.html', ticker=ticker)

# --- API Routes ---
@app.route('/api/watchlist', methods=['GET', 'POST'])
@login_required
def handle_watchlist():
    if request.method == 'POST':
        ticker = request.json.get('ticker')
        if not ticker:
            return jsonify({'error': 'No ticker provided'}), 400
        existing = Watchlist.query.filter_by(user_id=current_user.id, ticker=ticker).first()
        if existing:
            # Toggle off
            db.session.delete(existing)
            db.session.commit()
            return jsonify({'status': 'removed'})
        else:
            # Toggle on
            w = Watchlist(user_id=current_user.id, ticker=ticker)
            db.session.add(w)
            db.session.commit()
            return jsonify({'status': 'added'})
    else:
        # GET returns user's watchlist
        watchlists = Watchlist.query.filter_by(user_id=current_user.id).all()
        return jsonify({'watchlist': [w.ticker for w in watchlists]})

@app.route('/api/indian_stocks_batch')
def api_indian_stocks_batch():
    try:
        data = get_indian_stocks_batch()
        return jsonify(data)
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/foreign_stocks_batch')
def api_foreign_stocks_batch():
    try:
        data = get_foreign_stocks_batch()
        return jsonify(data)
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict_advanced/<ticker>')
def api_predict_advanced(ticker):
    try:
        days = int(request.args.get('days', 30))
        # 1. Fetch raw DF
        df = fetch_stock_data(ticker, period='2y')
        if df is None or len(df) < 100:
            return jsonify({'error': f'Not enough historical data for {ticker}.'}), 404

        # 2. Get News Sentiment 
        sentiment_score, sentiment_label = get_news_sentiment(ticker)

        # 3. Train Model (LSTM) and get signals 
        results = prepare_and_train_model(df, prediction_days=days)

        # Add sentiment to results payload
        results['sentiment_score'] = sentiment_score
        results['sentiment_label'] = sentiment_label
        results['ticker'] = ticker
        
        # Calculate heuristics
        current_price = results['latest_close']
        pred_end_price = results['future_predictions'][-1]
        
        signal = "HOLD"
        # arbitrary +2% = buy, -2% = sell
        if pred_end_price > current_price * 1.02:
            signal = "BUY"
        elif pred_end_price < current_price * 0.98:
            signal = "SELL"
            
        results['trade_signal'] = signal

        return jsonify(results)
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
