# PlaylistWizard

PlaylistWizard is the domain of organizing playlists that live on external media providers. It focuses on user-directed playlist operations, provider-linked accounts, and definitions that describe how playlists should be composed.

## Language

**User**:
A person who signs in to PlaylistWizard. A **User** can have multiple **Accounts**.
_Avoid_: User Account

**Account**:
An application-level connection between a **User** and an external media provider. Each **Account** is linked to one **Provider Account** and acts as the execution subject for playlist operations.
_Avoid_: Connected Account, Google Account

**Provider Account**:
An account that exists on an external **Provider** such as Google. A **Provider Account** is referenced through an **Account** in PlaylistWizard.
_Avoid_: Account

**Provider**:
An OAuth and API integration boundary used by PlaylistWizard to authenticate and call external services. A **Provider** can expose multiple **Platforms**.
_Avoid_: Platform

**Platform**:
A user-facing service where playlists are experienced and managed, such as YouTube or YouTube Music. A **Platform** belongs to a **Provider**, but users should usually see the Platform name rather than the Provider name.
_Avoid_: Provider

**Playlist**:
An ordered collection of media items that exists on a **Platform**. PlaylistWizard handles a **Playlist** from the perspective of one **Account** when reading or changing it.
_Avoid_: PlaylistWizard playlist

**Video**:
A playable media object on a **Platform**. The same **Video** can appear in multiple **Playlists**.
_Avoid_: Playlist Item

**Playlist Item**:
An occurrence of a **Video** inside a **Playlist**. A **Playlist Item** has a position, and repeated appearances of the same **Video** are distinct Playlist Items.
_Avoid_: Video

**Structured Playlists**:
A set of **Playlists** whose relationships are defined through dependencies. Structured Playlists describe how Playlist Items should flow between related Playlists.
_Avoid_: Structured Playlist

**Structured Playlists Definition**:
A JSON definition, or the stored instance of that definition, that represents **Structured Playlists** according to PlaylistWizard's schema. A **Structured Playlists Definition** belongs to one **Account**, and an Account can have multiple Structured Playlists Definitions; its name is a user-facing label, not a unique identity.
_Avoid_: Structured Playlists

**Dependency**:
A relationship where one **Playlist** uses another Playlist as a source during Structured Playlists synchronization. A **Dependency** is a relationship between Playlists, not between Accounts or Providers.
_Avoid_: Account dependency, Provider dependency

**Sync**:
An operation that uses a **Structured Playlists Definition** to add missing **Playlist Items** so that Videos from dependency Playlists exist in the target Playlist. **Sync** does not guarantee deletion, reordering, or duplicate cleanup.
_Avoid_: Mirror, reconcile, exact sync

**Playlist Action**:
A user-requested change to one or more **Playlists** through an **Account**. Examples include create, copy, shuffle, merge, extract, delete, deduplicate, sync, and undo.
_Avoid_: Job, Step

**Collect**:
A future-facing name for the Playlist Action currently called Extract. It adds the Videos from selected **Playlist Items** to another Playlist while leaving the original Playlist Items in the source Playlist.
_Avoid_: Move

**Deduplicate**:
A **Playlist Action** that removes repeated **Playlist Items** in one Playlist when they point to the same **Video**. The first Playlist Item for a Video remains, and later Playlist Items for the same Video are removed.
_Avoid_: Playlist Item ID deduplication

**Copy**:
A **Playlist Action** that adds Playlist Items from one source Playlist to one target Playlist. The source Playlist is not changed.
_Avoid_: Move

**Merge**:
A **Playlist Action** that adds Playlist Items from multiple source Playlists to one target Playlist. Source Playlists are not changed.
_Avoid_: Move

**Shuffle**:
A **Playlist Action** that randomizes the order of Playlist Items in one Playlist. Shuffle does not add or remove Playlist Items.
_Avoid_: Random copy, random merge

**Undo**:
A **Playlist Action** that runs inverse operations for a past Playlist Action. Undo is a best-effort restoration against the current Platform state and does not guarantee restoration of original IDs or externally changed state.
_Avoid_: Rollback, exact restore

## Example Dialogue

Developer: Which provider account should this playlist operation use?

Domain expert: Use the user's Account that is linked to the Provider Account owning the playlist.

Developer: Should the UI say Google or YouTube?

Domain expert: Say YouTube when the user is choosing the playlist Platform. Google is the Provider behind the Account.

Developer: Does PlaylistWizard own this Playlist?

Domain expert: No. The Playlist exists on the Platform; PlaylistWizard operates on it through an Account.

Developer: Can I delete the Video from the Playlist?

Domain expert: Delete the Playlist Item. The Video remains on the Platform and may appear elsewhere.

Developer: Are these Structured Playlists stored on YouTube?

Domain expert: No. The Playlists are on the Platform, but the Structured Playlists Definition is PlaylistWizard's definition of their dependency relationships.

Developer: After Sync, will the target Playlist exactly match its dependencies?

Domain expert: No. Sync adds missing Videos from dependency Playlists, but it does not delete, reorder, or clean duplicates.

Developer: Is creating a Playlist a Job?

Domain expert: The user's intent is a Playlist Action. It may be executed through a job system, but the action is the domain concept.

Developer: Does Extract remove selected items from the source Playlist?

Domain expert: No. It behaves like Collect: selected Videos are added to another Playlist, and the original Playlist Items remain.

Developer: Are duplicate Playlist Items detected by Playlist Item ID?

Domain expert: No. Deduplicate compares Video IDs and removes later Playlist Items for the same Video.

Developer: Is Merge different from Copy?

Domain expert: Yes. Copy uses one source Playlist, while Merge uses multiple source Playlists. Neither removes items from the sources.

Developer: Does Shuffle change which Videos are in the Playlist?

Domain expert: No. Shuffle changes the order of Playlist Items only.

Developer: Will Undo restore the exact original Playlist?

Domain expert: No. Undo runs inverse operations as best effort against the current Platform state.
