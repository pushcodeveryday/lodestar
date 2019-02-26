import BN from "bn.js";
import {generateSeed, getActiveValidatorIndices, getEffectiveBalance} from "../../helpers/stateTransitionHelpers";
import {
  BeaconState, BLSPubkey, BLSSignature, Bytes32, Crosslink, Deposit, DepositInput, Eth1Data, Gwei,
  int,
  Validator,
  ValidatorIndex,
} from "../../types";
import {
  ZERO_HASH, LATEST_RANDAO_MIXES_LENGTH, SHARD_COUNT,
  LATEST_BLOCK_ROOTS_LENGTH, GENESIS_SLOT, GENESIS_FORK_VERSION,
  GENESIS_START_SHARD, GENESIS_EPOCH,
  MAX_DEPOSIT_AMOUNT, LATEST_ACTIVE_INDEX_ROOTS_LENGTH, LATEST_SLASHED_EXIT_LENGTH,
} from "../../constants";
import {hashTreeRoot, processDeposit} from "./index";

import {
  activateValidator,
} from "../../helpers/validatorStatus";

/**
 * Generate the initial beacon chain state.
 * @param {Deposit[]} initialValidatorDeposits
 * @param {int} genesisTime
 * @param {Eth1Data} latestEth1Data
 * @returns {BeaconState}
 */
export function getInitialBeaconState(
  genesisValidatorDeposits: Deposit[],
  genesisTime: int,
  latestEth1Data: Eth1Data): BeaconState {

  const initialCrosslinkRecord: Crosslink = {
    epoch: GENESIS_EPOCH,
    shardBlockRoot: ZERO_HASH
  };

  const state: BeaconState = {
    // MISC
    slot: GENESIS_SLOT,
    genesisTime: new BN(genesisTime),
    fork: {
      previousVersion: GENESIS_FORK_VERSION,
      currentVersion: GENESIS_FORK_VERSION,
      epoch: GENESIS_EPOCH
    },
    // Validator registry
    validatorRegistry: [],
    validatorBalances: [],
    validatorRegistryUpdateEpoch: GENESIS_EPOCH,

    // Randomness and committees
    latestRandaoMixes: Array.from({length: LATEST_RANDAO_MIXES_LENGTH}, () => ZERO_HASH),
    previousShufflingStartShard: GENESIS_START_SHARD,
    currentShufflingStartShard: GENESIS_START_SHARD,
    previousShufflingEpoch: GENESIS_EPOCH,
    currentShufflingEpoch: GENESIS_EPOCH,
    previousShufflingSeed: ZERO_HASH,
    currentShufflingSeed: ZERO_HASH,

    // Finality
    previousJustifiedEpoch: GENESIS_EPOCH,
    justifiedEpoch: GENESIS_EPOCH,
    justificationBitfield: new BN(0),
    finalizedEpoch: GENESIS_EPOCH,

    // Recent state
    latestCrosslinks: Array.from({length: SHARD_COUNT}, () => initialCrosslinkRecord),
    latestBlockRoots: Array.from({length: LATEST_BLOCK_ROOTS_LENGTH}, () => ZERO_HASH),
    latestActiveIndexRoots: Array.from({length: LATEST_ACTIVE_INDEX_ROOTS_LENGTH}, () => ZERO_HASH),
    latestSlashedBalances: Array.from({length: LATEST_SLASHED_EXIT_LENGTH}, () => new BN(0)),
    latestAttestations: [],
    batchedBlockRoots: [],

    // PoW receipt root
    latestEth1Data: latestEth1Data,
    eth1DataVotes: [],
    depositIndex: new BN(genesisValidatorDeposits.length),
  };

  // Process initial deposists
  genesisValidatorDeposits.forEach(deposit => {
    processDeposit(
      state,
      deposit.depositData.depositInput.pubkey,
      deposit.depositData.amount,
      deposit.depositData.depositInput.proofOfPossession,
      deposit.depositData.depositInput.withdrawalCredentials,
    );
  });

  // Process genesis activations
  // TODO For loop is stubbed, should not cast new BN(i)
  for (let i = 0; i< state.validatorRegistry.length; i ++) {
    if (getEffectiveBalance(state, new BN(i)) >= MAX_DEPOSIT_AMOUNT) {
      activateValidator(state, new BN(i), true);
    }
  }

  const genesisActiveIndexRoot = hashTreeRoot(getActiveValidatorIndices(state.validatorRegistry, GENESIS_EPOCH));
  for (let index: number = 0; index < LATEST_ACTIVE_INDEX_ROOTS_LENGTH; index++) {
    state.latestActiveIndexRoots[index] = genesisActiveIndexRoot;
  }
  state.currentShufflingSeed = generateSeed(state, GENESIS_EPOCH);
  return state;
}
