import { ClientOnly } from 'remix-utils/client-only';
import { Menu } from '~/components/sidebar/Menu.client';
import { classNames } from '~/utils/classNames';
import styles from './ModernLayout.module.scss';

interface ModernLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

export function ModernLayout({ children, showSidebar = true }: ModernLayoutProps) {
  return (
    <div className={classNames('flex h-full w-full overflow-hidden', styles.modernLayout)}>
      {showSidebar && (
        <aside className={classNames('flex-shrink-0', styles.sidebar)}>
          <ClientOnly fallback={<div className="w-64" />}>{() => <Menu alwaysVisible={true} />}</ClientOnly>
        </aside>
      )}
      <main className={classNames('flex-1 flex flex-col relative overflow-hidden', styles.mainContent)}>
        <div className={styles.gradientBackground} />
        <div className={classNames('flex-1 flex flex-col relative z-10', styles.contentWrapper)}>{children}</div>
      </main>
    </div>
  );
}

