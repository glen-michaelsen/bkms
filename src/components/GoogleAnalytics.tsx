import Script from "next/script"

// Google Analytics (gtag.js). Rendered only on pre-login pages — see the
// session gate in the root layout. Loads the gtag library and initialises the
// given measurement ID; GA4 enhanced measurement then auto-tracks page views,
// outbound clicks, and scrolls.
export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
      </Script>
    </>
  )
}
