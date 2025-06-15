class WebSeal {
    constructor() {
        this.API_BASE = '/api'; // Cloudflare Functions endpoint
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupUploadArea();
    }

    bindEvents() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Watermark toggle
        const enableWatermark = document.getElementById('enableWatermark');
        if (enableWatermark) {
            enableWatermark.addEventListener('change', (e) => {
                this.toggleWatermark(e.target.checked);
            });
        }

        // Visible watermark toggle
        const enableVisibleWatermark = document.getElementById('enableVisibleWatermark');
        if (enableVisibleWatermark) {
            enableVisibleWatermark.addEventListener('change', (e) => {
                this.toggleVisibleWatermark(e.target.checked);
            });
        }

        // Opacity slider
        const visibleOpacity = document.getElementById('visibleOpacity');
        if (visibleOpacity) {
            visibleOpacity.addEventListener('input', (e) => {
                const opacityValue = document.getElementById('opacityValue');
                if (opacityValue) {
                    opacityValue.textContent = e.target.value + '%';
                }
            });
        }

        // Form submissions
        const captureForm = document.getElementById('captureForm');
        if (captureForm) {
            captureForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.captureWebpage();
            });
        }

        const extractForm = document.getElementById('extractForm');
        if (extractForm) {
            extractForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.extractWatermark();
            });
        }

        // File upload
        const imageFile = document.getElementById('imageFile');
        if (imageFile) {
            imageFile.addEventListener('change', (e) => {
                this.handleFileSelect(e.target.files[0]);
            });
        }

        // Action buttons
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadSnapshot();
            });
        }

        const copyLinkBtn = document.getElementById('copyLinkBtn');
        if (copyLinkBtn) {
            copyLinkBtn.addEventListener('click', () => {
                this.copyLink();
            });
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetTab) {
            targetTab.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    }

    toggleWatermark(enabled) {
        const config = document.getElementById('watermarkConfig');
        if (config) {
            config.classList.toggle('disabled', !enabled);
        }
    }

    toggleVisibleWatermark(enabled) {
        const config = document.getElementById('visibleWatermarkConfig');
        if (config) {
            config.style.display = enabled ? 'block' : 'none';
        }
    }

    setupUploadArea() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageFile');

        if (!uploadArea || !fileInput) return;

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleFileSelect(files[0]);
            }
        });

        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });
    }

    handleFileSelect(file) {
        if (!file) return;

        const uploadArea = document.getElementById('uploadArea');
        const extractBtn = document.getElementById('extractBtn');

        if (uploadArea) {
            uploadArea.innerHTML = `
                <i class="fas fa-image"></i>
                <p>已选择: ${file.name}</p>
                <p class="file-size">${this.formatFileSize(file.size)}</p>
            `;
        }

        if (extractBtn) {
            extractBtn.disabled = false;
        }
        this.selectedFile = file;
    }

    async captureWebpage() {
        const form = document.getElementById('captureForm');
        if (!form) return;

        const formData = new FormData(form);
        const url = formData.get('url');
        
        const enableInvisibleWatermark = document.getElementById('enableInvisibleWatermark')?.checked || false;
        const enableVisibleWatermark = document.getElementById('enableVisibleWatermark')?.checked || false;
        const customText = document.getElementById('customText')?.value || '';
        const invisibleStrength = document.getElementById('invisibleWatermarkStrength')?.value || 'medium';
        const visiblePosition = document.getElementById('visiblePosition')?.value || 'bottom-right';
        const visibleOpacity = document.getElementById('visibleOpacity')?.value || '30';

        if (!this.isValidUrl(url)) {
            this.showError('请输入有效的网址');
            return;
        }

        this.showLoading('正在生成网页快照...', '正在访问目标网页并添加水印');

        try {
            const response = await fetch(`${this.API_BASE}/capture`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url,
                    enableInvisibleWatermark,
                    enableVisibleWatermark,
                    customText,
                    invisibleStrength,
                    visiblePosition,
                    visibleOpacity: parseInt(visibleOpacity),
                    timestamp: new Date().toISOString()
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || '快照生成失败');
            }

            this.displayCaptureResult(result);
        } catch (error) {
            console.error('Capture error:', error);
            this.showError(error.message || '快照生成失败，请稍后重试');
        } finally {
            this.hideLoading();
        }
    }

    async extractWatermark() {
        if (!this.selectedFile) {
            this.showError('请先选择图片文件');
            return;
        }

        this.showLoading('正在提取水印信息...', '正在分析图片中的隐藏信息');

        try {
            const formData = new FormData();
            formData.append('image', this.selectedFile);

            const response = await fetch(`${this.API_BASE}/extract`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.error || '水印提取失败');
            }

            this.displayExtractionResult(result);
        } catch (error) {
            console.error('Extraction error:', error);
            this.showError(error.message || '水印提取失败，请确认图片包含有效水印');
        } finally {
            this.hideLoading();
        }
    }

    displayCaptureResult(result) {
        const resultSection = document.getElementById('captureResult');
        if (!resultSection) return;
        
        const captureTime = document.getElementById('captureTime');
        const originalUrl = document.getElementById('originalUrl');
        const fileSize = document.getElementById('fileSize');
        const snapshotImage = document.getElementById('snapshotImage');

        if (captureTime) captureTime.textContent = new Date(result.timestamp).toLocaleString('zh-CN');
        if (originalUrl) originalUrl.textContent = result.originalUrl;
        if (fileSize) fileSize.textContent = result.fileSize || '未知';
        if (snapshotImage) snapshotImage.src = result.imageUrl;

        // Store for download/share
        this.currentResult = result;

        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    displayExtractionResult(result) {
        const resultSection = document.getElementById('extractResult');
        if (!resultSection) return;
        
        const extractedTime = document.getElementById('extractedTime');
        const extractedText = document.getElementById('extractedText');
        const statusSpan = document.getElementById('verificationStatus');

        if (extractedTime) {
            extractedTime.textContent = result.watermark?.timestamp ? 
                new Date(result.watermark.timestamp).toLocaleString('zh-CN') : '未知';
        }
        if (extractedText) {
            extractedText.textContent = result.watermark?.customText || '无';
        }
        if (statusSpan) {
            statusSpan.textContent = result.verified ? '验证通过' : '验证失败';
            statusSpan.style.color = result.verified ? 'var(--success-color)' : 'var(--error-color)';
        }

        resultSection.style.display = 'block';
        resultSection.scrollIntoView({ behavior: 'smooth' });
    }

    downloadSnapshot() {
        if (!this.currentResult) return;

        // Create download link
        const link = document.createElement('a');
        link.href = this.currentResult.imageUrl;
        link.download = `webseal-snapshot-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showSuccess('快照下载已开始');
    }

    async copyLink() {
        if (!this.currentResult) return;

        try {
            await navigator.clipboard.writeText(this.currentResult.shareUrl);
            this.showSuccess('链接已复制到剪贴板');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('复制失败，请手动复制链接');
        }
    }

    // Utility functions
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    generatePlaceholderImage(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Create gradient background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#f0f9ff');
        gradient.addColorStop(1, '#e0f2fe');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add some placeholder content
        ctx.fillStyle = '#2563eb';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('WebSeal 快照示例', width/2, height/2 - 20);
        ctx.font = '16px Arial';
        ctx.fillStyle = '#64748b';
        ctx.fillText('实际快照将显示目标网页内容', width/2, height/2 + 20);
        
        return canvas.toDataURL();
    }

    showLoading(title, subtitle = '') {
        const overlay = document.getElementById('loadingOverlay');
        const titleElement = document.getElementById('loadingText');
        if (overlay && titleElement) {
            titleElement.innerHTML = subtitle ? `${title}<br><small>${subtitle}</small>` : title;
            overlay.classList.add('show');
        }
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('show');
        }
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // Add toast styles if not exists
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    color: white;
                    font-weight: 500;
                    z-index: 1001;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    animation: slideIn 0.3s ease;
                }
                .toast-success { background: var(--success-color); }
                .toast-error { background: var(--error-color); }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new WebSeal();
});
