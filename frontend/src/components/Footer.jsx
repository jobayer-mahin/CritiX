// src/components/Footer.jsx
import { useNavigate } from 'react-router-dom';

export default function Footer() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const cols = [
    { title: 'Browse',  links: [['Movies', '/movies'], ['TV Shows', '/tv'], ['Community', '/community'], ['Search', '/search']] },
    { title: 'Account', links: [['My Profile', '/profile'], ['Write Review', '/add-review'], ['Sign In', '/login'], ['Sign Up', '/register']] },
    { title: 'About',   links: [['About Critix', null], ['Contact Us', null], ['Privacy Policy', null], ['Terms of Service', null]] },
    { title: 'Connect', links: [['Twitter / X', null], ['Instagram', null], ['Facebook', null], ['Discord', null]] },
  ];

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {cols.map(col => (
            <div key={col.title}>
              <div className="footer-col-title">{col.title}</div>
              <ul>
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <a onClick={() => to && navigate(to)}>{label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© {year} Critix. Subtle Thoughts on Cinema.</p>
          <div className="footer-socials">
            {[
              <path key="tw" d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>,
              <><rect key="ig1" x="2" y="2" width="20" height="20" rx="5"/><path key="ig2" d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line key="ig3" x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>
            ].map((path, i) => (
              <div key={i} className="footer-social">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{path}</svg>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
