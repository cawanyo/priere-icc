type PrayerFilter = {
    ordering?: 'asc' | 'desc'
    submissionDate?: string 
    status?: 'PENDING' | 'ANSWER' | 'FAILED',
    category?: string
    subjectType?: string
    subject?: string,
    page?: number
    pageSize?: number
  }

type RequestFilter = {
  ordering?: 'asc' | 'desc',
  status?: "APPROVED" | "REJECTED" | "PENDING",
  page?: number
  pageSize?: number
}


type TestimonyFilter = {
  page?: number;
  pageSize?: number;
  isPublic?: boolean;
  authorName?: string;
  ordering?: "asc" | "desc";
}