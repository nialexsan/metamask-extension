/* eslint-disable camelcase */
import { useSelector } from 'react-redux';
import {
  getBridgeQuotes,
  getFromAmountInFiat,
  getFromConversionRate,
  getQuoteRequest,
  getToConversionRate,
} from '../../../ducks/bridge/selectors';
import { getCurrentCurrency, getUSDConversionRate } from '../../../selectors';
import { getFromTokenInputValue } from '../../../ducks/swaps/swaps';
import { tokenAmountToFiat } from '../../../ducks/bridge/utils';

const USD_CURRENCY_CODE = 'usd';

// This hook is used to get the converted USD amounts for the bridge trade
// It returns fiat values if the user's selected currency is USD
// Otherwise, it converts the fiat values to USD using the exchange rates
// If the amount's usd value is not available, it defaults to 0
export const useConvertedUsdAmounts = () => {
  const { srcTokenAddress, destTokenAddress } = useSelector(getQuoteRequest);
  const { activeQuote } = useSelector(getBridgeQuotes);
  const fromAmountInputValueInFiat = useSelector(getFromAmountInFiat);
  const srcTokenAmount = useSelector(getFromTokenInputValue);
  const fromTokenConversionRate = useSelector(getFromConversionRate);
  const toTokenConversionRate = useSelector(getToConversionRate);
  const currency = useSelector(getCurrentCurrency);

  // Use values from activeQuote if available, otherwise use validated input field values
  const fromTokenAddress = (
    activeQuote ? activeQuote.quote.srcAsset.address : srcTokenAddress
  )?.toLowerCase();
  const toTokenAddress = (
    activeQuote ? activeQuote.quote.destAsset.address : destTokenAddress
  )?.toLowerCase();

  const fromAmountInFiat =
    activeQuote?.sentAmount?.fiat ?? fromAmountInputValueInFiat;
  const fromAmount = activeQuote?.sentAmount.amount ?? srcTokenAmount;

  const isCurrencyUsd = currency.toLowerCase() === USD_CURRENCY_CODE;

  const nativeToUsdRate = useSelector(getUSDConversionRate);

  return {
    // If a quote is passed in, derive the usd amount source from the quote
    // otherwise use input field values
    usd_amount_source:
      fromAmount && fromTokenAddress && !isCurrencyUsd
        ? (fromTokenConversionRate?.usd &&
            tokenAmountToFiat(fromAmount, fromTokenConversionRate.usd)) ??
          0
        : fromAmountInFiat.toNumber(),
    // If user's selected currency is not usd, use usd exchange rates for
    // the gas token and convert the quoted gas amount to usd
    usd_quoted_gas:
      activeQuote?.gasFee.amount && !isCurrencyUsd
        ? tokenAmountToFiat(activeQuote.gasFee.amount, nativeToUsdRate) ?? 0
        : activeQuote?.gasFee.fiat?.toNumber() ?? 0,
    // If user's selected currency is not usd, use usd exchange rates for
    // the dest asset and convert the dest amount to usd
    usd_quoted_return:
      activeQuote?.toTokenAmount?.amount && toTokenAddress && !isCurrencyUsd
        ? (toTokenConversionRate.usd &&
            tokenAmountToFiat(
              activeQuote?.toTokenAmount?.amount,
              toTokenConversionRate.usd,
            )) ??
          0
        : activeQuote?.toTokenAmount?.fiat?.toNumber() ?? 0,
  };
};
