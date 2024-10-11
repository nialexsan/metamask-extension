import { errorCodes, ethErrors } from 'eth-rpc-errors';
import {
  Caip25CaveatType,
  Caip25EndowmentPermissionName,
} from '@metamask/multichain/caip25Permission';
import {
  getPermittedEthChainIds,
  addPermittedEthChainId,
} from '@metamask/multichain/adapters/caip-permission-adapter-permittedChains';
import {
  isPrefixedFormattedHexString,
  isSafeChainId,
} from '../../../../../shared/modules/network.utils';
import { UNKNOWN_TICKER_SYMBOL } from '../../../../../shared/constants/app';
import { getValidUrl } from '../../util';
import { CaveatTypes } from '../../../../../shared/constants/permissions';
import { PermissionNames } from '../../../controllers/permissions';

export function validateChainId(chainId) {
  const _chainId = typeof chainId === 'string' ? chainId.toLowerCase() : '';
  if (!isPrefixedFormattedHexString(_chainId)) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected 0x-prefixed, unpadded, non-zero hexadecimal string 'chainId'. Received:\n${chainId}`,
    });
  }

  if (!isSafeChainId(parseInt(_chainId, 16))) {
    throw ethErrors.rpc.invalidParams({
      message: `Invalid chain ID "${_chainId}": numerical value greater than max safe value. Received:\n${chainId}`,
    });
  }

  return _chainId;
}

export function validateSwitchEthereumChainParams(req) {
  if (!req.params?.[0] || typeof req.params[0] !== 'object') {
    throw ethErrors.rpc.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        req.params,
      )}`,
    });
  }
  const { chainId, ...otherParams } = req.params[0];

  if (Object.keys(otherParams).length > 0) {
    throw ethErrors.rpc.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${Object.keys(
        otherParams,
      )}`,
    });
  }

  return validateChainId(chainId);
}

export function validateAddEthereumChainParams(params) {
  if (!params || typeof params !== 'object') {
    throw ethErrors.rpc.invalidParams({
      message: `Expected single, object parameter. Received:\n${JSON.stringify(
        params,
      )}`,
    });
  }

  const {
    chainId,
    chainName,
    blockExplorerUrls,
    nativeCurrency,
    rpcUrls,
    ...otherParams
  } = params;

  const otherKeys = Object.keys(otherParams).filter(
    // iconUrls is a valid optional but not currently used parameter
    (v) => !['iconUrls'].includes(v),
  );

  if (otherKeys.length > 0) {
    throw ethErrors.rpc.invalidParams({
      message: `Received unexpected keys on object parameter. Unsupported keys:\n${otherKeys}`,
    });
  }

  const _chainId = validateChainId(chainId);
  if (!rpcUrls || !Array.isArray(rpcUrls) || rpcUrls.length === 0) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
    });
  }

  const isLocalhostOrHttps = (urlString) => {
    const url = getValidUrl(urlString);
    return (
      url !== null &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.protocol === 'https:')
    );
  };

  const firstValidRPCUrl = rpcUrls.find((rpcUrl) => isLocalhostOrHttps(rpcUrl));
  const firstValidBlockExplorerUrl = Array.isArray(blockExplorerUrls)
    ? blockExplorerUrls.find((blockExplorerUrl) =>
        isLocalhostOrHttps(blockExplorerUrl),
      )
    : null;

  if (!firstValidRPCUrl) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected an array with at least one valid string HTTPS url 'rpcUrls', Received:\n${rpcUrls}`,
    });
  }

  if (typeof chainName !== 'string' || !chainName) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected non-empty string 'chainName'. Received:\n${chainName}`,
    });
  }

  const _chainName =
    chainName.length > 100 ? chainName.substring(0, 100) : chainName;

  if (nativeCurrency !== null) {
    if (typeof nativeCurrency !== 'object' || Array.isArray(nativeCurrency)) {
      throw ethErrors.rpc.invalidParams({
        message: `Expected null or object 'nativeCurrency'. Received:\n${nativeCurrency}`,
      });
    }
    if (nativeCurrency.decimals !== 18) {
      throw ethErrors.rpc.invalidParams({
        message: `Expected the number 18 for 'nativeCurrency.decimals' when 'nativeCurrency' is provided. Received: ${nativeCurrency.decimals}`,
      });
    }

    if (!nativeCurrency.symbol || typeof nativeCurrency.symbol !== 'string') {
      throw ethErrors.rpc.invalidParams({
        message: `Expected a string 'nativeCurrency.symbol'. Received: ${nativeCurrency.symbol}`,
      });
    }
  }

  const ticker = nativeCurrency?.symbol || UNKNOWN_TICKER_SYMBOL;
  if (
    ticker !== UNKNOWN_TICKER_SYMBOL &&
    (typeof ticker !== 'string' || ticker.length < 1 || ticker.length > 6)
  ) {
    throw ethErrors.rpc.invalidParams({
      message: `Expected 1-6 character string 'nativeCurrency.symbol'. Received:\n${ticker}`,
    });
  }

  return {
    chainId: _chainId,
    chainName: _chainName,
    firstValidBlockExplorerUrl,
    firstValidRPCUrl,
    ticker,
  };
}

export async function switchChain(
  res,
  end,
  origin,
  chainId,
  networkClientId,
  approvalFlowId,
  {
    isAddFlow,
    setActiveNetwork,
    endApprovalFlow,
    getCaveat,
    requestPermissionApprovalForOrigin,
    updateCaveat,
    grantPermissions,
  },
) {
  try {
    const caip25Caveat = getCaveat({
      target: Caip25EndowmentPermissionName,
      caveatType: Caip25CaveatType,
    });

    if (caip25Caveat) {
      const ethChainIds = getPermittedEthChainIds(caip25Caveat.value);

      if (!ethChainIds.includes(chainId)) {
        if (caip25Caveat.value.isMultichainOrigin) {
          return end(
            new Error(
              'cannot switch to chain that was not permissioned in the multichain flow',
            ),
          ); // TODO: better error
        }

        // TODO: This behavior may have deviated from the original permittedChains add chain behavior
        // Verify that this helper behaves as expected
        if (!isAddFlow) {
          await requestPermissionApprovalForOrigin({
            [PermissionNames.permittedChains]: {
              caveats: [
                {
                  type: CaveatTypes.restrictNetworkSwitching,
                  value: [chainId],
                },
              ],
            },
          });
        }

        const updatedCaveatValue = addPermittedEthChainId(
          caip25Caveat.value,
          chainId,
        );

        updateCaveat(
          origin,
          Caip25EndowmentPermissionName,
          Caip25CaveatType,
          updatedCaveatValue,
        );
      }
    } else {
      if (!isAddFlow) {
        await requestPermissionApprovalForOrigin({
          [PermissionNames.permittedChains]: {
            caveats: [
              {
                type: CaveatTypes.restrictNetworkSwitching,
                value: [chainId],
              },
            ],
          },
        });
      }

      let caveatValue = {
        requiredScopes: {},
        optionalScopes: {},
        isMultichainOrigin: false,
      };
      caveatValue = addPermittedEthChainId(caveatValue, chainId);

      grantPermissions({
        subject: { origin },
        approvedPermissions: {
          [Caip25EndowmentPermissionName]: {
            caveats: [
              {
                type: Caip25CaveatType,
                value: caveatValue,
              },
            ],
          },
        },
      });
    }

    await setActiveNetwork(networkClientId);
    res.result = null;
  } catch (error) {
    // We don't want to return an error if user rejects the request
    // and this is a chained switch request after wallet_addEthereumChain.
    // approvalFlowId is only defined when this call is of a
    // wallet_addEthereumChain request so we can use it to determine
    // if we should return an error
    if (
      error.code === errorCodes.provider.userRejectedRequest &&
      approvalFlowId
    ) {
      res.result = null;
      return end();
    }
    return end(error);
  } finally {
    if (approvalFlowId) {
      endApprovalFlow({ id: approvalFlowId });
    }
  }
  return end();
}
