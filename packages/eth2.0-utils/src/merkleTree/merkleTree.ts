/**
 * @module util/merkleTree
 */

import assert from "assert";
import {MerkleTree, number64, bytes32, Root} from "@chainsafe/eth2.0-types";
import {hash} from "../crypto";
import {intDiv} from "../math";
import {IProgressiveMerkleTree} from "./interface";

export interface IMerkleTreeSerialization {

  serializeTree(tree: MerkleTree): Buffer;

  serializeLength(length: number): Buffer;

  deserializeTree(tree: Buffer): MerkleTree;

}

export class ProgressiveMerkleTree implements IProgressiveMerkleTree {
  private readonly _depth: number;
  private readonly _zerohashes: bytes32[];
  private readonly serialization: IMerkleTreeSerialization;
  private _tree: bytes32[][];
  private _dirty: boolean;

  public constructor(depth: number, tree: bytes32[][], serialization: IMerkleTreeSerialization) {
    assert(depth > 1 && depth <= 52, "tree depth must be between 1 and 53");
    this._depth = depth;
    this._tree = tree;
    this._zerohashes = this.generateZeroHashes();
    this._dirty = false;
    this.serialization = serialization;
  }

  public static deserialize(data: Buffer, serialization: IMerkleTreeSerialization): ProgressiveMerkleTree {
    const value = serialization.deserializeTree(data);
    return new ProgressiveMerkleTree(
      value.depth,
      value.tree,
      serialization
    );
  }

  public static empty(depth: number, serialization: IMerkleTreeSerialization): ProgressiveMerkleTree {
    const tree = Array.from({length: depth + 1}, () => []);
    return new ProgressiveMerkleTree(
      depth,
      tree,
      serialization
    );
  }

  public depth(): number {
    return this._depth;
  }

  public push(item: bytes32): void {
    this._dirty = true;
    this._tree[0].push(item);
  }

  public add(index: number64, item: bytes32): void {
    this._dirty = true;
    this._tree[0][index] = item;
  }

  public getProof(index: number): bytes32[] {
    this.calculateBranchesIfNecessary();
    const proof: bytes32[] = [];
    for(let i = 0; i < this._depth; i++) {
      index = index % 2 === 1 ? index - 1 : index + 1;
      if(index < this._tree[i].length) {
        proof.push(this._tree[i][index]);
      } else {
        proof.push(this._zerohashes[i]);
      }
      index = intDiv(index, 2);
    }
    proof.push(this.serialization.serializeLength(this._tree[0].length));
    return proof;
  }

  public root(): Root {
    this.calculateBranchesIfNecessary();
    return this._tree[this._depth][0];
  }

  public toObject(): MerkleTree {
    return {
      depth: this._depth,
      tree: this._tree
    };
  }

  private calculateBranchesIfNecessary(): void {
    if (this._dirty) {
      this.calculateBranches();
    }
  }

  private calculateBranches(): void {
    for(let i = 0; i < this._depth; i++) {
      const parent = this._tree[i + 1];
      const child = this._tree[i];
      for(let j = 0; j < child.length; j += 2) {
        const left = child[j];
        const right = (j + 1) < child.length ? child[j + 1] : this._zerohashes[i];
        parent[j / 2] = hash(Buffer.concat([left, right]));
      }
      //unnecessary but makes clearer
      this._tree[i + 1] = parent;
    }
    this._dirty = false;
  }

  private generateZeroHashes(): bytes32[] {
    const zerohashes = Array.from({length: this._depth}, () => Buffer.alloc(32));
    for (let i = 0; i < this._depth - 1; i++) {
      zerohashes[i + 1] =
        hash(Buffer.concat([
          zerohashes[i],
          zerohashes[i],
        ]));
    }
    return zerohashes;
  }

}

