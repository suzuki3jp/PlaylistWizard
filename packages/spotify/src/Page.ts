import type { IREST } from "./REST";

export class Page<T> {
  public items: T[];
  constructor(
    private data: IPage<T>,
    private rest: IREST,
  ) {
    this.items = this.data.items;
  }

  private async prev() {
    if (!this.data.previous) return null;
    const data = await this.rest.fetch<IPage<T>>(this.data.previous, {});
    return new Page(data, this.rest);
  }

  private async next() {
    if (!this.data.next) return null;
    const data = await this.rest.fetch<IPage<T>>(this.data.next, {});
    return new Page(data, this.rest);
  }

  public async all() {
    const result = [...this.items];

    let prev = await this.prev();
    while (prev) {
      result.push(...prev.items);
      prev = await prev.prev();
    }

    let next = await this.next();
    while (next) {
      result.push(...next.items);
      next = await next.next();
    }
    return result;
  }
}

export type IPage<T> = RawPage<T>;

export interface RawPage<T> {
  href: string;
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
  items: T[];
}
