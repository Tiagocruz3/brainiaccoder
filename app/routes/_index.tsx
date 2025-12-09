import { json, type MetaFunction } from '@remix-run/cloudflare';
import { ClientOnly } from 'remix-utils/client-only';
import { BaseChat } from '~/components/chat/BaseChat';
import { Chat } from '~/components/chat/Chat.client';
import { Header } from '~/components/header/Header';
import { ModernLayout } from '~/components/layout/ModernLayout';

export const meta: MetaFunction = () => {
  return [{ title: 'Brainiac Coder' }, { name: 'description', content: 'Talk with Brainiac Coder, an AI assistant from StackBlitz' }];
};

export const loader = () => json({});

/**
 * Landing page component for Brainiac Coder
 * Note: Settings functionality should ONLY be accessed through the sidebar menu.
 * Do not add settings button/panel to this landing page as it was intentionally removed
 * to keep the UI clean and consistent with the design system.
 */
export default function Index() {
  return (
    <ModernLayout>
      <Header />
      <ClientOnly fallback={<BaseChat />}>{() => <Chat />}</ClientOnly>
    </ModernLayout>
  );
}
