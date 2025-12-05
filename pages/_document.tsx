import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Favicon */}
        <link rel="icon" href="/christuniFAVICON.JPG" />
        <link rel="apple-touch-icon" href="/christunifavcion.png" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#6b1c23" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* PWA Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="AUTH - Christ University" />
        
        {/* Improved PWA Compatibility */}
        <meta name="application-name" content="AUTH - Admissions" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#6b1c23" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* SEO */}
        <meta name="description" content="AUTH - Admissions Management System for Christ University. Streamlined interview and admission process management." />
        <meta name="keywords" content="Christ University, AUTH, Admissions, Interview Management, Admission Process" />
        
        {/* Open Graph / Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="AUTH - Christ University Admissions" />
        <meta property="og:description" content="Comprehensive admissions interview management system for Christ University" />
        <meta property="og:image" content="/christunilogo.png" />
        
        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
        
        {/* Additional Icons */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512x512.png" />
      </Head>
      <body className="pwa-safe-bottom">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
