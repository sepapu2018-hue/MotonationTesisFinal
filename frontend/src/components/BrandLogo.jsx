import logoImg from '../assets/motonaations.png'; 

export default function BrandLogo({ size = 36, className = "" }) {
  return (
    <img
      src={logoImg}
      alt="Motonation"
      width={size}
      height="auto"
      className={`brand-logo-anim ${className}`}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}