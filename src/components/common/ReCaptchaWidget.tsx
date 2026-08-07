import { useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaWidgetProps {
  onChange: (token: string | null) => void;
}

const IS_DEV = import.meta.env.DEV;
const DEV_BYPASS_TOKEN = 'dev-recaptcha-bypass';

export default function ReCaptchaWidget({ onChange }: ReCaptchaWidgetProps) {
  useEffect(() => {
    if (IS_DEV) {
      onChange(DEV_BYPASS_TOKEN);
    }
  }, [onChange]);

  if (IS_DEV) {
    return null;
  }

  return (
    <div className="flex justify-center">
      <ReCAPTCHA
        sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''}
        onChange={onChange}
        onExpired={() => onChange(null)}
      />
    </div>
  );
}
