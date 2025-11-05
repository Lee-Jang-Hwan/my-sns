'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { X, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/**
 * @file CreatePostModal.tsx
 * @description 게시물 작성 모달 컴포넌트
 *
 * 주요 기능:
 * 1. 이미지 선택 및 미리보기 (1:1 정사각형)
 * 2. 캡션 입력 (최대 2,200자)
 * 3. 게시물 작성 준비 (API 연동은 다음 단계)
 *
 * @dependencies
 * - @/components/ui/dialog: Dialog 컴포넌트
 * - @/components/ui/button: Button 컴포넌트
 * - @/components/ui/textarea: Textarea 컴포넌트
 * - next/image: 이미지 최적화
 * - lucide-react: 아이콘
 */

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // 향후 API 성공 시 콜백
}

const MAX_CAPTION_LENGTH = 2200;

export default function CreatePostModal({
  open,
  onOpenChange,
  onSuccess,
}: CreatePostModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 이미지 미리보기 URL 생성 및 정리
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  // 모달이 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      setIsSubmitting(false);
    }
  }, [open]);

  // 파일 선택 핸들러
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
      setSelectedFile(file);
    }
  };

  // 파일 선택 버튼 클릭
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  // 이미지 제거
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 캡션 변경 핸들러
  const handleCaptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    if (value.length <= MAX_CAPTION_LENGTH) {
      setCaption(value);
    }
  };

  // 게시 버튼 클릭 핸들러
  const handleSubmit = async () => {
    if (!selectedFile) {
      alert('이미지를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('image', selectedFile);
      formData.append('caption', caption);

      // API 호출
      const response = await fetch('/api/posts', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || '게시물 작성에 실패했습니다.');
      }

      const data = await response.json();
      console.log('게시물 작성 성공:', data);

      // 성공 시 콜백 호출
      if (onSuccess) {
        onSuccess();
      }

      // 모달 닫기
      onOpenChange(false);
    } catch (error) {
      console.error('게시물 작성 에러:', error);
      alert(error instanceof Error ? error.message : '게시물 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 게시 버튼 활성화 여부
  const canSubmit = selectedFile && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b border-[#dbdbdb]">
          <DialogTitle className="text-base font-semibold text-[#262626] text-center">
            새 게시물 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* 이미지 선택/미리보기 영역 */}
          <div className="w-full aspect-square relative bg-gray-100 overflow-hidden">
            {previewUrl ? (
              <>
                <Image
                  src={previewUrl}
                  alt="게시물 이미지 미리보기"
                  fill
                  className="object-cover"
                  sizes="600px"
                />
                {/* 이미지 제거 버튼 */}
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-4 right-4 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  aria-label="이미지 제거"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <ImageIcon className="w-16 h-16 text-[#8e8e8e]" />
                <Button
                  type="button"
                  onClick={handleSelectFile}
                  variant="outline"
                  className="text-[#0095f6] border-[#0095f6] hover:bg-[#0095f6]/10"
                >
                  사진 선택
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  aria-label="이미지 파일 선택"
                />
              </div>
            )}
          </div>

          {/* 캡션 입력 영역 */}
          <div className="px-6 py-4 border-t border-[#dbdbdb]">
            <div className="space-y-2">
              <Textarea
                placeholder="캡션을 입력하세요..."
                value={caption}
                onChange={handleCaptionChange}
                rows={4}
                maxLength={MAX_CAPTION_LENGTH}
                className="resize-none border-[#dbdbdb] focus:border-[#0095f6] focus:ring-0 text-sm text-[#262626] placeholder:text-[#8e8e8e]"
              />
              <div className="flex justify-end">
                <span
                  className={cn(
                    'text-xs text-[#8e8e8e]',
                    caption.length >= MAX_CAPTION_LENGTH && 'text-[#ed4956]'
                  )}
                >
                  {caption.length}/{MAX_CAPTION_LENGTH}
                </span>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="px-6 py-4 border-t border-[#dbdbdb] flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="text-[#262626] border-[#dbdbdb] hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={cn(
                'text-white font-semibold',
                canSubmit
                  ? 'bg-[#0095f6] hover:bg-[#0095f6]/90'
                  : 'bg-[#0095f6]/50 cursor-not-allowed'
              )}
            >
              {isSubmitting ? '게시 중...' : '게시'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

