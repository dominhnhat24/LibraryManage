import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReaderShell } from './ReaderShell';

interface ReaderLayoutProps {
  children: ReactNode;
  rightPanel?: ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}

/** Kept as a compatibility wrapper; all reader routes now share ReaderShell. */
export function ReaderLayout({ children, searchValue, onSearchChange, onSearchSubmit }: ReaderLayoutProps) {
  const navigate = useNavigate();
  const submitSearch = (value: string) => {
    if (onSearchSubmit) onSearchSubmit(value);
    else navigate(value ? `/?search=${encodeURIComponent(value)}` : '/');
  };

  return <ReaderShell
    searchValue={searchValue}
    onSearchChange={onSearchChange}
    onSearchSubmit={submitSearch}
  >{children}</ReaderShell>;
}
