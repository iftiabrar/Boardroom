
import { PaginationQueryDto } from "../dto/pagination-query.dto";

export function paginate<T>(
  items: T[],
  total: number,
  q: PaginationQueryDto,
) {
  return {
    items,
    meta: {
      page: q.page,
      limit: q.limit,
      total,
      totalPages: Math.ceil(total / q.limit),
    },
  };
}
