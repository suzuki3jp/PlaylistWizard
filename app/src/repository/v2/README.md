# What is the difference between v1 and v2 repositories?
- v1 repository uses the official API SDK
- v2 repository implements a custom API Client
  - The official API SDK (`googleapis`) does not work in browser environments, so v2 repository implements a custom API Client
- v1 repository is implemented with class-based approach, whereas v2 repository is implemented with function-based approach