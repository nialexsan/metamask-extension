import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '../../../components/component-library';
import {
  getFromAmount,
  getFromChain,
  getFromToken,
  getToToken,
  getBridgeQuotes,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useSubmitBridgeTransaction from '../hooks/useSubmitBridgeTransaction';
import useLatestBalance from '../../../hooks/bridge/useLatestBalance';
import { useIsTxSubmittable } from '../../../hooks/bridge/useIsTxSubmittable';
import { useCrossChainSwapsEventTracker } from '../../../hooks/bridge/useCrossChainSwapsEventTracker';
import { useRequestProperties } from '../../../hooks/bridge/events/useRequestProperties';
import { useRequestMetadataProperties } from '../../../hooks/bridge/events/useRequestMetadataProperties';
import { useTradeProperties } from '../../../hooks/bridge/events/useTradeProperties';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';

export const BridgeCTAButton = () => {
  const dispatch = useDispatch();
  const t = useI18nContext();

  const fromToken = useSelector(getFromToken);
  const toToken = useSelector(getToToken);

  const fromChain = useSelector(getFromChain);

  const fromAmount = useSelector(getFromAmount);

  const { isLoading, activeQuote } = useSelector(getBridgeQuotes);

  const { submitBridgeTransaction } = useSubmitBridgeTransaction();

  const { isNoQuotesAvailable, isInsufficientBalance } =
    useSelector(getValidationErrors);

  const { normalizedBalance } = useLatestBalance(fromToken, fromChain?.chainId);

  const isTxSubmittable = useIsTxSubmittable();
  const trackCrossChainSwapsEvent = useCrossChainSwapsEventTracker();
  const { quoteRequestProperties } = useRequestProperties();
  const requestMetadataProperties = useRequestMetadataProperties();
  const tradeProperties = useTradeProperties();

  const label = useMemo(() => {
    if (isLoading && !isTxSubmittable) {
      return t('swapFetchingQuotes');
    }

    if (isNoQuotesAvailable) {
      return t('swapQuotesNotAvailableErrorTitle');
    }

    if (isInsufficientBalance(normalizedBalance)) {
      return t('alertReasonInsufficientBalance');
    }

    if (!fromAmount) {
      if (!toToken) {
        return t('bridgeSelectTokenAndAmount');
      }
      return t('bridgeEnterAmount');
    }

    if (isTxSubmittable) {
      return t('confirm');
    }

    return t('swapSelectToken');
  }, [
    isLoading,
    fromAmount,
    toToken,
    isTxSubmittable,
    normalizedBalance,
    isInsufficientBalance,
  ]);

  return (
    <Button
      data-testid="bridge-cta-button"
      onClick={() => {
        if (activeQuote && isTxSubmittable) {
          (async () =>
            quoteRequestProperties &&
            requestMetadataProperties &&
            tradeProperties &&
            trackCrossChainSwapsEvent({
              event: MetaMetricsEventName.ActionSubmitted,
              properties: {
                ...quoteRequestProperties,
                ...requestMetadataProperties,
                ...(await tradeProperties()),
              },
            }))();
          dispatch(submitBridgeTransaction(activeQuote));
        }
      }}
      disabled={!isTxSubmittable}
    >
      {label}
    </Button>
  );
};
