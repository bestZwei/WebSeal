const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 导入服务
const screenshotService = require('./services/screenshotService');
const watermarkService = require('./services/watermarkService');
const databaseService = require('./services/databaseService');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 确保上传目录存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// 文件上传配置
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件'));
        }
    }
});

// API 路由

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'WebSeal server is running' });
});

// 网页截图 API
app.post('/api/screenshot', async (req, res) => {
    try {
        const { url, watermarkText, customText } = req.body;
        
        if (!url) {
            return res.status(400).json({ error: '请提供要截图的网址' });
        }

        // 验证URL格式
        try {
            new URL(url);
        } catch (e) {
            return res.status(400).json({ error: '请提供有效的网址格式' });
        }

        console.log(`开始截图: ${url}`);
        
        // 生成网页截图
        const screenshotPath = await screenshotService.captureScreenshot(url);
        
        // 添加水印
        const watermarkedPath = await watermarkService.addWatermark(
            screenshotPath, 
            watermarkText || `WebSeal - ${new Date().toISOString()}`,
            customText || ''
        );

        // 保存记录到数据库
        const record = await databaseService.saveRecord({
            url,
            originalPath: screenshotPath,
            watermarkedPath,
            watermarkText: watermarkText || `WebSeal - ${new Date().toISOString()}`,
            customText: customText || '',
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            id: record.id,
            url,
            originalImage: `/uploads/${path.basename(screenshotPath)}`,
            watermarkedImage: `/uploads/${path.basename(watermarkedPath)}`,
            watermarkText: watermarkText || `WebSeal - ${new Date().toISOString()}`,
            customText: customText || '',
            createdAt: record.createdAt
        });

    } catch (error) {
        console.error('截图失败:', error);
        res.status(500).json({ 
            error: '截图失败', 
            details: error.message 
        });
    }
});

// 水印检测 API
app.post('/api/detect-watermark', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '请上传图片文件' });
        }

        console.log(`开始检测水印: ${req.file.filename}`);
        
        // 检测水印
        const watermarkInfo = await watermarkService.detectWatermark(req.file.path);
        
        res.json({
            success: true,
            filename: req.file.filename,
            watermarkDetected: !!watermarkInfo,
            watermarkText: watermarkInfo?.watermarkText || null,
            customText: watermarkInfo?.customText || null,
            confidence: watermarkInfo?.confidence || 0
        });

    } catch (error) {
        console.error('水印检测失败:', error);
        res.status(500).json({ 
            error: '水印检测失败', 
            details: error.message 
        });
    }
});

// 获取记录列表
app.get('/api/records', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const records = await databaseService.getRecords(parseInt(page), parseInt(limit));
        res.json(records);
    } catch (error) {
        console.error('获取记录失败:', error);
        res.status(500).json({ error: '获取记录失败', details: error.message });
    }
});

// 获取单个记录
app.get('/api/records/:id', async (req, res) => {
    try {
        const record = await databaseService.getRecord(req.params.id);
        if (!record) {
            return res.status(404).json({ error: '记录不存在' });
        }
        res.json(record);
    } catch (error) {
        console.error('获取记录失败:', error);
        res.status(500).json({ error: '获取记录失败', details: error.message });
    }
});

// 删除记录
app.delete('/api/records/:id', async (req, res) => {
    try {
        const success = await databaseService.deleteRecord(req.params.id);
        if (!success) {
            return res.status(404).json({ error: '记录不存在' });
        }
        res.json({ success: true, message: '记录删除成功' });
    } catch (error) {
        console.error('删除记录失败:', error);
        res.status(500).json({ error: '删除记录失败', details: error.message });
    }
});

// 错误处理中间件
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: '文件大小不能超过10MB' });
        }
    }
    res.status(500).json({ error: '服务器内部错误', details: error.message });
});

// 静态文件服务（前端）
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
}

// 启动服务器
app.listen(PORT, () => {
    console.log(`WebSeal 服务器运行在 http://localhost:${PORT}`);
    console.log('正在初始化数据库...');
    databaseService.init().then(() => {
        console.log('数据库初始化完成');
    }).catch(err => {
        console.error('数据库初始化失败:', err);
    });
});

module.exports = app;
