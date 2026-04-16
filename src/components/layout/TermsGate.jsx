import { useNavigate } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import TermsDialog from '@/components/common/TermsDialog';

/** Blocks the shell until terms are accepted (Traccar server policy). */
export default function TermsGate({ children }) {
  const { user, server } = useSession();
  const navigate = useNavigate();
  const termsUrl = server?.attributes?.termsUrl;

  if (termsUrl && user && !user.attributes?.termsAccepted) {
    return (
      <TermsDialog
        open
        termsUrl={termsUrl}
        onAccepted={() => {}}
        onCancel={() => navigate('/login', { replace: true })}
      />
    );
  }

  return children;
}
