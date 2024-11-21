import { getAddress } from 'ethers/lib/utils';
import { fetchTokenExchangeRates } from '../../../helpers/utils/util';

// If the selected currency is not usd, fetch usd exchange rates for the token
// and convert the amount to usd
export const fetchUsdExchangeRates = async (
  currency: string,
  tokenAddress: string,
  chainId: string,
) => {
  if (tokenAddress && currency.toLowerCase() !== 'usd') {
    const exchangeRates = await fetchTokenExchangeRates(
      'usd',
      [tokenAddress],
      chainId,
    );
    return (
      exchangeRates?.[tokenAddress] ?? exchangeRates?.[getAddress(tokenAddress)]
    );
  }
  return undefined;
};
