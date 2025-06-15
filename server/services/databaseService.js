const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, '../data/webseal.db');
        this.db = null;
        
        // 确保数据目录存在
        const dataDir = path.dirname(this.dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }

    /**
     * 初始化数据库
     */
    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('数据库连接失败:', err);
                    reject(err);
                } else {
                    console.log('数据库连接成功');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    /**
     * 创建数据表
     */
    async createTables() {
        return new Promise((resolve, reject) => {
            const createRecordsTable = `
                CREATE TABLE IF NOT EXISTS records (
                    id TEXT PRIMARY KEY,
                    url TEXT NOT NULL,
                    title TEXT,
                    description TEXT,
                    originalPath TEXT NOT NULL,
                    watermarkedPath TEXT NOT NULL,
                    watermarkText TEXT NOT NULL,
                    customText TEXT,
                    fileSize INTEGER,
                    imageWidth INTEGER,
                    imageHeight INTEGER,
                    status TEXT DEFAULT 'completed',
                    createdAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                )
            `;

            const createIndexes = `
                CREATE INDEX IF NOT EXISTS idx_records_url ON records(url);
                CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(createdAt);
                CREATE INDEX IF NOT EXISTS idx_records_status ON records(status);
            `;

            this.db.exec(createRecordsTable + '; ' + createIndexes, (err) => {
                if (err) {
                    console.error('创建数据表失败:', err);
                    reject(err);
                } else {
                    console.log('数据表创建成功');
                    resolve();
                }
            });
        });
    }

    /**
     * 保存记录
     */
    async saveRecord(recordData) {
        return new Promise((resolve, reject) => {
            const id = uuidv4();
            const now = new Date().toISOString();
            
            const stmt = this.db.prepare(`
                INSERT INTO records (
                    id, url, title, description, originalPath, watermarkedPath,
                    watermarkText, customText, fileSize, imageWidth, imageHeight,
                    status, createdAt, updatedAt
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmt.run([
                id,
                recordData.url,
                recordData.title || null,
                recordData.description || null,
                recordData.originalPath,
                recordData.watermarkedPath,
                recordData.watermarkText,
                recordData.customText || null,
                recordData.fileSize || null,
                recordData.imageWidth || null,
                recordData.imageHeight || null,
                recordData.status || 'completed',
                recordData.createdAt || now,
                now
            ], function(err) {
                if (err) {
                    console.error('保存记录失败:', err);
                    reject(err);
                } else {
                    console.log(`记录保存成功, ID: ${id}`);
                    resolve({
                        id,
                        ...recordData,
                        createdAt: recordData.createdAt || now,
                        updatedAt: now
                    });
                }
            });

            stmt.finalize();
        });
    }

    /**
     * 获取记录列表
     */
    async getRecords(page = 1, limit = 10, filters = {}) {
        return new Promise((resolve, reject) => {
            const offset = (page - 1) * limit;
            
            let whereClause = '';
            let params = [];
            
            if (filters.url) {
                whereClause += ' WHERE url LIKE ?';
                params.push(`%${filters.url}%`);
            }
            
            if (filters.status) {
                whereClause += whereClause ? ' AND status = ?' : ' WHERE status = ?';
                params.push(filters.status);
            }

            // 获取总数
            const countSql = `SELECT COUNT(*) as total FROM records${whereClause}`;
            this.db.get(countSql, params, (err, countResult) => {
                if (err) {
                    reject(err);
                    return;
                }

                const total = countResult.total;

                // 获取记录
                const sql = `
                    SELECT * FROM records${whereClause}
                    ORDER BY createdAt DESC
                    LIMIT ? OFFSET ?
                `;
                
                params.push(limit, offset);

                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        console.error('获取记录失败:', err);
                        reject(err);
                    } else {
                        resolve({
                            records: rows,
                            pagination: {
                                page,
                                limit,
                                total,
                                totalPages: Math.ceil(total / limit)
                            }
                        });
                    }
                });
            });
        });
    }

    /**
     * 获取单个记录
     */
    async getRecord(id) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM records WHERE id = ?';
            
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    console.error('获取记录失败:', err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    /**
     * 更新记录
     */
    async updateRecord(id, updateData) {
        return new Promise((resolve, reject) => {
            const fields = Object.keys(updateData);
            const setClause = fields.map(field => `${field} = ?`).join(', ');
            const values = fields.map(field => updateData[field]);
            
            const sql = `
                UPDATE records 
                SET ${setClause}, updatedAt = ?
                WHERE id = ?
            `;
            
            values.push(new Date().toISOString(), id);

            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('更新记录失败:', err);
                    reject(err);
                } else {
                    if (this.changes === 0) {
                        resolve(null); // 记录不存在
                    } else {
                        resolve({ id, ...updateData, updatedAt: new Date().toISOString() });
                    }
                }
            });
        });
    }

    /**
     * 删除记录
     */
    async deleteRecord(id) {
        return new Promise((resolve, reject) => {
            // 先获取记录信息以删除相关文件
            this.getRecord(id).then(record => {
                if (!record) {
                    resolve(false);
                    return;
                }

                // 删除相关文件
                try {
                    if (record.originalPath && fs.existsSync(record.originalPath)) {
                        fs.unlinkSync(record.originalPath);
                    }
                    if (record.watermarkedPath && fs.existsSync(record.watermarkedPath)) {
                        fs.unlinkSync(record.watermarkedPath);
                    }
                } catch (fileErr) {
                    console.warn('删除文件时出错:', fileErr);
                }

                // 删除数据库记录
                const sql = 'DELETE FROM records WHERE id = ?';
                this.db.run(sql, [id], function(err) {
                    if (err) {
                        console.error('删除记录失败:', err);
                        reject(err);
                    } else {
                        console.log(`记录删除成功, ID: ${id}`);
                        resolve(this.changes > 0);
                    }
                });
            }).catch(reject);
        });
    }

    /**
     * 获取统计信息
     */
    async getStatistics() {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    COUNT(*) as totalRecords,
                    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completedRecords,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failedRecords,
                    MIN(createdAt) as oldestRecord,
                    MAX(createdAt) as newestRecord
                FROM records
            `;

            this.db.get(sql, [], (err, result) => {
                if (err) {
                    console.error('获取统计信息失败:', err);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    /**
     * 清理过期记录
     */
    async cleanupOldRecords(daysOld = 30) {
        return new Promise((resolve, reject) => {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysOld);
            const cutoffDateString = cutoffDate.toISOString();

            // 先获取要删除的记录
            const selectSql = 'SELECT * FROM records WHERE createdAt < ?';
            this.db.all(selectSql, [cutoffDateString], (err, records) => {
                if (err) {
                    reject(err);
                    return;
                }

                // 删除文件
                records.forEach(record => {
                    try {
                        if (record.originalPath && fs.existsSync(record.originalPath)) {
                            fs.unlinkSync(record.originalPath);
                        }
                        if (record.watermarkedPath && fs.existsSync(record.watermarkedPath)) {
                            fs.unlinkSync(record.watermarkedPath);
                        }
                    } catch (fileErr) {
                        console.warn('删除过期文件时出错:', fileErr);
                    }
                });

                // 删除数据库记录
                const deleteSql = 'DELETE FROM records WHERE createdAt < ?';
                this.db.run(deleteSql, [cutoffDateString], function(err) {
                    if (err) {
                        console.error('清理过期记录失败:', err);
                        reject(err);
                    } else {
                        console.log(`清理了 ${this.changes} 条过期记录`);
                        resolve(this.changes);
                    }
                });
            });
        });
    }

    /**
     * 关闭数据库连接
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        console.error('关闭数据库失败:', err);
                        reject(err);
                    } else {
                        console.log('数据库连接已关闭');
                        this.db = null;
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }
}

module.exports = new DatabaseService();
