import { useState } from 'react';
import { Check, Link as LinkIcon } from 'lucide-react';
import { BrassButton } from './BrassButton';

interface Props {
  url: string;
}

/**
 * Tries the Web Share API first (Android Chrome, iOS Safari); falls back to
 * clipboard copy with a "kopiert" confirmation that auto-resets after 2 s.
 */
export const ShareButton = ({ url }: Props): JSX.Element => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const nav = navigator as Navigator & {
      share?: (data: { url: string; title?: string; text?: string }) => Promise<void>;
    };
    if (nav.share) {
      try {
        await nav.share({ url, title: 'Durak', text: 'Komm an meinen Durak-Tisch:' });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked — show the URL inline in an alert so the user can
      // copy it manually.
      window.prompt('Link zum Tisch:', url);
    }
  };

  return (
    <BrassButton
      variant="secondary"
      label={copied ? 'Kopiert' : 'Einladen'}
      icon={copied ? <Check size={16} /> : <LinkIcon size={16} />}
      onClick={handleShare}
    />
  );
};
