export interface LaneItem {
  id: string;
  name: string;
}

export interface PoolItem {
  id: string;
  name: string;
  lanes: LaneItem[];
}

export interface BranchItem {
  id: string;
  name: string;
  pools: PoolItem[];
}
