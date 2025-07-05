<img src="https://raw.githubusercontent.com/suzuki3jp/PlaylistWizard/c34ac5a7113316bc92680c051f282bd5f487f405/assets/banner-small.png"/>

<hr />

<p align="center">
<a href="https://playlistwizard.suzuki3.jp/en"><b>Try it now! 👉 playlistwizard.suzuki3.jp</b></a><br />
<i>Documentatoin available in: <a href=".//README.md">English</a> | <a href="./README_ja.md">日本語</a></i>
</p>

<hr />

[![Website](https://deploy-badge.vercel.app/?url=http%3A%2F%2Fplaylistwizard.suzuki3.jp&name=playlistwizard.suzuki3.jp)](https://playlistwizard.suzuki3.jp/en)
[![Test Workflow](https://github.com/suzuki3jp/PlaylistWizard/actions/workflows/test.yml/badge.svg)](https://github.com/suzuki3jp/playlistwizard/actions)
[![Code Coverage](https://codecov.io/gh/suzuki3jp/PlaylistWizard/graph/badge.svg?token=UH5HX39VG7)](https://codecov.io/github/suzuki3jp/playlistwizard)
![LOC](https://tokei.rs/b1/github/suzuki3jp/playlistwizard)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/suzuki3jp/playlistwizard)](https://github.com/suzuki3jp/playlistwizard/pulse)
[![GitHub last commit](https://img.shields.io/github/last-commit/suzuki3jp/playlistwizard)](https://github.com/suzuki3jp/playlistwizard/commits/main)

**Playlist Wizard** is a website for managing and organizing your playlists.
<div style="text-align: center; margin-top: 1rem; margin-bottom: 2rem;">
    <img src="https://raw.githubusercontent.com/suzuki3jp/PlaylistWizard/28b4a49f92ba217c1ae9db1c87fd83076fab0e75/assets/playlist-management-comparison.jpg" width="800"/>
</div>
<img src="https://raw.githubusercontent.com/suzuki3jp/PlaylistWizard/28b4a49f92ba217c1ae9db1c87fd83076fab0e75/assets/playlists.png"/>

# ✨ Key Features
- 🎯 **Intuitive Interface**: User-friendly GUI for managing your playlists
- 🛠️ **Playlist Management**: Copy, shuffle, merge, extract, and delete your playlists
- ↩️ **Undo Support (BETA)**: Safely undo any playlist operations
- 🔍 **Playlist Browser**: Search and browse through your playlist items
- 📥 **Import Playlist**: Import playlists owned by other users
- 🌐 **Multi-Platform**: Supports multiple platforms (YouTube, YouTube Music, Spotify)
- 🌍 **Localization**: Available in multiple languages (English, Japanese)

# 🛠️ Development

1. Clone the repository
    ```bash
    git clone https://github.com/suzuki3jp/PlaylistWizard.git
    cd PlaylistWizard
    ```

2. Install dependencies & Build packages
    ```bash
    pnpm bootstrap
    ```

3. Configure environment variables
    ```bash
    cd app
    cp .env.example .env
    # Set appropriate values in .env file
    ```

4. Start development server
    ```bash
    pnpm dev
    ```

# 🚀 Roadmap
- [ ] Cross-service playlist transfer
- [ ] Support for additional platforms

💡 Have an idea for a new feature? Feel free to submit an [issue](https://github.com/suzuki3jp/playlistwizard/issues/new)!