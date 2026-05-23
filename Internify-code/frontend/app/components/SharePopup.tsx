    'use client';

import { useState, useEffect } from 'react';
import styles from './SharePopup.module.css';

interface SharePopupProps {
  isOpen: boolean;
  onClose: () => void;
  internship: {
    title: string;
    company: string;
  };
}

export default function SharePopup({ isOpen, onClose, internship }: SharePopupProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareText = `Check out this internship: ${internship.title} at ${internship.company}`;
  
  const socialPlatforms = [
    {
      name: 'Twitter',
      icon: 'fab fa-twitter',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`,
      color: '#1DA1F2'
    },
    {
      name: 'LinkedIn',
      icon: 'fab fa-linkedin',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`,
      color: '#0077B5'
    },
    {
      name: 'Facebook',
      icon: 'fab fa-facebook',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`,
      color: '#4267B2'
    },
    {
      name: 'WhatsApp',
      icon: 'fab fa-whatsapp',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`,
      color: '#25D366'
    },
    {
      name: 'Email',
      icon: 'fas fa-envelope',
      url: `mailto:?subject=${encodeURIComponent(`Internship Opportunity: ${internship.title}`)}&body=${encodeURIComponent(shareText + '\n\n' + currentUrl)}`,
      color: '#EA4335'
    }
  ];

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Share this role</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.content}>
          <div className={styles.copySection}>
            <div className={styles.urlContainer}>
              <input 
                type="text" 
                value={currentUrl}
                readOnly
                className={styles.urlInput}
              />
              <button 
                className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
                onClick={handleCopyLink}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className={styles.socialSection}>
            <p className={styles.socialTitle}>Share on social media</p>
            <div className={styles.socialGrid}>
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  className={styles.socialButton}
                  style={{ '--social-color': platform.color } as React.CSSProperties}
                  onClick={() => handleSocialShare(platform.url)}
                >
                  <i className={platform.icon}></i>
                  <span>{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.quickActions}>
            <p className={styles.quickTitle}>Quick actions</p>
            <div className={styles.quickGrid}>
              <button className={styles.quickButton} onClick={handleCopyLink}>
                <i className="fas fa-link"></i>
                Copy Link
              </button>
              <button 
                className={styles.quickButton}
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i>
                Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}