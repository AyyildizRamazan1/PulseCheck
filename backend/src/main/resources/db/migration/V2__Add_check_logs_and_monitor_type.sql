-- Add type column to monitors (MonitorType: HTTP, HTTPS, DNS, SSL, TCP, PING)
ALTER TABLE monitors ADD COLUMN IF NOT EXISTS type VARCHAR(10) NOT NULL DEFAULT 'HTTP';

CREATE INDEX IF NOT EXISTS idx_monitors_type ON monitors(type);

-- Create check_logs table
CREATE TABLE check_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monitor_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_milliseconds INTEGER,
    status_code INTEGER,
    error_message TEXT,
    checked_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE
);

CREATE INDEX idx_check_logs_monitor_id ON check_logs(monitor_id);
CREATE INDEX idx_check_logs_checked_at ON check_logs(checked_at);
CREATE INDEX idx_check_logs_status ON check_logs(status);

CREATE TRIGGER update_check_logs_updated_at BEFORE UPDATE ON check_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
