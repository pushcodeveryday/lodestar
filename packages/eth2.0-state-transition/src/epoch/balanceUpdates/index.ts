/**
 * @module chain/stateTransition/epoch
 */

import {BeaconState} from "@chainsafe/eth2.0-types";
import {IBeaconConfig} from "@chainsafe/eth2.0-config";

import {GENESIS_EPOCH} from "../../constants";
import {getCurrentEpoch, increaseBalance, decreaseBalance} from "../../util";
import {getAttestationDeltas} from "./attestation";

export function processRewardsAndPenalties(config: IBeaconConfig, state: BeaconState): void {
  if (getCurrentEpoch(config, state) == GENESIS_EPOCH) {
    return;
  }
  const [rewards, penalties] = getAttestationDeltas(config, state);
  state.validators.forEach((_, index) => {
    increaseBalance(state, index, rewards[index]);
    decreaseBalance(state, index, penalties[index]);
  });
}
