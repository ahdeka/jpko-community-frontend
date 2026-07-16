import { apiClient } from './client'
import type {
  AdminReportDetail,
  AdminReportSummary,
  MyReport,
  PageResponse,
  ReportCreateBody,
  ReportResponse,
  ReportStatus,
  ReportTargetType,
} from '@/types'

// 신고 관련 API.
// 접수는 로그인 필수, 조회/처리는 관리자 전용(@PreAuthorize("hasRole('ADMIN')"))이며,
// apiClient가 credentials:'include'로 호출하므로 쿠키가 자동 전송된다.
export const reportsApi = {
  // 신고 접수.
  // 실패 code: REPORT_ALREADY_EXISTS(409, 이미 신고함), SELF_REPORT_NOT_ALLOWED(400, 본인 글),
  //           REPORT_DETAIL_REQUIRED(400, ETC인데 상세 미입력),
  //           POST_NOT_FOUND / COMMENT_NOT_FOUND(404, 이미 삭제된 대상)
  create: (body: ReportCreateBody) =>
    apiClient.post<ReportResponse>('/api/reports', body),

  // 마이페이지 - 내 신고 내역 (최신순 페이징).
  // 백엔드가 findByReporterIdOrderByCreatedAtDesc로 정렬을 고정하므로 sort는 보내지 않는다.
  getMyReports: (page = 0, size = 10) =>
    apiClient.get<PageResponse<MyReport>>(`/api/users/me/reports?page=${page}&size=${size}`),
}

// 관리자 전용 신고 API.
export const adminReportsApi = {
  // 신고 집계 목록 (대상별로 묶임).
  //
  // ⚠️ sort 파라미터를 절대 붙이지 말 것.
  //    백엔드 summarizeByTarget이 네이티브 쿼리이고 내부에 ORDER BY MAX(created_at) DESC가
  //    이미 박혀 있어서, Pageable에 sort가 실리면 Spring이 GROUP BY에 없는 컬럼으로
  //    ORDER BY를 덧붙여 쿼리가 깨진다.
  getSummaries: (
    params: { targetType?: ReportTargetType; status?: ReportStatus } = {},
    page = 0,
    size = 20,
  ) => {
    const search = new URLSearchParams({ page: String(page), size: String(size) })
    // 값이 없으면 파라미터 자체를 생략한다 — 백엔드가 required=false + null 체크로 "전체"를 의미한다.
    if (params.targetType) search.set('targetType', params.targetType)
    if (params.status) search.set('status', params.status)
    return apiClient.get<PageResponse<AdminReportSummary>>(
      `/api/admin/reports/summary?${search.toString()}`,
    )
  },

  // 특정 대상에 쌓인 신고 건별 상세 (신고자·사유·시각). 페이징 없이 전체를 내려준다.
  getDetails: (targetType: ReportTargetType, targetId: number) =>
    apiClient.get<AdminReportDetail[]>(
      `/api/admin/reports?targetType=${targetType}&targetId=${targetId}`,
    ),

  // 신고 처리 상태 일괄 변경.
  // 백엔드는 해당 대상의 PENDING 신고만 골라 바꾸므로, 이미 처리된 건은 영향받지 않는다.
  // PENDING으로는 되돌릴 수 없고(INVALID_INPUT), 사실상 REJECTED(반려) 전용이다 —
  // RESOLVED는 대상을 실제로 삭제하면 백엔드가 이벤트로 자동 전환해준다.
  updateTargetStatus: (
    targetType: ReportTargetType,
    targetId: number,
    status: Exclude<ReportStatus, 'PENDING'>,
  ) => apiClient.patch<void>('/api/admin/reports/target-status', { targetType, targetId, status }),
}
