import { AdMob, AdMobInitializationOptions, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdPluginEvents, AdmobConsentStatus } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

// Toggle this to false when you want to see standard test ads, or true for production release/your registered test device
const USE_REAL_ADS = true;

const AD_UNIT_IDS = {
  banner: {
    android: USE_REAL_ADS ? 'ca-app-pub-9145983565028518/6248315353' : 'ca-app-pub-3940256099942544/6300978111',
    ios: 'ca-app-pub-3940256099942544/2934735716',
  },
  interstitial: {
    android: USE_REAL_ADS ? 'ca-app-pub-9145983565028518/2096778354' : 'ca-app-pub-3940256099942544/1033173712',
    ios: 'ca-app-pub-3940256099942544/4411468910',
  }
};

export const initializeAdMob = async () => {
  if (Capacitor.getPlatform() === 'web') {
    console.log('AdMob is not supported on web. Only works on iOS/Android.');
    return;
  }

  try {
    const options: AdMobInitializationOptions = {
      initializeForTesting: !USE_REAL_ADS,
    };
    await AdMob.initialize(options);
    console.log('AdMob successfully initialized');
  } catch (err) {
    console.error('Failed to initialize AdMob', err);
  }
};

export const showInterstitialAd = async () => {
  if (Capacitor.getPlatform() === 'web') return;

  const adId = Capacitor.getPlatform() === 'android' 
    ? AD_UNIT_IDS.interstitial.android 
    : AD_UNIT_IDS.interstitial.ios;

  try {
    // Listen for events to know when ad is closed
    AdMob.addListener(InterstitialAdPluginEvents.Dismissed, () => {
      console.log('Interstitial ad closed');
    });

    await AdMob.prepareInterstitial({ adId, isTesting: !USE_REAL_ADS });
    await AdMob.showInterstitial();
  } catch (err) {
    console.error('Failed to show interstitial ad', err);
  }
};

export const showBannerAd = async () => {
  if (Capacitor.getPlatform() === 'web') return;

  const adId = Capacitor.getPlatform() === 'android' 
    ? AD_UNIT_IDS.banner.android 
    : AD_UNIT_IDS.banner.ios;

  const options: BannerAdOptions = {
    adId,
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0, // Positioned at the exact bottom
    isTesting: !USE_REAL_ADS,
  };

  try {
    await AdMob.showBanner(options);
  } catch (err) {
    console.error('Failed to show banner ad', err);
  }
};

export const hideBannerAd = async () => {
  if (Capacitor.getPlatform() === 'web') return;
  try {
    await AdMob.hideBanner();
    await AdMob.removeBanner();
  } catch (err) {
    console.error('Failed to hide banner ad', err);
  }
};
