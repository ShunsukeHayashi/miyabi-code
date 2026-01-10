// ============================================================
// WindowName Bridge Injection Script
// ============================================================
// This script runs on the TARGET page (e.g., note.com/edit)
// It extracts file data from window.name and injects it into
// a file input element using the DataTransfer API.
// ============================================================

(function() {
    'use strict';

    const BRIDGE_KEY = '__windowNameBridge__';

    /**
     * Log with prefix for debugging
     */
    const log = (message, type = 'info') => {
        const prefix = '[WindowNameBridge]';
        const styles = {
            info: 'color: #4a90d9',
            success: 'color: #4caf50',
            error: 'color: #f44336',
            warn: 'color: #ff9800'
        };
        console.log(`%c${prefix} ${message}`, styles[type] || styles.info);
    };

    /**
     * Check if window.name contains bridge data
     */
    function hasBridgeData() {
        if (!window.name) return false;
        try {
            const data = JSON.parse(window.name);
            return data && data[BRIDGE_KEY] === true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Extract bridge data from window.name
     */
    function extractBridgeData() {
        if (!window.name) {
            throw new Error('window.name is empty');
        }

        const data = JSON.parse(window.name);
        if (!data[BRIDGE_KEY]) {
            throw new Error('No bridge data found in window.name');
        }

        log(`Bridge data found, timestamp: ${new Date(data.timestamp).toISOString()}`, 'info');
        return data;
    }

    /**
     * Convert Base64 data URL to Blob
     */
    function dataURLtoBlob(dataURL) {
        const parts = dataURL.split(',');
        const mime = parts[0].match(/:(.*?);/)[1];
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    /**
     * Create File object from bridge data
     */
    function createFileFromBridgeData(fileData) {
        const blob = dataURLtoBlob(fileData.data);
        const file = new File([blob], fileData.name, {
            type: fileData.type,
            lastModified: fileData.lastModified
        });
        log(`File created: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`, 'success');
        return file;
    }

    /**
     * Inject file into input element using DataTransfer API
     */
    function injectFile(file, inputElement) {
        // Create DataTransfer object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        // Set files property
        inputElement.files = dataTransfer.files;

        log(`File injected into input: ${inputElement.id || inputElement.name || 'unnamed'}`, 'success');

        // Dispatch change event
        const changeEvent = new Event('change', { bubbles: true });
        inputElement.dispatchEvent(changeEvent);
        log('Change event dispatched', 'success');

        // Also dispatch input event for frameworks that listen to it
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);

        return true;
    }

    /**
     * Find file input element on the page
     * @param {string} selector - CSS selector (optional)
     */
    function findFileInput(selector) {
        if (selector) {
            const el = document.querySelector(selector);
            if (el && el.type === 'file') return el;
        }

        // Default: find first file input
        const inputs = document.querySelectorAll('input[type="file"]');
        if (inputs.length > 0) {
            log(`Found ${inputs.length} file input(s)`, 'info');
            return inputs[0];
        }

        // Try to find hidden file inputs
        const hiddenInputs = document.querySelectorAll('input[type="file"][style*="display: none"], input[type="file"][hidden]');
        if (hiddenInputs.length > 0) {
            log(`Found ${hiddenInputs.length} hidden file input(s)`, 'info');
            return hiddenInputs[0];
        }

        return null;
    }

    /**
     * Main injection function
     * @param {Object} options - Configuration options
     * @param {string} options.selector - CSS selector for file input
     * @param {boolean} options.clearAfterInject - Clear window.name after injection
     * @param {function} options.onSuccess - Callback on successful injection
     * @param {function} options.onError - Callback on error
     */
    function inject(options = {}) {
        const {
            selector = null,
            clearAfterInject = true,
            onSuccess = null,
            onError = null
        } = options;

        try {
            // Step 1: Check for bridge data
            if (!hasBridgeData()) {
                log('No bridge data found in window.name', 'warn');
                return false;
            }

            // Step 2: Extract data
            const bridgeData = extractBridgeData();
            const fileData = bridgeData.file;

            if (!fileData || !fileData.data) {
                throw new Error('Invalid file data in bridge');
            }

            // Step 3: Create File object
            const file = createFileFromBridgeData(fileData);

            // Step 4: Find input element
            const input = findFileInput(selector);
            if (!input) {
                throw new Error('No file input element found on page');
            }

            // Step 5: Inject file
            const success = injectFile(file, input);

            // Step 6: Clear window.name if requested
            if (clearAfterInject && success) {
                window.name = '';
                log('window.name cleared after injection', 'info');
            }

            // Step 7: Call success callback
            if (success && typeof onSuccess === 'function') {
                onSuccess({ file, input, bridgeData });
            }

            log('Injection completed successfully!', 'success');
            return true;

        } catch (error) {
            log(`Injection failed: ${error.message}`, 'error');
            if (typeof onError === 'function') {
                onError(error);
            }
            return false;
        }
    }

    /**
     * Wait for DOM and then inject
     * Useful when page content loads dynamically
     */
    function injectWhenReady(options = {}, maxWait = 10000) {
        const { selector } = options;
        const startTime = Date.now();

        const tryInject = () => {
            // Check if we have bridge data first
            if (!hasBridgeData()) {
                log('No bridge data - skipping injection', 'info');
                return;
            }

            const input = findFileInput(selector);
            if (input) {
                inject(options);
            } else if (Date.now() - startTime < maxWait) {
                log('Waiting for file input element...', 'info');
                setTimeout(tryInject, 500);
            } else {
                log('Timeout waiting for file input element', 'error');
            }
        };

        if (document.readyState === 'complete') {
            tryInject();
        } else {
            window.addEventListener('load', tryInject);
        }
    }

    /**
     * Expose API globally
     */
    window.WindowNameBridge = {
        hasBridgeData,
        extractBridgeData,
        inject,
        injectWhenReady,
        createFileFromBridgeData,
        findFileInput,
        injectFile
    };

    // Auto-inject if bridge data is present
    // Uncomment below for automatic injection on page load
    // injectWhenReady();

    log('WindowName Bridge Injection Script loaded', 'success');
    log(`Bridge data present: ${hasBridgeData()}`, 'info');

})();
