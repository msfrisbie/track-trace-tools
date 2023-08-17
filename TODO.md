# TODO

## Typing Vue components

`(this as any)` or `@ts-ignore` is used in components to fix Vue's TypeScript issues

Solution: type return value for methods and computed values

Description of issue: https://stackoverflow.com/questions/56002310/property-xxx-does-not-exist-on-type-combinedvueinstancevue-read

## Typing mapState

Specify generics when using mapState

```
    ...mapState<IPluginState>({
        status: (state: IPluginState) => state.explorer.status
    }),
```

## Tailwind Grid

`grid grid-rows-[200px_minmax(900px,_1fr)_100px]`

## Typing Vue Get/Set

See transfer builder:

```
originFacility: {
    get(): IMetrcFacilityData | null {
    return store.state.transferBuilder.originFacility;
    },
    set(originFacility) {
    store.dispatch(`transferBuilder/${TransferBuilderActions.UPDATE_TRANSFER_DATA}`, {
        originFacility,
    });
    },
} as IComputedGetSet<IMetrcFacilityData | null>,
```
