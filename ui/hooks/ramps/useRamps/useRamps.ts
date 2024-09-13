import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { Hex, CaipChainId } from '@metamask/utils';
import {
  getCurrentChainId,
  getDataCollectionForMarketing,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
} from '../../../selectors';

type IUseRamps = {
  openBuyCryptoInPdapp: (chainId?: Hex | CaipChainId) => void;
  getBuyURI: (chainId: Hex | CaipChainId) => string;
};

export enum RampsMetaMaskEntry {
  BuySellButton = 'ext_buy_sell_button',
  NftBanner = 'ext_buy_banner_nfts',
  TokensBanner = 'ext_buy_banner_tokens',
  ActivityBanner = 'ext_buy_banner_activity',
  BtcBanner = 'ext_buy_banner_btc',
}

const portfolioUrl = process.env.PORTFOLIO_URL;
const useRamps = (
  metamaskEntry: RampsMetaMaskEntry = RampsMetaMaskEntry.BuySellButton,
): IUseRamps => {
  const chainId = useSelector(getCurrentChainId);
  const metaMetricsId = useSelector(getMetaMetricsId);
  const isMetaMetricsEnabled = useSelector(getParticipateInMetaMetrics);
  const isMarketingEnabled = useSelector(getDataCollectionForMarketing);

  const getBuyURI = useCallback(
    (_chainId: Hex | CaipChainId) => {
      const params = new URLSearchParams();
      params.set('metamaskEntry', metamaskEntry);
      params.set('chainId', _chainId);
      if (metaMetricsId) {
        params.set('metametricsId', metaMetricsId);
      }
      params.set('metricsEnabled', String(isMetaMetricsEnabled));
      if (isMarketingEnabled) {
        params.set('marketingEnabled', String(isMarketingEnabled));
      }

      return `${portfolioUrl}/buy?${params.toString()}`;
    },
    [metaMetricsId],
  );

  const openBuyCryptoInPdapp = useCallback(
    (_chainId?: Hex | CaipChainId) => {
      const buyUrl = getBuyURI(_chainId || chainId);
      global.platform.openTab({
        url: buyUrl,
      });
    },
    [chainId],
  );

  return { openBuyCryptoInPdapp, getBuyURI };
};

export default useRamps;
