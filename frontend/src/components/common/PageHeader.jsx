import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

const PageHeader = ({
  badge,
  badgeIcon: BadgeIcon,
  title,
  highlightText,
  subtitle,
  actions,
  rightContent,
  pattern = 'gradient', // 'gradient', 'grid', 'dots'
}) => {
  const getPatternBackground = () => {
    switch (pattern) {
      case 'grid':
        return (
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                                 linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
        );
      case 'dots':
        return (
          <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.02]">
            <div
              className="h-full w-full"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(99, 102, 241, 0.15) 1px, transparent 1px)`,
                backgroundSize: '30px 30px',
              }}
            />
          </div>
        );
      default:
        return (
          <>
            {/* Gradient Glow 1 */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 blur-3xl"
            />
            {/* Gradient Glow 2 */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
              className="pointer-events-none absolute -right-20 -bottom-10 h-72 w-72 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 blur-3xl"
            />
          </>
        );
    }
  };

  return (
    <section className="card relative overflow-hidden p-6 md:p-8">
      {/* Background Pattern/Glow */}
      {getPatternBackground()}

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        {/* Left Content */}
        <div className="max-w-3xl flex-1">
          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-3 inline-flex items-center gap-2 rounded-full border border-theme bg-[color:var(--surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-theme-muted backdrop-blur-sm"
            >
              {BadgeIcon && <BadgeIcon size={14} className="text-[color:var(--accent)]" />}
              {badge}
            </motion.div>
          )}

          {/* Title with Gradient */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold leading-tight text-theme md:text-3xl lg:text-4xl"
          >
            {title}{' '}
            {highlightText && (
              <span className="relative inline-block">
                <span className="gradient-text">{highlightText}</span>
                {/* Animated Underline */}
                <motion.span
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="absolute -bottom-2 left-0 h-1 rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                />
              </span>
            )}
          </motion.h1>

          {/* Subtitle */}
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-3 max-w-2xl text-sm leading-relaxed text-theme-muted md:text-base"
            >
              {subtitle}
            </motion.p>
          )}

          {/* Actions */}
          {actions && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-6 flex flex-wrap items-center gap-3"
            >
              {actions}
            </motion.div>
          )}
        </div>

        {/* Right Content */}
        {rightContent && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="min-w-full md:min-w-[320px] md:max-w-sm"
          >
            {rightContent}
          </motion.div>
        )}
      </div>
    </section>
  );
};

PageHeader.propTypes = {
  badge: PropTypes.string,
  badgeIcon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  highlightText: PropTypes.string,
  subtitle: PropTypes.string,
  actions: PropTypes.node,
  rightContent: PropTypes.node,
  pattern: PropTypes.oneOf(['gradient', 'grid', 'dots']),
};

export default PageHeader;
