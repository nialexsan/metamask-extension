/* eslint-disable camelcase */
import { useEffect, useMemo } from 'react';
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
import { useQuoteProperties } from './useQuoteProperties';
import { useTradeProperties } from './useTradeProperties';

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
  const quoteListProperties = useQuoteProperties();
  const tradeProperties = useTradeProperties();

  const has_sufficient_funds = !insufficientBal;

  const usdConversionRatePromise = useMemo(() => {
    return (async () =>
      srcTokenAddress &&
      (await fetchUsdExchangeRates(currency, srcTokenAddress, chainId)))();
  }, [currency, srcTokenAddress, chainId]);

  useEffect(() => {
    const isInitialFetch = isLoading && quotesRefreshCount === 0;

    if (quoteRequestProperties && fromTokenInputValue && srcTokenAddress) {
      (async () => {
        const usdConversionRate = await usdConversionRatePromise;
        const usd_amount_source = usdConversionRate
          ? new Numeric(fromTokenInputValue, 10)
              .applyConversionRate(usdConversionRate)
              .toNumber()
          : fromAmountInFiat.toNumber();

        if (isInitialFetch || quoteFetchError) {
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
        } else if (
          quotesRefreshCount >= 0 &&
          quoteListProperties &&
          tradeProperties
        ) {
          // Emitted after each time quotes are fetched successfully
          trackCrossChainSwapsEvent({
            event: MetaMetricsEventName.QuotesReceived,
            properties: {
              ...quoteRequestProperties,
              ...requestMetadataProperties,
              ...quoteListProperties,
              ...tradeProperties,
              refresh_count: quotesRefreshCount,
              usd_amount_source,
              warnings: [], // TODO populate from validations
            },
          });
        }
      })();
    }
  }, [
    isLoading,
    quoteFetchError,
    quotesRefreshCount,
    quoteListProperties,
    tradeProperties,
  ]);
};
