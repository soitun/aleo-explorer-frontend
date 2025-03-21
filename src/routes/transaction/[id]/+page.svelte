<script lang="ts">
  import { type BeforeContainerState, StatusClass } from "$lib/types"
  import { getContext } from "svelte"
  import Number from "$lib/components/Number.svelte"
  import DetailLine from "$lib/components/DetailLine.svelte"
  import Time from "$lib/components/Time.svelte"
  import { format_time, format_time_absolute_relative, TimeMode } from "$lib/time_mode.svelte.js"
  import Tabs from "$lib/components/Tabs.svelte"
  import { type ColumnDef, createTable, FlexRender, getCoreRowModel, renderComponent } from "@tanstack/svelte-table"
  import Fee from "$lib/components/Fee.svelte"
  import SnippetWrapper from "$lib/components/SnippetWrapper.svelte"
  import Link from "$lib/components/Link.svelte"
  import Status from "$lib/components/Status.svelte"
  import AleoToken from "$lib/components/AleoToken.svelte"
  import FeeBreakdown from "$lib/components/FeeBreakdown.svelte"

  let { data: server_data } = $props()
  let { data } = $derived(server_data)

  $inspect(data)

  let state = $derived(data.state)
  let type = $derived(data.type)

  const tab_data = [
    { title: "Transitions", id: "transitions" },
    { title: "Mapping operations", id: "mapping" },
    // { title: "Finalize call graph", id: "finalize-call" },
  ]

  let fee = $derived.by(() => {
    if (state === "Unconfirmed") {
      return data.transaction.fee
    } else {
      return data.confirmed_transaction.transaction.fee
    }
  })

  type TransitionList = {
    index: string
    transition_id: string
    action: { program: string; function: string }
  }

  let transitions = $derived.by(() => {
    if (type === "Execute") {
      if (state === "Accepted") {
        const tx = data.confirmed_transaction.transaction
        let list = [...tx.execution.transitions]
        if (tx.fee) {
          list.push(tx.fee.transition)
        }
        return list
      } else if (state === "Rejected") {
        return [data.confirmed_transaction.transaction.fee.transition]
      } else {
        let list = [...data.transaction.execution.transitions]
        if (data.transaction.fee) {
          list.push(data.transaction.fee.transition)
        }
        return list
      }
    } else if (type === "Deploy") {
      if (data.confirmed_transaction) {
        return [data.confirmed_transaction.transaction.fee.transition]
      } else {
        return [data.transaction.fee.transition]
      }
    } else {
      return []
    }
  })

  $inspect(transitions)

  let transition_table_data: TransitionList[] = $derived(
    transitions.map((transition: any, index: number) => {
      let display_index = index.toString()
      if (
        index === transitions.length - 1 &&
        transition.program_id === "credits.aleo" &&
        transition.function_name.startsWith("fee_")
      ) {
        display_index = "Fee"
      }
      return {
        index: display_index,
        transition_id: transition.id,
        action: {
          program: transition.program_id,
          function: transition.function_name,
        },
      }
    }),
  )

  const transition_table_columns: ColumnDef<TransitionList, any>[] = [
    {
      accessorKey: "index",
      header: "Index",
      cell: (info) => info.getValue(),
    },
    {
      accessorKey: "transition_id",
      header: "Transition ID",
      cell: (info) => renderComponent(SnippetWrapper, { snippet: transition_id_column, value: info.getValue() }),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: (info) => renderComponent(SnippetWrapper, { snippet: action_column, value: info.getValue() }),
    },
  ]

  const transition_table = createTable<TransitionList>({
    get data() {
      return transition_table_data
    },
    columns: transition_table_columns,
    getCoreRowModel: getCoreRowModel(),
  })

  let before_container_state: BeforeContainerState = getContext("before_container")
  before_container_state.snippet = before_container

  $effect(() => {
    return () => {
      before_container_state.snippet = undefined
    }
  })
</script>

<style lang="scss">
  @use "/static/styles/variables" as *;

  div.header {
    .transaction-icon {
      height: 32px;
      width: 32px;
      background-image: $transaction-icon;
    }

    .transaction-id {
      font-size: 1.375rem;
      font-weight: 600;
      font-family: "Montserrat Variable", sans-serif;
    }

    .transaction-title {
      font-size: 1rem;
      line-height: 1.5rem;
    }
  }

  .details {
    margin-top: 2.5rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    align-self: stretch;

    .group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
      width: 100%;
    }

    .details-line {
      width: 100%;
      height: 1px;
      background-color: $grey-100;
    }
  }

  .column {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .secondary {
    font-size: 0.75rem;
    line-height: 0.875rem;
    color: $grey-600;
  }

  #validator-toggle {
    color: $blue-600;
    cursor: pointer;
  }

  #validator-list {
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }

  table {
    width: 100%;
  }

  .tab {
    margin-top: 2rem;
  }

  .ellipsis {
    max-width: 30vw;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .aborted-header {
    font-size: 1rem;
    font-family: "Montserrat Variable", sans-serif;
    font-weight: 600;
    line-height: 1.25rem;
    margin-top: 1rem;
  }

  .fee-breakdown {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .mapping-operations {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .operation {
    display: grid;
    padding: 1.5rem;
    grid-row-gap: 1rem;
    grid-column-gap: 0.5rem;
    grid-template-columns: repeat(2, 1fr);
    grid-auto-rows: auto;
    border-radius: 1rem;
    border: 1px solid $grey-100;
    word-break: break-all;

    .column :nth-child(2) {
      line-height: 1.25rem;
    }
  }
</style>

{#snippet transition_id_column(value)}
  <div class="mono ellipsis">
    <Link href="/transition/{value}" content={value}></Link>
  </div>
{/snippet}

{#snippet action_column(value)}
  {#if value.function === undefined}
    <Link href="/program/{value.program}">
      <span class="mono">{value.program}</span>
    </Link>
  {:else}
    <div class="column">
      <span class="mono">{value.function}</span>
      <Link href="/program/{value.program}">
        <span class="secondary mono">{value.program}</span>
      </Link>
    </div>
  {/if}
{/snippet}

{#snippet before_container()}
  <div class="header">
    <div class="flex">
      <div class="transaction-icon"></div>
      <div class="vert">
        <div class="transaction-title">Transaction</div>
        <div class="transaction-id">
          {data.tx_id.slice(0, 11) + "..." + data.tx_id.slice(-6)}
        </div>
      </div>
    </div>
  </div>
{/snippet}

<div class="details">
  <div class="group">
    <DetailLine label="Transaction ID">
      <span class="mono">{data.tx_id}</span>
    </DetailLine>
    {#if state === "Rejected"}
      <DetailLine label="Original transaction ID">
        <span class="mono">{data.original_txid}</span>
      </DetailLine>
    {/if}
    {#if state !== "Unconfirmed"}
      <DetailLine label="Block">
        {#if data.first_seen < data.block_confirm_time}
          <div class="column">
            <Link href="/block/{data.height}">
              <Number number={data.height} />
            </Link>
            <span class="secondary">
              {#if state === "Accepted"}
                Confirmed
              {:else if state === "Rejected"}
                Rejected
              {:else if state === "Aborted"}
                Aborted
              {/if}
              {format_time_absolute_relative(data.block_confirm_time - data.first_seen, false)}
            </span>
          </div>
        {:else}
          <Link href="/block/{data.height}">
            <Number number={data.height} />
          </Link>
        {/if}
      </DetailLine>
      <DetailLine label="Timestamp">
        {format_time(new Date(data.block_timestamp * 1000), TimeMode.Relative)}
        <!-- @formatter:off -->
        (<Time timestamp={data.block_timestamp} />)
        <!-- @formatter:on -->
      </DetailLine>
    {:else}
      <DetailLine label="First seen">
        {format_time(new Date(data.first_seen * 1000), TimeMode.Relative)}
        <!-- @formatter:off -->
        (<Time timestamp={data.first_seen} />)
        <!-- @formatter:on -->
      </DetailLine>
    {/if}
  </div>
  <div class="group">
    <div class="details-line"></div>
  </div>
  <div class="group">
    <DetailLine label="Status">
      {#if state === "Accepted"}
        <Status cls={StatusClass.Success}>Accepted</Status>
      {:else if state === "Rejected"}
        <div class="column">
          <Status cls={StatusClass.Danger}>Rejected</Status>
          {data.reject_reason}
        </div>
      {:else if state === "Aborted"}
        <Status cls={StatusClass.Danger}>Aborted</Status>
      {:else}
        <Status cls={StatusClass.Info}>Unconfirmed</Status>
      {/if}
    </DetailLine>
  </div>
  <div class="group">
    <div class="details-line"></div>
  </div>
  <div class="group">
    <DetailLine label="Type">
      {type}
    </DetailLine>
    {#if type === "Deploy"}
      <DetailLine label="Program">
        {#if state === "Accepted"}
          <Link href="/program/{data.confirmed_transaction.transaction.deployment.program.id}">
            <span class="mono">{data.confirmed_transaction.transaction.deployment.program.id}</span>
          </Link>
        {:else if state === "Rejected"}
          <Link href="/program/{data.confirmed_transaction.rejected.deployment.program.id}">
            <span class="mono">{data.confirmed_transaction.rejected.deployment.program.id}</span>
          </Link>
        {:else}
          Not implemented
        {/if}
      </DetailLine>
    {/if}
    {#if state === "Accepted" || state === "Rejected"}
      <DetailLine label="Index">
        {data.confirmed_transaction.index}
      </DetailLine>
    {/if}
  </div>
  <div class="group">
    <div class="details-line"></div>
  </div>
  <div class="group">
    {#if fee}
      <DetailLine label="Total fee spent">
        <AleoToken number={fee.amount[0] + fee.amount[1]} suffix />
      </DetailLine>
      <DetailLine label="Breakdown">
        <div class="fee-breakdown">
          <FeeBreakdown amount={fee.amount[0]} label="Base fee"></FeeBreakdown>
          <FeeBreakdown amount={fee.amount[1]} label="Priority fee"></FeeBreakdown>
        </div>
      </DetailLine>
    {:else}
      <DetailLine label="Total fee spent">
        <AleoToken number="10000" suffix />
      </DetailLine>
      <DetailLine label="Breakdown">
        <div class="fee-breakdown">
          <FeeBreakdown amount="10000" label="Base fee"></FeeBreakdown>
          <FeeBreakdown amount="0" label="Priority fee"></FeeBreakdown>
        </div>
      </DetailLine>
    {/if}
  </div>
</div>

<Tabs {tab_data}>
  {#snippet transitions(binds)}
    <div class="tab" bind:this={binds.transitions}>
      <div class="table-container">
        <table>
          <thead>
            {#each transition_table.getHeaderGroups() as header_group}
              <tr>
                {#each header_group.headers as header}
                  <th>{header.column.columnDef.header}</th>
                {/each}
              </tr>
            {/each}
          </thead>
          <tbody>
            {#each transition_table.getRowModel().rows as row}
              <tr>
                {#each row.getVisibleCells() as cell}
                  <td>
                    <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />
                  </td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if state === "Rejected" && type === "Execute"}
        <div class="aborted-header">Rejected transitions</div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Index</th>
                <th>Transition ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {#each data.confirmed_transaction.rejected.execution.transitions as transition, index}
                <tr>
                  <td>{index}</td>
                  <td>
                    <Link href="/transition/{transition.id}">
                      <span class="mono">{transition.id}</span>
                    </Link>
                  </td>
                  <td>
                    <div class="column">
                      <span class="mono">{transition.function_name}</span>
                      <Link href="/program/{transition.program_id}">
                        <span class="secondary mono">{transition.program_id}</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>
  {/snippet}
  {#snippet mapping(binds)}
    <div class="tab" bind:this={binds.mapping}>
      <div class="mapping-operations">
        {#if state === "Accepted" || state === "Rejected"}
          {#each data.mapping_operations as op}
            <div class="operation">
              <div class="column">
                <span class="dim">Program</span>
                <Link href="/program/{op.program_id}">
                  <span class="mono">{op.program_id}</span>
                </Link>
              </div>
              <div class="column">
                <span class="dim">Mapping</span>
                <span class="mono">{op.mapping_name}[{op.key}]</span>
              </div>
              <div class="column">
                <span class="dim">Before</span>
                {#if op.limited_tracked}
                  <Status cls={StatusClass.Warning}>Not tracked</Status>
                {:else if op.previous_value === null}
                  <Status cls={StatusClass.Info}>New</Status>
                {:else}
                  <span class="mono">{op.previous_value}</span>
                {/if}
              </div>
              <div class="column">
                <span class="dim">After</span>
                {#if op.type === "Remove"}
                  <Status cls={StatusClass.Danger}>Removed</Status>
                {:else}
                  <span class="mono">{op.value}</span>
                {/if}
              </div>
            </div>
          {/each}
        {:else}{/if}
      </div>
    </div>
  {/snippet}
</Tabs>
