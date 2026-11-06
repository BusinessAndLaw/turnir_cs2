import {useEffect, useRef} from 'react';

export function useDialogClose(ref, afterClose) {
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  return () => {
    if (!ref.current || timer.current !== null) return;
    const element = ref.current;
    element.classList.add('closing');
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450;
    timer.current = setTimeout(() => {
      element.close();
      element.classList.remove('closing');
      timer.current = null;
      afterClose?.();
    }, delay);
  };
}

