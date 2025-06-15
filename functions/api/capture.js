export async function onRequestPost(context) {
    const { request, env } = context;
    
    try {
        // Add CORS headers for all responses
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

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
                headers: corsHeaders
            });
        }

        // Capture webpage screenshot using Puppeteer API
        const screenshot = await captureScreenshot(url, env?.BROWSERLESS_API_KEY);
        
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
            fileSize: formatFileSize(fileSize),
            shareUrl: `${new URL(request.url).origin}/share/${Date.now()}`
        }), {
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Capture error:', error);
        return new Response(JSON.stringify({ 
            error: error.message || 'Capture failed',
            details: error.stack || 'No stack trace available'
        }), {
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            }
        });
    }
}

// Handle OPTIONS request for CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '86400',
        },
    });
}

// ...existing code for all utility functions...
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

// ...existing code for remaining functions...
