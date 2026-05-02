const LoadingSpinner = ({
  size = 'md',
  className = '',
  label = 'Loading your workspace...',
  fullScreen = false,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  const content = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className={`spinner animate-spin ${sizeClasses[size]}`} />
      {label ? <p className="text-sm font-medium text-theme-muted">{label}</p> : null}
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-[60vh] items-center justify-center">{content}</div>;
  }

  return content;
};

export const LoadingSkeleton = ({
  className = '',
  lines = 3,
  avatar = false,
  title = false,
}) => {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start gap-4">
        {avatar ? <div className="skeleton h-12 w-12 rounded-2xl" /> : null}
        <div className="flex-1 space-y-3">
          {title ? <div className="skeleton h-5 w-1/3" /> : null}
          {Array.from({ length: lines }).map((_, index) => (
            <div
              key={index}
              className={`skeleton h-4 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;