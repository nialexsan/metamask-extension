import { JsonRpcMiddleware } from 'json-rpc-engine';
import MultichainSubscriptionManager, { createMultichainMiddlewareManager } from './multichainSubscriptionManager';

const newHeadsNotificationMock = {
  method: 'eth_subscription',
  params: {
    result: {
      difficulty: '0x15d9223a23aa',
      extraData: '0xd983010305844765746887676f312e342e328777696e646f7773',
      gasLimit: '0x47e7c4',
      gasUsed: '0x38658',
      logsBloom:
        '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      miner: '0xf8b483dba2c3b7176a3da549ad41a48bb3121069',
      nonce: '0x084149998194cc5f',
      number: '0x1348c9',
      parentHash:
        '0x7736fab79e05dc611604d22470dadad26f56fe494421b5b333de816ce1f25701',
      receiptRoot:
        '0x2fab35823ad00c7bb388595cb46652fe7886e00660a01e867824d3dceb1c8d36',
      sha3Uncles:
        '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
      stateRoot:
        '0xb3346685172db67de536d8765c43c31009d0eb3bd9c501c9be3229203f15f378',
      timestamp: '0x56ffeff8',
    },
  },
};

describe('multichainSubscriptionManager', () => {
  it('should subscribe to a chain', (done) => {
    const scope = 'eip155:1';
    const mockFindNetworkClientIdByChainId = jest.fn()
    const mockGetNetworkClientById = jest.fn().mockImplementation(() => ({
      blockTracker: {},
      provider: {},
    }));
    const subscriptionManager = new MultichainSubscriptionManager({
      findNetworkClientIdByChainId: mockFindNetworkClientIdByChainId,
      getNetworkClientById: mockGetNetworkClientById,
    });
    subscriptionManager.subscribe(scope);
    subscriptionManager.on('notification', (notification: any) => {
      expect(notification).toMatchObject({
        method: "wallet_invokeMethod",
        params: {
          scope,
          request: newHeadsNotificationMock,
        }
      });
      done();
    });
    subscriptionManager.onNotification(scope, newHeadsNotificationMock);
  });
});
describe('multichainMiddlewareManager', () => {
  it('should add middleware and get called for the scope', () => {
    const multichainMiddlewareManager = createMultichainMiddlewareManager();
    const middlewareSpy = jest.fn();
    multichainMiddlewareManager.addMiddleware('eip155:1', middlewareSpy);
    multichainMiddlewareManager.middleware({scope: 'eip155:1'}, {}, () => { }, () => {});
    expect(middlewareSpy).toHaveBeenCalled();
  })
  it('should remove middleware', () => {
    const multichainMiddlewareManager = createMultichainMiddlewareManager();
    const middlewareMock = jest.fn();
    (middlewareMock as unknown as {destroy: () => void}).destroy = jest.fn();
    const scope = 'eip155:1';
    multichainMiddlewareManager.addMiddleware(scope, middlewareMock);
    multichainMiddlewareManager.removeMiddleware(scope);
    expect(() => {
      multichainMiddlewareManager.middleware({scope}, {}, () => { }, () => {});
    }).toThrow();
  })
});
