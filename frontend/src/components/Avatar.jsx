import React from 'react';

// Color palette for avatar backgrounds based on initials
const COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#D97706',
  '#059669', '#0891B2', '#0284C7', '#2563EB', '#7C3AED'
];

const getColorFromName = (name) => {
  if (!name) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
};

const getInitials = (firstName, lastName) => {
  const first = (firstName || '').charAt(0).toUpperCase();
  const last = (lastName || '').charAt(0).toUpperCase();
  return `${first}${last}` || '??';
};

const Avatar = ({
  firstName,
  lastName,
  photo,
  size = 'md',
  className = '',
  showName = false
}) => {
  const initials = getInitials(firstName, lastName);
  const bgColor = getColorFromName(`${firstName}${lastName}`);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-2xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 overflow-hidden`}
        style={{ backgroundColor: photo ? undefined : bgColor }}
      >
        {photo ? (
          <img
            src={photo}
            alt={`${firstName} ${lastName}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.style.backgroundColor = bgColor;
              e.target.parentNode.textContent = initials;
            }}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      {showName && (
        <span className="text-sm font-medium text-gray-800 truncate">
          {firstName} {lastName}
        </span>
      )}
    </div>
  );
};

export default Avatar;
