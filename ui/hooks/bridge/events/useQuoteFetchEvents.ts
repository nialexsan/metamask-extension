/* eslint-disable camelcase */
import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import {
  getBridgeQuotes,
  getFromAmount,
  getFromChain,
  getFromToken,
  getQuoteRequest,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useCrossChainSwapsEventTracker } from '../useCrossChainSwapsEventTracker';
import useLatestBalance from '../useLatestBalance';
import { SWAPS_CHAINID_DEFAULT_TOKEN_MAP } from '../../../../shared/constants/swaps';
import { useRequestMetadataProperties } from './useRequestMetadataProperties';
import { useRequestProperties } from './useRequestProperties';
import { useConvertedUsdAmounts } from './useConvertedUsdAmounts';
import { useQuoteProperties } from './useQuoteProperties';
import { useTradeProperties } from './useTradeProperties';

// This hook is used to track cross chain swaps events related to quote-fetching
export const useQuoteFetchEvents = () => {
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { isLoading, quotesRefreshCount, quoteFetchError } =
    useSelector(getBridgeQuotes);
  const { insufficientBal, srcTokenAddress } = useSelector(getQuoteRequest);
  const fromTokenInputValue = useSelector(getFromAmount);
  const validationErrors = useSelector(getValidationErrors);

  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const { srcUsdAmounts } = useConvertedUsdAmounts();
  const quoteListProperties = useQuoteProperties();
  const tradeProperties = useTradeProperties();

  const has_sufficient_funds = !insufficientBal;

  const fromToken = useSelector(getFromToken);
  const fromChain = useSelector(getFromChain);

  const { normalizedBalance } = useLatestBalance(fromToken, fromChain?.chainId);
  const { normalizedBalance: nativeAssetBalance } = useLatestBalance(
    fromChain?.chainId
      ? SWAPS_CHAINID_DEFAULT_TOKEN_MAP[
          fromChain.chainId as keyof typeof SWAPS_CHAINID_DEFAULT_TOKEN_MAP
        ]
      : null,
    fromChain?.chainId,
  );

  const warnings = useMemo(() => {
    const {
      isEstimatedReturnLow,
      isNoQuotesAvailable,
      isInsufficientGasBalance,
      isInsufficientGasForQuote,
      isInsufficientBalance,
    } = validationErrors;

    const latestWarnings = [];

    isEstimatedReturnLow && latestWarnings.push('low_return');
    isNoQuotesAvailable && latestWarnings.push('no_quotes');
    isInsufficientGasBalance(nativeAssetBalance) &&
      latestWarnings.push('insufficient_gas_balance');
    isInsufficientGasForQuote(nativeAssetBalance) &&
      latestWarnings.push('insufficient_gas_for_selected_quote');
    isInsufficientBalance(normalizedBalance) &&
      latestWarnings.push('insufficient_balance');

    return latestWarnings;
  }, [validationErrors]);

  useEffect(() => {
    const isInitialFetch = isLoading && quotesRefreshCount === 0;

    if (quoteRequestProperties && fromTokenInputValue && srcTokenAddress) {
      (async () => {
        const { usd_amount_source } = await srcUsdAmounts();
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
        }
      })();
    }
  }, [isLoading, quoteFetchError, quotesRefreshCount]);

  // Emitted after each time quotes are fetched successfully
  useEffect(() => {
    if (
      fromTokenInputValue &&
      srcTokenAddress &&
      !isLoading &&
      quotesRefreshCount >= 0 &&
      quoteListProperties.initial_load_time_all_quotes > 0 &&
      quoteRequestProperties &&
      !quoteFetchError &&
      tradeProperties
    ) {
      trackCrossChainSwapsEvent({
        event: MetaMetricsEventName.QuotesReceived,
        properties: {
          ...quoteRequestProperties,
          ...requestMetadataProperties,
          ...quoteListProperties,
          ...tradeProperties,
          refresh_count: quotesRefreshCount - 1,
          warnings,
        },
      });
    }
  }, [quotesRefreshCount]);
};
