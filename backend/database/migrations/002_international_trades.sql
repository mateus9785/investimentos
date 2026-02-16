CREATE TABLE IF NOT EXISTS international_trades (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  trade_date DATE NOT NULL,
  pnl_usd DECIMAL(15, 2) NOT NULL,
  exchange_rate DECIMAL(10, 4) NOT NULL,
  pnl_brl DECIMAL(15, 2) GENERATED ALWAYS AS (pnl_usd * exchange_rate) STORED,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE balances MODIFY COLUMN account_type ENUM('bank', 'broker', 'broker_international') NOT NULL;
