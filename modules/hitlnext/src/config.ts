export interface Config {
  /**
   * @param agentSessionTimeout Once an agent becomes inactive, how long before automatically switching the agent to offline. - refer to https://www.npmjs.com/package/ms for options
   * @default 10m
   */
  agentSessionTimeout: string

  /**
   * @param messageCount Number of messages to display in the conversation history
   * @default 10
   */
  messageCount: number

  /**
   * @param defaultUsername Wether or not to display a random username for anonymous users
   * @default false
   */
  defaultUsername: boolean

  /**
   * @param botAvatarUrl Image url you want to display as avatar when an agent takes control
   */
  botAvatarUrl?: string

  /**
   * @param tags List of tags that a handoff can be associated with
   * @default []
   */
  tags?: string[]
}
