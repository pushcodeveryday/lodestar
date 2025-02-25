/**
 * @module sszTypes/generators
 */

import {IBeaconParams} from "@chainsafe/eth2.0-params";
import {SimpleContainerType} from "@chainsafe/ssz-type-schema";

import {IBeaconSSZTypes} from "../interface";

export const BeaconBlockBody = (ssz: IBeaconSSZTypes, params: IBeaconParams): SimpleContainerType => ({
  fields: [
    ["randaoReveal", ssz.BLSSignature],
    ["eth1Data", ssz.Eth1Data],
    ["graffiti", ssz.bytes32],
    ["proposerSlashings", {
      elementType: ssz.ProposerSlashing,
      maxLength: params.MAX_PROPOSER_SLASHINGS,
    }],
    ["attesterSlashings", {
      elementType: ssz.AttesterSlashing,
      maxLength: params.MAX_ATTESTER_SLASHINGS,
    }],
    ["attestations", {
      elementType: ssz.Attestation,
      maxLength: params.MAX_ATTESTATIONS,
    }],
    ["deposits", {
      elementType: ssz.Deposit,
      maxLength: params.MAX_DEPOSITS,
    }],
    ["voluntaryExits", {
      elementType: ssz.SignedVoluntaryExit,
      maxLength: params.MAX_VOLUNTARY_EXITS,
    }],
  ],
});

export const BeaconBlock = (ssz: IBeaconSSZTypes): SimpleContainerType => ({
  fields: [
    ["slot", ssz.Slot],
    ["parentRoot", ssz.Root],
    ["stateRoot", ssz.Root],
    ["body", ssz.BeaconBlockBody],
  ],
});

export const SignedBeaconBlock = (ssz: IBeaconSSZTypes): SimpleContainerType => ({
  fields: [
    ["message", ssz.BeaconBlock],
    ["signature", ssz.BLSSignature],
  ],
});
