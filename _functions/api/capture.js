export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        const { 
            url, 
            enableInvisibleWatermark, 
            enableVisibleWatermark,
            customText, 
            invisibleStrength,
            visiblePosition,
            visibleOpacity,
            timestamp 
        } = await request.json();
        
        if (!url || !isValidUrl(url)) {
            return new Response(JSON.stringify({ error: 'Invalid URL' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Capture webpage screenshot using Puppeteer API
        const screenshot = await captureScreenshot(url, env.BROWSERLESS_API_KEY);
        
        let finalImage = screenshot;
        
        // Add invisible watermark (steganographic)
        if (enableInvisibleWatermark) {
            const watermarkData = {
                timestamp: timestamp,
                customText: customText || '',
                url: url,
                type: 'webseal_watermark'
            };
            
            finalImage = await addInvisibleWatermark(finalImage, watermarkData, invisibleStrength);
        }

        // Add visible watermark
        if (enableVisibleWatermark) {
            finalImage = await addVisibleWatermark(finalImage, {
                text: customText || `WebSeal - ${new Date(timestamp).toLocaleDateString('zh-CN')}`,
                position: visiblePosition,
                opacity: visibleOpacity / 100
            });
        }

        // Convert to base64 for response (in production, store in R2)
        const base64Image = await imageToBase64(finalImage);
        const fileSize = calculateFileSize(base64Image);
        
        return new Response(JSON.stringify({
            success: true,
            imageUrl: base64Image,
            timestamp: timestamp,
            originalUrl: url,
            fileSize: formatFileSize(fileSize)
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Capture error:', error);
        return new Response(JSON.stringify({ 
            error: error.message || 'Capture failed' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function captureScreenshot(url, apiKey) {
    // Use Browserless or similar service for real screenshot
    if (apiKey) {
        const response = await fetch(`https://chrome.browserless.io/screenshot`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                url: url,
                options: {
                    type: 'png',
                    fullPage: true,
                    quality: 100
                },
                viewport: {
                    width: 1280,
                    height: 800
                }
            })
        });
        
        if (!response.ok) {
            throw new Error('Screenshot service failed');
        }
        
        return await response.arrayBuffer();
    } else {
        // Fallback: generate placeholder image
        return generatePlaceholderScreenshot(url);
    }
}

async function addInvisibleWatermark(imageBuffer, watermarkData, strength) {
    // Convert to canvas for processing
    const canvas = new OffscreenCanvas(1280, 800);
    const ctx = canvas.getContext('2d');
    
    // Create image from buffer
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const img = await createImageBitmap(blob);
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Get image data for pixel manipulation
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Embed watermark using LSB steganography
    const watermarkString = JSON.stringify(watermarkData);
    const strengthMultiplier = getStrengthMultiplier(strength);
    
    embedDataInImage(imageData, watermarkString, strengthMultiplier);
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert back to buffer
    const resultBlob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });
    return await resultBlob.arrayBuffer();
}

async function addVisibleWatermark(imageBuffer, watermarkConfig) {
    const canvas = new OffscreenCanvas(1280, 800);
    const ctx = canvas.getContext('2d');
    
    // Load original image
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    const img = await createImageBitmap(blob);
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Add visible watermark
    const { text, position, opacity } = watermarkConfig;
    
    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.font = '24px Arial';
    ctx.lineWidth = 2;
    
    // Calculate position
    const textMetrics = ctx.measureText(text);
    const { x, y } = calculateWatermarkPosition(position, canvas.width, canvas.height, textMetrics);
    
    // Draw text with outline
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    
    // Reset alpha
    ctx.globalAlpha = 1;
    
    const resultBlob = await canvas.convertToBlob({ type: 'image/png', quality: 1 });
    return await resultBlob.arrayBuffer();
}

function embedDataInImage(imageData, data, strengthMultiplier) {
    const binary = stringToBinary(data);
    const pixels = imageData.data;
    
    for (let i = 0; i < binary.length && i * 4 < pixels.length; i++) {
        const pixelIndex = i * 4; // RGBA
        const bit = parseInt(binary[i]);
        
        // Modify LSB of red channel based on strength
        if (strengthMultiplier > 1) {
            // For higher strength, modify multiple bits
            pixels[pixelIndex] = (pixels[pixelIndex] & (0xFF << strengthMultiplier)) | (bit << (strengthMultiplier - 1));
        } else {
            // Standard LSB
            pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | bit;
        }
    }
    
    // Add end marker
    const endMarker = '11111111';
    for (let i = 0; i < endMarker.length; i++) {
        const pixelIndex = (binary.length + i) * 4;
        if (pixelIndex < pixels.length) {
            const bit = parseInt(endMarker[i]);
            pixels[pixelIndex] = (pixels[pixelIndex] & 0xFE) | bit;
        }
    }
}

function calculateWatermarkPosition(position, width, height, textMetrics) {
    const padding = 20;
    const textWidth = textMetrics.width;
    const textHeight = 24; // font size
    
    switch (position) {
        case 'top-left':
            return { x: padding, y: padding + textHeight };
        case 'top-right':
            return { x: width - textWidth - padding, y: padding + textHeight };
        case 'bottom-left':
            return { x: padding, y: height - padding };
        case 'bottom-right':
            return { x: width - textWidth - padding, y: height - padding };
        case 'center':
            return { x: (width - textWidth) / 2, y: height / 2 };
        default:
            return { x: width - textWidth - padding, y: height - padding };
    }
}

function getStrengthMultiplier(strength) {
    switch (strength) {
        case 'low': return 1;
        case 'medium': return 2;
        case 'high': return 3;
        default: return 2;
    }
}

async function generatePlaceholderScreenshot(url) {
    const canvas = new OffscreenCanvas(1280, 800);
    const ctx = canvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1280, 800);
    gradient.addColorStop(0, '#f0f9ff');
    gradient.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1280, 800);
    
    // Add content
    ctx.fillStyle = '#2563eb';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('WebSeal 网页快照', 640, 300);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#64748b';
    ctx.fillText(`目标网页: ${url}`, 640, 350);
    ctx.fillText(`快照时间: ${new Date().toLocaleString('zh-CN')}`, 640, 380);
    ctx.fillText('(演示模式 - 实际部署时将显示真实网页内容)', 640, 450);
    
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    return await blob.arrayBuffer();
}

// Utility functions
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function stringToBinary(str) {
    return str.split('').map(char => 
        char.charCodeAt(0).toString(2).padStart(8, '0')
    ).join('');
}

async function imageToBase64(imageBuffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
    return `data:image/png;base64,${base64}`;
}

function calculateFileSize(base64String) {
    // Remove data URL prefix and calculate size
    const base64Data = base64String.split(',')[1];
    return Math.round((base64Data.length * 3) / 4);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle OPTIONS request for CORS
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
