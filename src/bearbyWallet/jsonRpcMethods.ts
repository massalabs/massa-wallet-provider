/**
 * Lists all JSON RPC Request Methods.
 */
export enum JSON_RPC_REQUEST_METHOD {
  // public Api
  GET_STATUS = 'get_status',
  GET_ADDRESSES = 'get_addresses',
  SEND_OPERATIONS = 'send_operations',
  GET_BLOCKS = 'get_blocks',
  GET_ENDORSEMENTS = 'get_endorsements',
  GET_OPERATIONS = 'get_operations',
  GET_CLIQUES = 'get_cliques',
  GET_STAKERS = 'get_stakers',
  GET_FILTERED_SC_OUTPUT_EVENT = 'get_filtered_sc_output_event',
  EXECUTE_READ_ONLY_BYTECODE = 'execute_read_only_bytecode',
  EXECUTE_READ_ONLY_CALL = 'execute_read_only_call',
  GET_DATASTORE_ENTRIES = 'get_datastore_entries',
  GET_BLOCKCLIQUE_BLOCK_BY_SLOT = 'get_blockclique_block_by_slot',
  GET_GRAPH_INTERVAL = 'get_graph_interval',

  // private Api
  STOP_NODE = 'stop_node',
  NODE_BAN_BY_IP = 'node_ban_by_ip',
  NODE_BAN_BY_ID = 'node_ban_by_id',
  NODE_UNBAN_BY_IP = 'node_unban_by_ip',
  NODE_UNBAN_BY_ID = 'node_unban_by_id',
  GET_STAKING_ADDRESSES = 'get_staking_addresses',
  REMOVE_STAKING_ADDRESSES = 'remove_staking_addresses',
  ADD_STAKING_PRIVATE_KEYS = 'add_staking_private_keys',
  NODE_SIGN_MESSAGE = 'node_sign_message',
  NODE_REMOVE_FROM_WHITELIST = 'node_remove_from_whitelist',
  NODE_ADD_TO_PEERS_WHITELIST = 'node_add_to_peers_whitelist',
}
