# Execute Playlist Actions Through Playlist Action Jobs

Playlist Actions can take longer than a single request should own, especially when they touch many Playlist Items or depend on external Platform APIs. We will execute server-side Playlist Actions through the Playlist Action Job system: a Playlist Action is converted into a Job, the Job is decomposed into Steps, and Steps are processed through a queue. This adds operational complexity, but gives PlaylistWizard a place for progress tracking, retries, and long-running execution without tying the action to a single web request.
