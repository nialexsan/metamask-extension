/* eslint-disable camelcase */
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromAmountInFiat,
  getQuoteRequest,
} from '../../../ducks/bridge/selectors';
import { useCrossChainSwapsEventTracker } from '../useCrossChainSwapsEventTracker';
import { getCurrentChainId, getCurrentCurrency } from '../../../selectors';
import { Numeric } from '../../../../shared/modules/Numeric';
import { fetchUsdExchangeRates } from './utils';
import { useRequestMetadataProperties } from './useRequestMetadataProperties';
import { useRequestProperties } from './useRequestProperties';

// This hook is used to track cross chain swaps events related to quote-fetching
export const useQuoteFetchEvents = () => {
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { isLoading, quotesRefreshCount, quoteFetchError } =
    useSelector(getBridgeQuotes);
  const { insufficientBal, srcTokenAddress } = useSelector(getQuoteRequest);
  const fromTokenInputValue = useSelector(getFromAmount);
  const fromAmountInFiat = useSelector(getFromAmountInFiat);
  const currency = useSelector(getCurrentCurrency);
  const chainId = useSelector(getCurrentChainId);

  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();

  const has_sufficient_funds = !insufficientBal;

  useEffect(() => {
    const isInitialFetch = isLoading && quotesRefreshCount === 0;
    if (
      quoteRequestProperties &&
      fromTokenInputValue &&
      srcTokenAddress &&
      (isInitialFetch || quoteFetchError)
    ) {
      (async () => {
        const usdConversionRate = await fetchUsdExchangeRates(
          currency,
          srcTokenAddress,
          chainId,
        );
        const usd_amount_source = usdConversionRate
          ? new Numeric(fromTokenInputValue, 10)
              .applyConversionRate(usdConversionRate)
              .toNumber()
          : fromAmountInFiat.toNumber();

        trackCrossChainSwapsEvent({
          event: quoteFetchError
            ? // Emitted when an error is caught during fetch
              MetaMetricsEventName.QuoteError
            : // Emitted when quotes are fetched for the first time for a given request
              MetaMetricsEventName.CrossChainSwapsQuotesRequested,
          properties: {
            ...quoteRequestProperties,
            ...requestMetadataProperties,
            has_sufficient_funds,
            usd_amount_source,
            error_message: quoteFetchError,
          },
        });
      })();
    }
  }, [isLoading, quoteFetchError]);
};
