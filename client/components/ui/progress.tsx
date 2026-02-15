import * as React from "react"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className = "", value = 0, ...props }, ref) => (
    <div
      ref={ref}
      className={`relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
      {...props}
    >
      <div
        className="h-full w-full flex-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all"
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  )
)
Progress.displayName = "Progress"

export { Progress }
