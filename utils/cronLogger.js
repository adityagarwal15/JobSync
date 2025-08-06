const fs = require('fs').promises;
const path = require('path');

class CronLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  async ensureLogDir() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }

  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      // Write to daily log file
      const dateStr = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logDir, `cron-${dateStr}.log`);
      await fs.appendFile(logFile, logLine);

      // Also log to console with formatting
      const formattedTime = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: true,
      });
      console.log(`[${formattedTime}] [${level.toUpperCase()}] ${message}`, data || '');
    } catch (error) {
      console.error('Failed to write log:', error);
    }
  }

  info(message, data) {
    return this.log('info', message, data);
  }

  error(message, data) {
    return this.log('error', message, data);
  }

  warn(message, data) {
    return this.log('warn', message, data);
  }

  success(message, data) {
    return this.log('success', message, data);
  }

  async getRecentLogs(days = 7) {
    try {
      const logs = [];
      const now = new Date();

      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        const logFile = path.join(this.logDir, `cron-${dateStr}.log`);

        try {
          const content = await fs.readFile(logFile, 'utf8');
          const entries = content
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => {
              try {
                return JSON.parse(line);
              } catch {
                return null;
              }
            })
            .filter((entry) => entry !== null);

          logs.push(...entries);
        } catch (error) {
          // File doesn't exist for this date
        }
      }

      return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Failed to read logs:', error);
      return [];
    }
  }

  async cleanupOldLogs(keepDays = 30) {
    try {
      const files = await fs.readdir(this.logDir);
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - keepDays * 24 * 60 * 60 * 1000);

      for (const file of files) {
        if (file.startsWith('cron-') && file.endsWith('.log')) {
          const dateStr = file.replace('cron-', '').replace('.log', '');
          const fileDate = new Date(dateStr);

          if (fileDate < cutoffDate) {
            await fs.unlink(path.join(this.logDir, file));
            console.log(`Cleaned up old log file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }
}

module.exports = new CronLogger();
