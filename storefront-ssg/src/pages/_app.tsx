import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Storefront</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Trang bán hàng trực tuyến" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}