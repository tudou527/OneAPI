export interface Page<T> {
  data: Array<T>;
  totalCount: number;
  currentPage: number;
  pageSize: number;
}
