import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = React.memo(({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  const pageNumbers = [];
  const maxPagesToShow = 5;
  
  if (totalPages <= maxPagesToShow) {
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
  } else {
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (currentPage <= 3) {
        endPage = maxPagesToShow;
    }
    if (currentPage >= totalPages - 2) {
        startPage = totalPages - maxPagesToShow + 1;
    }
    
    if (startPage > 1) {
        pageNumbers.push(1);
        if (startPage > 2) {
            pageNumbers.push('...');
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbers.push('...');
        }
        pageNumbers.push(totalPages);
    }
  }

  const buttonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";
  const activeClass = "bg-green-600 text-white shadow-md";
  const inactiveClass = "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700";
  const disabledClass = "bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700";

  return (
    <nav className="flex justify-center items-center space-x-2 space-x-reverse mt-6" aria-label="Pagination">
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`${buttonClass} ${currentPage === 1 ? disabledClass : inactiveClass}`}
      >
        السابق
      </button>
      
      <div className="flex items-center space-x-2 space-x-reverse">
        {pageNumbers.map((num, index) =>
          typeof num === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(num)}
              className={`${buttonClass} ${currentPage === num ? activeClass : inactiveClass}`}
              aria-current={currentPage === num ? 'page' : undefined}
            >
              {num}
            </button>
          ) : (
            <span key={index} className="px-1.5 py-1.5 text-sm text-slate-500 dark:text-slate-400">
              {num}
            </span>
          )
        )}
      </div>
      
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`${buttonClass} ${currentPage === totalPages ? disabledClass : inactiveClass}`}
      >
        التالي
      </button>
    </nav>
  );
});

export default Pagination;