# Noted

A real-time collaborative notes workspace — think a focused, self-hostable slice
of Google Docs. Multiple people can edit the same note simultaneously and see
each other's changes live, notes are organized into folders and shared by email,
and everything is a flat, keyboard-friendly, editorial UI.

Built with React, Firebase, and a **Yjs (CRDT) collaboration engine that syncs
over Firestore** — real-time multi-user editing with no dedicated realtime
server to run or pay for.

---

## Highlights

- **Real-time collaborative editing** — concurrent edits merge without conflicts
  using [Yjs](https://github.com/yjs/yjs) CRDTs. The encoded document state is
  synchronized through Firestore (`onSnapshot`), so collaboration works with
  zero extra infrastructure. An optional `y-websocket` server adds lower latency
  and live cursors when configured.
- **Rich text editor** — [Tiptap](https://tiptap.dev/) with headings, lists,
  task lists, code blocks, highlights, links, alignment, images, and more.
- **Folders, search, and sharing** — organize notes into folders, full-text
  search across titles and content, and share a note with any other user by
  email (resolved through Firestore — no admin backend).
- **Auth** — email/password and Google sign-in via Firebase Auth, with a
  self-healing user profile document.
- **Image uploads** to Firebase Storage, **Markdown/PDF export**, autosave with
  a live save indicator and word count.
- **Light / dark theme** with a considered design system (Space Grotesk + Inter,
  flat colors, sharp corners, 1px borders).
- **Security rules** for Firestore and Storage, scoped to note owners and
  collaborators.

## Tech stack

| Area            | Choice                                             |
| --------------- | -------------------------------------------------- |
| UI              | React 19, Material UI (custom theme)               |
| Editor          | Tiptap 2 (ProseMirror)                             |
| Collaboration   | Yjs CRDTs, synced over Firestore (+ optional y-websocket) |
| Backend / data  | Firebase — Auth, Firestore, Storage                |
| Build           | Create React App                                   |

## Architecture: how collaboration works

The interesting part of this project is that it delivers Google-Docs-style
real-time editing **without a bespoke realtime backend**.

1. Each open note creates a Yjs document. Tiptap binds to it via the
   `Collaboration` extension, so the editor and the CRDT are always in sync.
2. `useCollaborativeNote` loads the note's encoded Yjs state from Firestore,
   subscribes to the note document with `onSnapshot`, and applies any remote
   updates into the local Yjs doc. Because Yjs merges are conflict-free and
   idempotent, concurrent edits from multiple clients converge automatically.
3. Local edits are debounced, re-encoded, and written back to Firestore, which
   fans them out to every other client.
4. If `REACT_APP_COLLAB_WS_URL` points at a `y-websocket` server, a websocket
   provider is also attached for low-latency sync and live collaborator cursors.

Legacy notes created before the CRDT model are migrated on first open.

See [`src/hooks/useCollaborativeNote.js`](src/hooks/useCollaborativeNote.js).

## Getting started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication (Email/Password + Google), Firestore,
  and Storage enabled.

### Install & run

```bash
npm install
npm start          # http://localhost:3000
```

The app ships with a demo Firebase web config as a fallback, so it runs out of
the box. To point it at your own project, copy `.env.example` to `.env` and fill
in the `REACT_APP_FIREBASE_*` values.

### Optional: live cursors / low-latency sync

Collaboration already works over Firestore alone. To additionally enable a
websocket transport and live cursors, run a local relay and point the app at it:

```bash
npm run collab-server               # starts y-websocket on ws://localhost:1234
# then set REACT_APP_COLLAB_WS_URL=ws://localhost:1234 in .env
```

### Deploy the security rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

## Project structure

```
src/
  App.js                     Routing + auth gate
  theme.js                   Design-system MUI theme
  ThemeContext.js            Color-mode provider (light/dark)
  context/AuthContext.js     Auth + profile bootstrap
  Notes.js                   Notes workspace (data layer + layout)
  hooks/
    useCollaborativeNote.js  Yjs-over-Firestore collaboration engine
  components/
    Home / Login / Signup    Auth screens
    Profile.tsx              Account settings
    NotesNavbar.js           Top navigation
    notes/                   Sidebar, Share / Prompt / Confirm dialogs
    TiptapEditor/            Editor wrapper
    utils/                   findUserByEmail, uploadImage, export, relativeTime
  TiptapFiles/               Tiptap editor UI (toolbar, nodes, extensions)
firestore.rules              Firestore security rules
storage.rules                Storage security rules
```

## Security

- Firestore/Storage rules restrict reads and writes to a note's owner and
  collaborators; only owners can delete or change ownership.
- The Firebase **web** config is public by design (it identifies the project to
  the client SDK). Service-account keys are git-ignored and never committed.
- Set your own Firebase config via `.env` for production deployments.

## License

MIT
