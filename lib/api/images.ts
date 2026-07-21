import { apiClient } from './client'

// 백엔드 ImageUploadResponse: { url: string }
// url은 S3 temp 경로의 이미지 URL. 게시글 저장 시 백엔드가
// temp -> posts/{postId}/ 로 이동시킨다.
export interface ImageUploadResponse {
  url: string
}

// 이미지 업로드 전용 타임아웃.
// client.ts의 기본값은 10초인데, 이는 JSON 요청 기준이라 파일 업로드에는 너무 짧다.
// 10MB gif를 업로드 속도 5Mbps(모바일/가정용 회선에서 흔한 상향 대역폭) 환경에서 보내면
// 전송에만 16초가 걸려 기본 타임아웃으로는 파일이 다 나가기도 전에 요청이 끊긴다.
// 이 경우 백엔드에는 아무 로그도 남지 않아 원인 파악이 어렵다.
const UPLOAD_TIMEOUT_MS = 60_000

export const imagesApi = {
  // 에디터에서 이미지 즉시 업로드 (multipart/form-data, 필드명 "image")
  upload: (file: File) => {
    const form = new FormData()
    form.append('image', file)
    return apiClient.post<ImageUploadResponse>('/api/images/upload', form, {
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    })
  },
}
