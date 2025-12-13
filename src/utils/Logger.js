class Logger {
    constructor(context) {
        this.context = context;
    }

    getRequestMetadata() {
        const metadata = {
            timestamp: new Date().toISOString(),
            invocationId: this.context?.invocationId || 'unknown',
            functionName: this.context?.functionName || 'unknown'
        };

        if (this.context?.req) {
            metadata.method = this.context.req.method;
            metadata.url = this.context.req.url;
            metadata.headers = {
                'user-agent': this.context.req.headers['user-agent'],
                'content-type': this.context.req.headers['content-type']
            };
        }

        return metadata;
    }

    info(message, data = {}) {
        const logEntry = {
            level: 'INFO',
            message,
            ...this.getRequestMetadata(),
            data: this.sanitizeData(data)
        };
        this.context?.log(JSON.stringify(logEntry));
    }

    warn(message, data = {}) {
        const logEntry = {
            level: 'WARN',
            message,
            ...this.getRequestMetadata(),
            data: this.sanitizeData(data)
        };
        this.context?.log(JSON.stringify(logEntry));
    }

    error(message, error = null, data = {}) {
        const logEntry = {
            level: 'ERROR',
            message,
            ...this.getRequestMetadata(),
            error: error ? {
                message: error.message,
                stack: error.stack,
                name: error.name
            } : null,
            data: this.sanitizeData(data)
        };
        this.context?.log(JSON.stringify(logEntry));
    }

    debug(message, data = {}) {
        const logEntry = {
            level: 'DEBUG',
            message,
            ...this.getRequestMetadata(),
            data: this.sanitizeData(data)
        };
        this.context?.log(JSON.stringify(logEntry));
    }

    logInput(operation, inputData) {
        this.info(`Input received for ${operation}`, {
            operation,
            input: this.sanitizeData(inputData)
        });
    }

    logBeforeDbOperation(operation, data) {
        this.debug(`Before ${operation}`, {
            operation,
            data: this.sanitizeData(data)
        });
    }

    logAfterDbOperation(operation, result) {
        this.info(`After ${operation}`, {
            operation,
            result: this.sanitizeData(result)
        });
    }

    logBeforeJsonRead(fileName) {
        this.debug(`Before reading JSON file: ${fileName}`, {
            operation: 'read_json',
            fileName
        });
    }

    logAfterJsonRead(fileName, data) {
        this.debug(`After reading JSON file: ${fileName}`, {
            operation: 'read_json',
            fileName,
            recordCount: Array.isArray(data) ? data.length : (data ? 1 : 0)
        });
    }

    sanitizeData(data) {
        if (!data || typeof data !== 'object') {
            return data;
        }

        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'authorization'];
        const sanitized = { ...data };

        for (const key in sanitized) {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '***REDACTED***';
            } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = this.sanitizeData(sanitized[key]);
            }
        }

        return sanitized;
    }
}

module.exports = { Logger };

