import React from 'react';

export function Button({variant = 'primary', shape, className = '', ...props}) {
  return <button className={['button', `button--${variant}`, shape && `button--${shape}`, className].filter(Boolean).join(' ')} {...props} />;
}
