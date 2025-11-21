-- Add sub_account_id to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

-- Add sub_account_id to capital_log table
ALTER TABLE capital_log ADD COLUMN IF NOT EXISTS sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

-- Add sub_account_id to custom_dashboard_widgets table
ALTER TABLE custom_dashboard_widgets ADD COLUMN IF NOT EXISTS sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

-- Add sub_account_id to journal_entries table
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

-- Add sub_account_id to psychology_logs table
ALTER TABLE psychology_logs ADD COLUMN IF NOT EXISTS sub_account_id UUID REFERENCES sub_accounts(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_sub_account_id ON trades(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_capital_log_sub_account_id ON capital_log(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboard_widgets_sub_account_id ON custom_dashboard_widgets(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_sub_account_id ON journal_entries(sub_account_id);
CREATE INDEX IF NOT EXISTS idx_psychology_logs_sub_account_id ON psychology_logs(sub_account_id);