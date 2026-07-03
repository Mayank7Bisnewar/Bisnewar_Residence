import { useEffect } from 'react';
import { showBannerAd, hideBannerAd } from '../lib/admob';

/**
 * A component that displays a bottom-anchored AdMob banner when mounted.
 * Automatically hides/removes the banner when unmounted.
 */
export const AdBanner = () => {
  useEffect(() => {
    // Show the banner when component mounts
    showBannerAd();

    // Hide and remove the banner when component unmounts
    return () => {
      hideBannerAd();
    };
  }, []);

  // Capacitor AdMob banners float above the web view.
  // We return a placeholder div with height so that underlying content
  // doesn't get obscured by the ad at the bottom of the screen.
  return <div className="h-[50px] w-full shrink-0" />;
};
