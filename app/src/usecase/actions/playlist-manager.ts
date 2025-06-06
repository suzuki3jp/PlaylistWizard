import { type Result, err, ok } from "neverthrow";

import { sleep } from "@/common/sleep";
import { Playlist } from "@/entity";
import type { ProviderRepositoryType } from "@/repository/providers/factory";
import { getPlaylists } from "./get-playlists";
import type { Failure as FailureData } from "./plain-result";

// TODO: 409 コンフリクトが起こったときはリクエストを再試行する
// TODO: failure の時操作のどのフェーズで失敗したかを含めることで、どこまでは操作が行われているかUIに表示する
export class PlaylistManager {
  constructor(
    private token: string,
    private repository: ProviderRepositoryType,
  ) {}

  public async getPlaylists(): Promise<Result<Playlist[], FailureData>> {
    const result = await this.callApiWithRetry(getPlaylists, {
      token: this.token,
      repository: this.repository,
    });
    return result.status === 200
      ? ok(result.data.map((p) => new Playlist(p)))
      : err(result);
  }

  /**
   * Call the API function with retry.
   * If the API returns a status code **200**, the result is returned.
   * If the API returns a status code **401**, the result is returned without retrying.
   * If the API returns a status code other than **200**, the API is retried up to MAX_RETRY times.
   * @param func
   * @param params
   * @returns
   */
  private async callApiWithRetry<T extends ApiCallFunction>(
    func: T,
    ...params: Parameters<T>
  ) {
    const MAX_RETRY = 0;
    let retry = 0;
    let result: Awaited<ReturnType<T>>;

    do {
      // @ts-expect-error
      result = await func(...params);
      if (result.status === 200) break;
      if (result.status === 401) break;
      await sleep(1000);
      retry++;
    } while (retry < MAX_RETRY);
    return result;
  }
}

type ApiCallFunction = typeof getPlaylists;
