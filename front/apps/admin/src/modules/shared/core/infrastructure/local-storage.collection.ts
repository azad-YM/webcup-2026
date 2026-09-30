type LocalStorageAdapter = Pick<Storage, "getItem" | "setItem">

export class LocalStorageCollection<Item> {
  constructor(
    private readonly key: string,
    private readonly initialItems: readonly Item[] = [],
    private readonly storage: LocalStorageAdapter = globalThis.localStorage
  ) {}

  read(): Item[] {
    const serializedItems = this.storage.getItem(this.key)

    if (serializedItems === null) {
      const items = [...this.initialItems]
      this.write(items)
      return items
    }

    try {
      const items: unknown = JSON.parse(serializedItems)

      if (!Array.isArray(items)) {
        throw new Error("The stored value is not a collection")
      }

      return items as Item[]
    } catch {
      const items = [...this.initialItems]
      this.write(items)
      return items
    }
  }

  write(items: readonly Item[]): void {
    this.storage.setItem(this.key, JSON.stringify(items))
  }
}
