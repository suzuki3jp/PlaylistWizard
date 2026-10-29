import type { ApiClient } from "../ApiClient";

export class BaseManager {
  constructor(protected client: ApiClient) {}
}
