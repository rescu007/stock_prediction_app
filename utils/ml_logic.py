import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.neural_network import MLPRegressor
from sklearn.metrics import mean_squared_error
import datetime

def prepare_and_train_model(df, prediction_days=30, look_back=60, epochs=10):
    """
    MLPRegressor implementation fallback for Python 3.14 environments where TensorFlow isn't present
    """
    data = df.filter(['Close']).values
    scaler = MinMaxScaler(feature_range=(0,1))
    scaled_data = scaler.fit_transform(data)
    
    training_data_len = int(np.ceil(len(data) * 0.8))
    train_data = scaled_data[0:int(training_data_len), :]
    
    x_train = []
    y_train = []
    
    for i in range(look_back, len(train_data)):
        x_train.append(train_data[i-look_back:i, 0])
        y_train.append(train_data[i, 0])
        
    x_train, y_train = np.array(x_train), np.array(y_train)
    
    # MLP Regressor acting as the deep net 
    model = MLPRegressor(hidden_layer_sizes=(50, 50), activation='relu', solver='adam', 
                         max_iter=500, early_stopping=False, random_state=42)
    model.fit(x_train, y_train)
    
    test_data = scaled_data[training_data_len - look_back:, :]
    x_test = []
    y_test = data[training_data_len:, :]
    
    for i in range(look_back, len(test_data)):
        x_test.append(test_data[i-look_back:i, 0])
        
    x_test = np.array(x_test)
    
    predictions = model.predict(x_test).reshape(-1, 1)
    predictions = scaler.inverse_transform(predictions)
    
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    
    future_predictions = []
    last_60_days = scaled_data[-look_back:]
    curr_input = last_60_days.reshape((1, look_back))
    
    for _ in range(prediction_days):
        pred = model.predict(curr_input)
        future_predictions.append(pred[0])
        curr_input = np.roll(curr_input, -1, axis=1)
        curr_input[0, -1] = pred[0]
        
    future_predictions = np.array(future_predictions).reshape(-1, 1)
    future_predictions = scaler.inverse_transform(future_predictions)
    
    test_dates = df.index[training_data_len:].strftime('%Y-%m-%d').tolist()
    last_date = df.index[-1]
    
    future_dates = []
    for i in range(1, prediction_days + 1):
        next_date = last_date + datetime.timedelta(days=i)
        future_dates.append(next_date.strftime('%Y-%m-%d'))
        
    latest_close = data[-1][0]
        
    return {
        'rmse': round(float(rmse), 2),
        'latest_close': float(latest_close),
        'y_test_actual': [float(x) for x in y_test.flatten()],
        'y_test_pred': [float(x) for x in predictions.flatten()],
        'test_dates': test_dates,
        'future_predictions': [float(x) for x in future_predictions.flatten()],
        'future_dates': future_dates,
        
        'historical_dates': df.index.strftime('%Y-%m-%d').tolist(),
        'open': [float(x) for x in df['Open'].values],
        'high': [float(x) for x in df['High'].values],
        'low': [float(x) for x in df['Low'].values],
        'close': [float(x) for x in df['Close'].values],
        'volume': [float(x) for x in df['Volume'].values],
        'ma20': [float(x) for x in df['MA20'].values],
        'ema50': [float(x) for x in df['EMA50'].values]
    }
