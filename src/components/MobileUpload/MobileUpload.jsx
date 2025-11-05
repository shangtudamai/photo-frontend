/**
 * 移动端上传组件
 * 支持相机拍摄和文件选择
 */

import React, { useState, useRef } from 'react';
import { Button, Progress, Space, message, Modal } from 'antd';
import {
  CameraOutlined,
  PictureOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined
} from '@ant-design/icons';
import './MobileUpload.less';

/**
 * 压缩图片
 * @param {File} file - 原始文件
 * @param {number} maxWidth - 最大宽度
 * @param {number} quality - 压缩质量 0-1
 * @returns {Promise<Blob>} 压缩后的Blob
 */
const compressImage = (file, maxWidth = 1920, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 计算缩放比例
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为Blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('压缩失败'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('图片加载失败'));
    };

    reader.onerror = () => reject(new Error('文件读取失败'));
  });
};

/**
 * 移动端上传组件
 */
const MobileUpload = ({
  value = [],
  onChange,
  maxCount = 9,
  maxSize = 10 * 1024 * 1024, // 10MB
  compress = true,
  compressQuality = 0.8,
  onUpload,
  accept = 'image/*'
}) => {
  const [fileList, setFileList] = useState(value);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  /**
   * 处理文件选择
   */
  const handleFileChange = async (e, source) => {
    const files = Array.from(e.target.files);

    // 检查数量限制
    if (fileList.length + files.length > maxCount) {
      message.warning(`最多只能上传${maxCount}张图片`);
      return;
    }

    // 处理文件
    const newFiles = [];
    for (const file of files) {
      // 检查文件大小
      if (file.size > maxSize) {
        message.warning(`${file.name} 文件过大，最大支持 ${maxSize / 1024 / 1024}MB`);
        continue;
      }

      // 生成预览URL
      const preview = URL.createObjectURL(file);

      // 压缩图片（如果启用）
      let processedFile = file;
      if (compress && file.type.startsWith('image/')) {
        try {
          const compressed = await compressImage(file, 1920, compressQuality);
          processedFile = new File([compressed], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
        } catch (err) {
          console.error('压缩失败，使用原图:', err);
        }
      }

      newFiles.push({
        uid: `${Date.now()}_${Math.random()}`,
        name: file.name,
        file: processedFile,
        preview,
        source, // 'camera' or 'gallery'
        status: 'ready',
        progress: 0
      });
    }

    const updatedList = [...fileList, ...newFiles];
    setFileList(updatedList);
    onChange?.(updatedList);

    // 重置input
    e.target.value = '';
  };

  /**
   * 删除文件
   */
  const handleRemove = (uid) => {
    const file = fileList.find(f => f.uid === uid);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }

    const updatedList = fileList.filter(f => f.uid !== uid);
    setFileList(updatedList);
    onChange?.(updatedList);
  };

  /**
   * 预览图片
   */
  const handlePreview = (file) => {
    setPreviewImage(file.preview);
    setPreviewVisible(true);
  };

  /**
   * 上传所有文件
   */
  const handleUploadAll = async () => {
    if (!onUpload) {
      message.error('未配置上传函数');
      return;
    }

    const readyFiles = fileList.filter(f => f.status === 'ready');
    if (readyFiles.length === 0) {
      message.warning('没有可上传的文件');
      return;
    }

    setUploading(true);

    for (const file of readyFiles) {
      try {
        // 更新状态为上传中
        setFileList(prev => prev.map(f =>
          f.uid === file.uid ? { ...f, status: 'uploading' } : f
        ));

        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const current = prev[file.uid] || 0;
            if (current >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return { ...prev, [file.uid]: current + 10 };
          });
        }, 200);

        // 调用上传函数
        const result = await onUpload(file.file, (progress) => {
          setUploadProgress(prev => ({ ...prev, [file.uid]: progress }));
        });

        clearInterval(progressInterval);

        // 上传成功
        setUploadProgress(prev => ({ ...prev, [file.uid]: 100 }));
        setFileList(prev => prev.map(f =>
          f.uid === file.uid
            ? { ...f, status: 'success', url: result.url }
            : f
        ));

      } catch (err) {
        console.error('上传失败:', err);
        setFileList(prev => prev.map(f =>
          f.uid === file.uid ? { ...f, status: 'error' } : f
        ));
        message.error(`${file.name} 上传失败: ${err.message}`);
      }
    }

    setUploading(false);
    message.success('上传完成');
  };

  /**
   * 打开相机
   */
  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  /**
   * 打开相册
   */
  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  return (
    <div className="mobile-upload-container">
      {/* 文件列表 */}
      {fileList.length > 0 && (
        <div className="upload-preview-list">
          {fileList.map(file => (
            <div key={file.uid} className="preview-item">
              <div className="preview-image-wrapper">
                <img src={file.preview} alt={file.name} className="preview-image" />

                {/* 上传进度 */}
                {file.status === 'uploading' && (
                  <div className="upload-progress-overlay">
                    <Progress
                      type="circle"
                      percent={uploadProgress[file.uid] || 0}
                      width={60}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                    />
                  </div>
                )}

                {/* 状态标记 */}
                {file.status === 'success' && (
                  <div className="status-badge success">✓</div>
                )}
                {file.status === 'error' && (
                  <div className="status-badge error">✗</div>
                )}
              </div>

              {/* 操作按钮 */}
              <div className="preview-actions">
                <Button
                  type="text"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(file)}
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleRemove(file.uid)}
                  disabled={uploading}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮区域 */}
      <div className="upload-actions">
        {fileList.length < maxCount && (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Button
              block
              size="large"
              type="primary"
              icon={<CameraOutlined />}
              onClick={openCamera}
              disabled={uploading}
              className="touch-friendly-btn"
            >
              拍照上传
            </Button>

            <Button
              block
              size="large"
              icon={<PictureOutlined />}
              onClick={openGallery}
              disabled={uploading}
              className="touch-friendly-btn"
            >
              从相册选择
            </Button>
          </Space>
        )}

        {fileList.length > 0 && (
          <Button
            block
            size="large"
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleUploadAll}
            loading={uploading}
            disabled={fileList.every(f => f.status !== 'ready')}
            className="touch-friendly-btn upload-all-btn"
          >
            {uploading ? '上传中...' : `上传全部 (${fileList.filter(f => f.status === 'ready').length})`}
          </Button>
        )}
      </div>

      {/* 隐藏的文件输入 - 相机 */}
      <input
        ref={cameraInputRef}
        type="file"
        accept={accept}
        capture="environment"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'camera')}
      />

      {/* 隐藏的文件输入 - 相册 */}
      <input
        ref={galleryInputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFileChange(e, 'gallery')}
      />

      {/* 图片预览模态框 */}
      <Modal
        open={previewVisible}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        centered
        className="mobile-preview-modal"
      >
        <img src={previewImage} alt="预览" style={{ width: '100%' }} />
      </Modal>
    </div>
  );
};

export default MobileUpload;
