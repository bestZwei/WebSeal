export async function onRequestPost(context) {
    const { request } = context;
    
    try {
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Content-Type': 'application/json'
        };

        const formData = await request.formData();
        const imageFile = formData.get('image');
        
        if (!imageFile) {
            return new Response(JSON.stringify({ error: 'No image file provided' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        // Convert image to buffer for processing
        const imageBuffer = await imageFile.arrayBuffer();
        
        // Extract watermark data
        const watermarkData = await extractWatermarkFromImage(imageBuffer);
        
        return new Response(JSON.stringify({
            success: true,
            watermark: watermarkData,
            verified: !!watermarkData && watermarkData.type === 'webseal_watermark'
        }), {
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Extraction error:', error);
        return new Response(JSON.stringify({ 
            error: error.message || 'Extraction failed',
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

async function extractWatermarkFromImage(imageBuffer) {
    try {
        const canvas = new OffscreenCanvas(1, 1);
        const ctx = canvas.getContext('2d');
        
        // Create image from buffer
        const blob = new Blob([imageBuffer], { type: 'image/png' });
        const img = await createImageBitmap(blob);
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for pixel analysis
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Extract hidden data using LSB steganography
        const extractedData = extractDataFromImage(imageData);
        
        if (extractedData) {
            return JSON.parse(extractedData);
        }
        
        return null;
    } catch (error) {
        console.error('Watermark extraction failed:', error);
        return null;
    }
}

function extractDataFromImage(imageData) {
    const pixels = imageData.data;
    let binaryString = '';
    
    // Extract LSBs from red channel
    for (let i = 0; i < pixels.length; i += 4) {
        binaryString += (pixels[i] & 1).toString();
        
        // Check for end marker
        if (binaryString.length >= 8 && binaryString.slice(-8) === '11111111') {
            binaryString = binaryString.slice(0, -8); // Remove end marker
            break;
        }
    }
    
    // Convert binary to string
    try {
        let result = '';
        for (let i = 0; i < binaryString.length; i += 8) {
            const byte = binaryString.substr(i, 8);
            if (byte.length === 8) {
                result += String.fromCharCode(parseInt(byte, 2));
            }
        }
        return result;
    } catch (error) {
        return null;
    }
}
