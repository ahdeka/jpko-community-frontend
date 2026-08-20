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
const IMAGE_UPLOAD_TIMEOUT_MS = 60_000

// 동영상 업로드 전용 타임아웃(더 길게).
// 동영상은 백엔드가 "업로드 수신 → ffmpeg 재인코딩(H.264/720p) 완료" 후에야 응답을 준다.
// 백엔드 VideoToMp4Converter 기준 최악의 대기 = 변환 슬롯 확보 대기 최대 20초 + 변환 최대 120초.
// 여기에 30MB 실제 전송 시간까지 더해지므로, 60초로는 서버가 정상 처리 중인데도 클라이언트가
// 먼저 끊길 수 있다. 서버 상한(20+120초)에 여유를 두어 180초로 잡는다.
const VIDEO_UPLOAD_TIMEOUT_MS = 180_000

export const imagesApi = {
  // 에디터에서 미디어(이미지/동영상) 즉시 업로드 (multipart/form-data, 필드명 "image")
  // isVideo=true면 서버 측 재인코딩 지연을 고려해 더 긴 타임아웃을 적용한다.
  upload: (file: File, opts?: { isVideo?: boolean }) => {
    const form = new FormData()
    form.append('image', file)
    const timeoutMs = opts?.isVideo ? VIDEO_UPLOAD_TIMEOUT_MS : IMAGE_UPLOAD_TIMEOUT_MS
    return apiClient.post<ImageUploadResponse>('/api/images/upload', form, {
      signal: AbortSignal.timeout(timeoutMs),
    })
  },
}
