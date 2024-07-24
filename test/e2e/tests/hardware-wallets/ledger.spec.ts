import { sendTransaction } from '../../page-objects/processes/send-transaction.process';
import { strict as assert } from 'assert';
import FixtureBuilder from '../../fixture-builder';
import { Driver } from '../../webdriver/driver';
import HomePage from '../../page-objects/pages/homepage';
import {
  defaultGanacheOptions,
  unlockWallet,
  withFixtures,
  regularDelayMs,
  convertETHToHexGwei,
} from '../../helpers';
import { shortenAddress } from '../../../../ui/helpers/utils/util';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../../stub/keyring-bridge';
import { Ganache } from '../../seeder/ganache';
import GanacheSeeder from '../../seeder/ganache-seeder';

/**
 * Connect Ledger hardware wallet without selecting an account
 *
 * @param {*} driver - Selenium driver
 */
async function connectLedger(driver: Driver) {
  // Open add hardware wallet modal
  await driver.clickElement('[data-testid="account-menu-icon"]');
  await driver.clickElement(
    '[data-testid="multichain-account-menu-popover-action-button"]',
  );
  await driver.clickElement({ text: 'Add hardware wallet' });
  // This delay is needed to mitigate an existing bug in FF
  // See https://github.com/metamask/metamask-extension/issues/25851
  await driver.delay(regularDelayMs);
  // Select Ledger
  await driver.clickElement('[data-testid="connect-ledger-btn"]');
  await driver.clickElement({ text: 'Continue' });
}

describe('Ledger Hardware', function () {
  it('derives the correct accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Check that the first page of accounts is correct
        for (const { address, index } of KNOWN_PUBLIC_KEY_ADDRESSES.slice(
          0,
          4,
        )) {
          const shortenedAddress = `${address.slice(0, 4)}...${address.slice(
            -4,
          )}`;
          assert(
            await driver.isElementPresent({
              text: shortenedAddress,
            }),
            `Known account ${index} not found`,
          );
        }
      },
    );
  });

  it('unlocks the first account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Select first account of first page and unlock
        await driver.clickElement('.hw-account-list__item__checkbox');
        await driver.clickElement({ text: 'Unlock' });

        // Check that the correct account has been added
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Ledger 1',
          }),
          'Ledger account not found',
        );
        assert(
          await driver.isElementPresent({
            text: shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[0].address),
          }),
          'Unlocked account is wrong',
        );
      },
    );
  });

  it('unlocks the multiple accounts', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Select all account of first page and unlock
        await driver.clickElement('[id="address-0"]');
        await driver.clickElement('[id="address-1"]');
        await driver.clickElement('[id="address-2"]');
        await driver.clickElement('[id="address-3"]');
        await driver.clickElement('[id="address-4"]');
        await driver.clickElement({ text: 'Unlock' });
        await driver.delay(1000);

        // Check that the correct account has been added
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Ledger 5',
          }),
          'Ledger account not found',
        );
        assert(
          await driver.isElementPresent({
            text: shortenAddress(KNOWN_PUBLIC_KEY_ADDRESSES[4].address),
          }),
          'Unlocked account is wrong',
        );
      },
    );
  });

  it('forgets the ledger account', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);
        await connectLedger(driver);

        // Select first account of first page and unlock
        await driver.clickElement('.hw-account-list__item__checkbox');
        await driver.clickElement({ text: 'Unlock' });
        await driver.delay(regularDelayMs);
        await driver.clickElement('[data-testid="account-menu-icon"]');
        await driver.clickElement(
          '[data-testid="multichain-account-menu-popover-action-button"]',
        );
        await driver.clickElement({ text: 'Add hardware wallet' });
        await driver.delay(regularDelayMs);
        // Select Ledger
        await driver.clickElement('[data-testid="connect-ledger-btn"]');
        await driver.clickElement({ text: 'Continue' });
        //Forget device
        await driver.clickElement('[class="hw-forget-device-container"]');
        // Check that the correct account has been forgotten
        await driver.clickElement('[data-testid="account-menu-icon"]');
        assert(
          await driver.isElementPresent({
            text: 'Account 1',
          }),
          'Ledger account found',
        );
      },
    );
  });

  it.only('can send a simple transaction from a ledger account to another', async function () {
    await withFixtures(
      {
        fixtures: new FixtureBuilder().build(),
        ganacheOptions: defaultGanacheOptions,
        title: this.test?.fullTitle(),
      },
      async ({
        driver,
        ganacheServer,
      }: {
        driver: Driver;
        ganacheServer: Ganache;
      }) => {
        await unlockWallet(driver);
        await connectLedger(driver);
        await driver.clickElement('[id="address-0"]');
        await driver.clickElement({ text: 'Unlock' });
        const ganacheSeeder = new GanacheSeeder(ganacheServer.getProvider());
        await ganacheSeeder.transfer(
          KNOWN_PUBLIC_KEY_ADDRESSES[0].address,
          convertETHToHexGwei(2),
        );
        await sendTransaction(
          driver,
          '0x985c30949c92df7a0bd42e0f3e3d539ece98db24',
          '1',
          '0.000042',
          '1.000042',
        );
        const homePage = new HomePage(driver);
        await homePage.check_confirmedTxNumberDisplayedInActivity();
        await homePage.check_txAmountInActivity();
      },
    );
  });
});