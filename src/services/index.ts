// CRDT Document Service
export {
  CRDTDocumentService,
  getCRDTDocumentService,
  default as crdtDocumentService,
} from './crdtDocumentService'

export type {
  DocumentChange,
  UserAwarenessState,
  CollaborativeEditor as CRDTEditor,
  ConnectionStatus,
  DocumentEventType,
  DocumentEventHandlers,
} from './crdtDocumentService'

// Collaboration Service
export { CollaborationService, default as collaborationService } from './collaborationService'

export type {
  User,
  CursorPosition,
  SelectionRange,
  ChatMessage,
  ActivityEvent,
} from './collaborationService'
