import ReCAPTCHA from 'react-google-recaptcha';

interface ReCaptchaWidgetProps {
  onChange: (token: string | null) => void;
}

export default function ReCaptchaWidget({ onChange }: ReCaptchaWidgetProps) {
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
