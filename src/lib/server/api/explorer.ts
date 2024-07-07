import { API } from "$lib/server/api/api"
import { APIBase } from "$lib/server/api/base"
import type { APIBaseMixin } from "$lib/utils"

type SyncInfo = {
  out_of_sync: boolean
  maintenance_info: string
  explorer_height: number
  node_height: number
  reference_height: number
}

type Summary = {
  latest_height: number
  latest_timestamp: number
  proof_target: bigint
  coinbase_target: bigint
  network_speed: number
  validators: number
  participation_rate: number
}

export function APIExplorer<TBase extends APIBaseMixin>(Base: TBase) {
  return class extends Base {
    constructor(...args: never[]) {
      super(...args)
    }

    public async sync_info(this: API): Promise<SyncInfo> {
      return await super.get("/sync")
    }

    public async summary(this: API): Promise<Summary> {
      return await super.get("/summary")
    }
  }
}
