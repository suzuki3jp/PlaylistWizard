import type { ApiClient } from "src/ApiClient";

export class BaseManager {
  constructor(protected client: ApiClient) {}
}
