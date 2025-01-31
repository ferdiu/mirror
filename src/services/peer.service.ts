import { Socket } from "socket.io";

/**
 * A map of peer IDs to their associated Socket objects.
 */
interface PeerStore {
  [peerId: string]: Socket;
}

/**
 * The `PeerService` class manages the connections and state of peers in a peer-to-peer network.
 * It provides methods to add, remove, and retrieve information about connected peers, as well as
 * manage the current broadcaster.
 */
export class PeerService {
  private peers: PeerStore = {};
  private broadcasterId: string | null = null;

  /************************** PEER **************************/

  /**
   * Adds a new peer to the peer store and logs the connection.
   * @param peerId - The ID of the peer to add.
   * @param socket - The socket associated with the peer.
   */
  addPeer(peerId: string, socket: Socket) {
    this.peers[peerId] = socket;
    console.log(`Peer connected: ${peerId}`);
  }

  /**
   * Removes a peer from the peer store, logs the disconnection, and handles any necessary cleanup.
   * @param peerId - The ID of the peer to remove.
   */
  removePeer(peerId: string) {
    console.log(`Peer disconnected: ${peerId}`);
    delete this.peers[peerId];
  }

  /**
   * Returns the peer store, which is a map of peer IDs to their associated sockets.
   * @returns {PeerStore} The peer store.
   */
  getPeers(): PeerStore {
    return this.peers;
  }

  /**
   * Returns the socket associated with the specified peer ID.
   * @param peerId - The ID of the peer to retrieve the socket for.
   * @returns {Socket} The socket associated with the specified peer ID.
   */
  getPeerSocket(peerId: string): Socket {
    return this.peers[peerId];
  }

  /**
   * Returns an array of all the peer IDs in the peer store.
   * @returns {string[]} An array of peer IDs.
   */
  getPeerIds(): string[] {
    return Object.keys(this.peers);
  }

  /************************** BROADCASTER **************************/

  /**
   * Returns the ID of the current broadcaster, if any.
   * @returns {string | null} The broadcaster ID, or `null` if no broadcaster is set.
   */
  getBroadcasterId(): string | null {
    return this.broadcasterId;
  }

  /**
   * Sets the ID of the current broadcaster.
   * @param peerId - The ID of the peer to set as the broadcaster, or `null` to clear the broadcaster.
   */
  setBroadcasterId(peerId: string | null) {
    this.broadcasterId = peerId;
  }

  /**
   * Checks if someone is currently broadcasting.
   * @returns {boolean} `true` if there is a current broadcaster, `false` otherwise.
   */
  isSomeoneBroadcasting(): boolean {
    return this.broadcasterId !== null;
  }

  /**
   * Checks if the specified peer is the current broadcaster.
   * @param peerId - The ID of the peer to check.
   * @returns {boolean} `true` if the specified peer is the current broadcaster, `false` otherwise.
   */
  isBroadcasting(peerId: string): boolean {
    return this.broadcasterId === peerId;
  }
}
