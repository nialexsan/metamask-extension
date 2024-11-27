/* eslint-disable camelcase */
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmountInFiat,
  getQuoteRequest,
  getToChain,
} from '../../../ducks/bridge/selectors';
import { getCurrentCurrency } from '../../../selectors';
import { Numeric } from '../../../../shared/modules/Numeric';
import { decimalToHex } from '../../../../shared/modules/conversion.utils';
import { getTokenExchangeRates } from '../../../ducks/bridge/utils';
import { getFromTokenInputValue } from '../../../ducks/swaps/swaps';
import { zeroAddress } from 'ethereumjs-util';
import { getCurrentChainId } from '../../../../shared/modules/selectors/networks';

const USD_CURRENCY_CODE = 'usd';

export const useConvertedUsdAmounts = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const chainId = useSelector(getCurrentChainId);
  const fromAmountInFiat_ = useSelector(getFromAmountInFiat);
  const srcTokenAmount = useSelector(getFromTokenInputValue);
  const toChain = useSelector(getToChain);

  const currency = useSelector(getCurrentCurrency);

  // Use values from activeQuote if available, otherwise use validated input field values
  const fromTokenAddress = (
    activeQuote ? activeQuote.quote.srcAsset.address : srcTokenAddress
  )?.toLowerCase();
  const toTokenAddress = (
    activeQuote ? activeQuote.quote.destAsset.address : destTokenAddress
  )?.toLowerCase();
  const fromChainId = activeQuote
    ? decimalToHex(activeQuote.quote.srcChainId)
    : chainId;
  const toChainId = activeQuote
    ? decimalToHex(activeQuote.quote.destChainId)
    : toChain?.chainId;

  const fromAmountInFiat = activeQuote?.sentAmount?.fiat ?? fromAmountInFiat_;
  const fromAmount = activeQuote?.sentAmount.amount ?? srcTokenAmount;

  const isCurrencyUsd = currency.toLowerCase() === USD_CURRENCY_CODE;

  // If currency !== usd Fetch exchange rates for src native and selected token
  const usdSrcExchangeRates = useMemo(async () => {
    if (!isCurrencyUsd && fromTokenAddress) {
      return await getTokenExchangeRates(
        fromChainId,
        USD_CURRENCY_CODE,
        fromTokenAddress,
      );
    }
    return {};
  }, [currency, fromChainId, fromTokenAddress]);

  // If currency !== usd Fetch exchange rates for dest token
  const usdDestExchangeRates = useMemo(async () => {
    if (!isCurrencyUsd && toTokenAddress && activeQuote && toChainId) {
      return await getTokenExchangeRates(
        toChainId,
        USD_CURRENCY_CODE,
        toTokenAddress,
      );
    }
    return {};
  }, [currency, toTokenAddress, activeQuote]);

  return {
    // If a quote is passed in, derive the usd amount source from the quote
    // Otherwise use input field values
    srcUsdAmounts: async () => ({
      usd_amount_source:
        fromAmount && fromTokenAddress && !isCurrencyUsd
          ? new Numeric(fromAmount, 10)
              .applyConversionRate(
                (await usdSrcExchangeRates)[fromTokenAddress],
              )
              .toNumber()
          : fromAmountInFiat.toNumber(),
      usd_quoted_gas:
        activeQuote?.gasFee.amount && !isCurrencyUsd
          ? new Numeric(activeQuote.gasFee.amount, 10)
              .applyConversionRate((await usdSrcExchangeRates)[zeroAddress()])
              .toNumber()
          : activeQuote?.gasFee.fiat?.toNumber() ?? 0,
    }),
  };
};
