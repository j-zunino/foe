# Open questions

1. Does v1 need a way to open the project directory or validate it from the UI beyond adding it?
2. Is a Vite-dev-server-only setup acceptable for v1, given static asset serving is the last hardening item and no longer blocks anything else?
3. Should the backend expose a “force kill” action for a stuck chat, or is socket close enough?
4. Is a generic `authenticate` step worth adding in v1.1, or should all auth remain in the CLIs?
5. When chats are persisted, should history replay from stored `SessionUpdate` rows, or be re-fetched from the agent with `session/load`? Only one of the two can be authoritative.
