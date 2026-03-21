import RegisterForm from '@/components/auth/RegisterForm';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import styles from '@/components/auth/AuthForm.module.css';

export default function RegisterPage() {
  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <RegisterForm />
      <div style={{ maxWidth: 400, margin: '0 auto', paddingInline: '2rem', paddingBottom: '2rem', marginTop: '-1rem', background: '#fff', borderRadius: '0 0 12px 12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <p className={styles.divider}>o</p>
        <GoogleSignInButton />
      </div>
    </div>
  );
}
