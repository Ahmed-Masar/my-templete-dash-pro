import type { AppDispatch } from '@/store';
import { toggleTheme } from '@/store/slices/themeSlice';

export function toggleThemeWithTransition(
  e: React.MouseEvent<HTMLButtonElement>,
  dispatch: AppDispatch
) {
  const x = e.clientX;
  const y = e.clientY;

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  if (!(document as any).startViewTransition) {
    dispatch(toggleTheme());
    return;
  }

  const transition = (document as any).startViewTransition(() => {
    dispatch(toggleTheme());
  });

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 500,
        easing: 'ease-in-out',
        pseudoElement: '::view-transition-new(root)',
      }
    );
  });
}
