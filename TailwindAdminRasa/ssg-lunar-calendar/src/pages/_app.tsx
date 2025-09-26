import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Base meta tags - will be overridden by individual pages */}
        <meta name="robots" content="index, follow" />
        <meta name="language" content="vi" />
        <meta httpEquiv="Content-Language" content="vi" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}