import { apiClient } from './client'

// 백엔드 ImageUploadResponse: { url: string }
// url은 S3 temp 경로의 이미지 URL. 게시글 저장 시 백엔드가
// temp -> posts/{postId}/ 로 이동시킨다.
export interface ImageUploadResponse {
  url: string
}

export const imagesApi = {
  // 에디터에서 이미지 즉시 업로드 (multipart/form-data, 필드명 "image")
  upload: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiClient.post<ImageUploadResponse>('/api/images/upload', form)
  },
}
