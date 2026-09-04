import * as React from 'react';
import { Pagination } from 'wiggy-design-system';

export function MiddlePage() {
  const [page, setPage] = React.useState(2);
  return <Pagination page={page} pageCount={7} onPageChange={setPage} totalLabel="128 הזמנות" />;
}

export function LastPage() {
  const [page, setPage] = React.useState(7);
  return <Pagination page={page} pageCount={7} onPageChange={setPage} totalLabel="128 הזמנות" />;
}
