export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image');
        
        if (!imageFile) {
            return new Response(JSON.stringify({ error: 'No image provided' }), {
                status: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Extract watermark from image
        const watermarkData = await extractWatermark(imageFile);
        
        if (!watermarkData) {
            return new Response(JSON.stringify({ 
                error: 'No valid WebSeal watermark found in this image' 
            }), {
                status: 404,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                }
            });
        }

        // Verify watermark integrity
        const verified = verifyWatermark(watermarkData);

        return new Response(JSON.stringify({
            success: true,
            watermark: watermarkData,
            verified: verified
        }), {
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
        
    } catch (error) {
        console.error('Extraction error:', error);
        return new Response(JSON.stringify({ 
            error: 'Watermark extraction failed' 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

async function extractWatermark(imageFile) {
    const arrayBuffer = await imageFile.arrayBuffer();
    
    // Create canvas for image processing
    const canvas = new OffscreenCanvas(800, 600);
    const ctx = canvas.getContext('2d');
    
    // Load image
    const blob = new Blob([arrayBuffer]);
    const img = await createImageBitmap(blob);
    
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    
    // Extract hidden data using multiple strength levels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    // Try different extraction methods
    for (let strength = 1; strength <= 3; strength++) {
        const extractedData = extractDataFromImage(imageData, strength);
        
        if (extractedData) {
            try {
                const parsed = JSON.parse(extractedData);
                if (parsed.type === 'webseal_watermark') {
                    return parsed;
                }
            } catch (e) {
                // Continue to next strength level
            }
        }
    }
    
    return null;
}

function extractDataFromImage(imageData, strength) {
    const pixels = imageData.data;
    let binary = '';
    const mask = (1 << strength) - 1;
    const shift = strength - 1;
    
    for (let i = 0; i < pixels.length / 4; i++) {
        const pixelIndex = i * 4;
        
        if (strength > 1) {
            binary += ((pixels[pixelIndex] >> shift) & 1).toString();
        } else {
            binary += (pixels[pixelIndex] & 1).toString();
        }
        
        // Check for end marker every 8 bits
        if (binary.length >= 8 && binary.length % 8 === 0) {
            const lastByte = binary.slice(-8);
            if (lastByte === '11111111') {
                // Found end marker
                return binaryToString(binary.slice(0, -8));
            }
        }
        
        // Prevent infinite loops
        if (binary.length > 100000) break;
    }
    
    return null;
}

function binaryToString(binary) {
    let result = '';
    for (let i = 0; i < binary.length; i += 8) {
        const byte = binary.substr(i, 8);
        if (byte.length === 8) {
            const charCode = parseInt(byte, 2);
            if (charCode === 0) break; // End of string
            result += String.fromCharCode(charCode);
        }
    }
    return result;
}

function verifyWatermark(watermarkData) {
    // Verify watermark has required fields
    const requiredFields = ['timestamp', 'url', 'type'];
    const hasRequiredFields = requiredFields.every(field => 
        watermarkData.hasOwnProperty(field) && watermarkData[field]
    );
    
    if (!hasRequiredFields) return false;
    
    // Verify timestamp is reasonable (not too old or in future)
    const timestamp = new Date(watermarkData.timestamp);
    const now = new Date();
    const daysDiff = Math.abs(now - timestamp) / (1000 * 60 * 60 * 24);
    
    // Allow watermarks up to 1 year old
    if (daysDiff > 365) return false;
    
    // Verify URL format
    try {
        new URL(watermarkData.url);
    } catch {
        return false;
    }
    
    return true;
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
