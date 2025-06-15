'use client';

import { useState } from 'react';
import {
  Camera,
  Download,
  Upload,
  Eye,
  Shield,
  Zap,
  Clock,
  Archive,
  ExternalLink,
  CheckCircle,
  Loader2,
  Copy,
  Globe
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import { downloadImage, formatTimestamp, validateUrl, generateFilename } from '@/lib/utils';

export default function Home() {
  const [url, setUrl] = useState('');
  const [customText, setCustomText] = useState('');
  const [screenshotResult, setScreenshotResult] = useState<{
    url: string;
    timestamp: string;
    originalUrl: string;
    customText: string;
  } | null>(null);
  const [extractedWatermark, setExtractedWatermark] = useState<{
    timestamp: string;
    customText: string;
    url: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'capture' | 'extract'>('capture');
  const [dragActive, setDragActive] = useState(false);
  
  const { showToast, ToastContainer } = useToast();

  const handleScreenshot = async () => {
    if (!url) {
      showToast('请输入网址', 'error');
      return;
    }
    
    if (!validateUrl(url)) {
      showToast('请输入有效的网址格式', 'error');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          customText,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setScreenshotResult({
          url: result.imageUrl,
          timestamp: result.timestamp,
          originalUrl: result.originalUrl,
          customText: result.customText || '',
        });
        showToast('网页快照生成成功！', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || '生成快照失败', 'error');
      }      } catch (error) {
        console.error('Screenshot failed:', error);
        showToast('网络错误，请稍后重试', 'error');
      } finally {
        setIsLoading(false);
      }
  };

  const handleExtractWatermark = async (imageFile: File) => {
    if (!imageFile) {
      showToast('请选择图片文件', 'error');
      return;
    }

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(imageFile.type)) {
      showToast('请选择 PNG、JPG 或 JPEG 格式的图片', 'error');
      return;
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      showToast('文件过大，请选择小于 10MB 的图片', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/extract-watermark', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setExtractedWatermark({
          timestamp: result.timestamp,
          customText: result.customText,
          url: result.url,
        });
        showToast('水印提取成功！', 'success');
      } else {
        const error = await response.json();
        showToast(error.error || '水印提取失败', 'error');
      }      } catch (error) {
        console.error('Watermark extraction failed:', error);
        showToast('网络错误，请稍后重试', 'error');
      } finally {
        setIsLoading(false);
      }
  };

  const handleDownload = () => {
    if (screenshotResult) {
      try {
        const filename = generateFilename(screenshotResult.originalUrl, screenshotResult.timestamp);
        downloadImage(screenshotResult.url, filename);
        showToast('下载成功！', 'success');
      } catch {
        showToast('下载失败，请稍后重试', 'error');
      }
    }
  };

  const handleCopyUrl = async () => {
    if (extractedWatermark?.url) {
      try {
        await navigator.clipboard.writeText(extractedWatermark.url);
        showToast('网址已复制到剪贴板', 'success');
      } catch {
        showToast('复制失败', 'error');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleExtractWatermark(imageFile);
    } else {
      showToast('请拖拽图片文件', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">WebSeal</h1>
                <p className="text-sm text-gray-600">网页存证与水印工具</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>法律存证</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Archive className="h-4 w-4 text-blue-500" />
                  <span>网页归档</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Eye className="h-4 w-4 text-purple-500" />
                  <span>盲水印技术</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            专业的网页存证工具
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            使用先进的盲水印技术，为网页快照添加时间戳和自定义文字水印，
            确保网页内容的真实性和完整性，适用于法律存证、网页归档等场景。
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-lg border border-gray-200">
            <button
              onClick={() => setActiveTab('capture')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'capture'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Camera className="h-5 w-5 inline mr-2" />
              网页截图与水印
            </button>
            <button
              onClick={() => setActiveTab('extract')}
              className={`px-6 py-3 rounded-md font-medium transition-all ${
                activeTab === 'extract'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Eye className="h-5 w-5 inline mr-2" />
              水印提取验证
            </button>
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'capture' && (
          <div className="max-w-4xl mx-auto">
            {/* Screenshot Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
              <div className="flex items-center mb-6">
                <Camera className="h-6 w-6 text-blue-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">网页快照生成</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    目标网址 *
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="请输入完整的网址，如：https://example.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                    <ExternalLink className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label htmlFor="customText" className="block text-sm font-medium text-gray-700 mb-2">
                    自定义水印文字（可选）
                  </label>
                  <input
                    type="text"
                    id="customText"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="输入要嵌入的自定义文字，如：公司名称、证据编号等"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <button
                  onClick={handleScreenshot}
                  disabled={!url || isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>正在生成快照...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5" />
                      <span>生成水印快照</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Screenshot Result */}
            {screenshotResult && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">生成成功</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">快照预览</h4>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshotResult.url}
                        alt="Website Screenshot"
                        className="w-full rounded-lg shadow-md"
                      />
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">存证信息</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">生成时间</p>
                          <p className="text-sm text-gray-600">{formatTimestamp(screenshotResult.timestamp)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                        <Shield className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">水印状态</p>
                          <p className="text-sm text-gray-600">已嵌入盲水印</p>
                        </div>
                      </div>

                      {customText && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                          <Eye className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">自定义文字</p>
                            <p className="text-sm text-gray-600">{screenshotResult.customText}</p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-3 p-3 bg-indigo-50 rounded-lg">
                        <Globe className="h-5 w-5 text-indigo-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">原始网址</p>
                          <p className="text-sm text-gray-600 truncate">{screenshotResult.originalUrl}</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleDownload}
                      className="w-full mt-6 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    >
                      <Download className="h-5 w-5" />
                      <span>下载快照</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'extract' && (
          <div className="max-w-4xl mx-auto">
            {/* Extract Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-8">
              <div className="flex items-center mb-6">
                <Eye className="h-6 w-6 text-purple-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">水印提取验证</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    上传图片文件 *
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-blue-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      点击上传或拖拽图片文件
                    </p>
                    <p className="text-sm text-gray-600">
                      支持 PNG, JPG, JPEG 格式，最大 10MB
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleExtractWatermark(file);
                        }
                      }}
                      className="hidden"
                      id="imageUpload"
                    />
                    <label
                      htmlFor="imageUpload"
                      className="inline-block mt-4 bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 cursor-pointer transition-all"
                    >
                      选择文件
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Extract Result */}
            {extractedWatermark && (
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                <div className="flex items-center mb-6">
                  <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">水印提取成功</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                      <Clock className="h-6 w-6 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">原始时间戳</p>
                        <p className="text-gray-600">{formatTimestamp(extractedWatermark.timestamp)}</p>
                      </div>
                    </div>

                    {extractedWatermark.customText && (
                      <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                        <Eye className="h-6 w-6 text-purple-600" />
                        <div>
                          <p className="font-semibold text-gray-900">自定义文字</p>
                          <p className="text-gray-600">{extractedWatermark.customText}</p>
                        </div>
                      </div>
                    )}

                    {extractedWatermark.url && (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-semibold text-gray-900">原始网址</p>
                          <button
                            onClick={handleCopyUrl}
                            className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-gray-600 break-all text-sm">{extractedWatermark.url}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center p-8 bg-green-50 rounded-lg">
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                      <p className="text-xl font-bold text-gray-900 mb-2">验证通过</p>
                      <p className="text-gray-600">
                        图片包含有效的盲水印信息
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">安全可靠</h3>
            <p className="text-gray-600">
              采用先进的LSB盲水印算法，确保水印信息的安全性和隐蔽性
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Archive className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">法律存证</h3>
            <p className="text-gray-600">
              生成的快照可用于法律证据，时间戳确保内容的时效性和真实性
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">快速高效</h3>
            <p className="text-gray-600">
              优化的截图引擎和水印处理算法，提供快速的网页快照生成体验
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">WebSeal</h3>
                  <p className="text-gray-400">专业网页存证工具</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                WebSeal 是一款专业的网页存证工具，采用先进的盲水印技术，
                为网页快照提供时间戳和自定义文字水印，确保网页内容的真实性和完整性。
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">主要功能</h4>
              <ul className="space-y-2 text-gray-400">
                <li>网页快照生成</li>
                <li>盲水印嵌入</li>
                <li>水印提取验证</li>
                <li>法律存证支持</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">技术特点</h4>
              <ul className="space-y-2 text-gray-400">
                <li>LSB 隐写算法</li>
                <li>高质量截图</li>
                <li>时间戳认证</li>
                <li>云端部署</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 WebSeal Team. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
}
