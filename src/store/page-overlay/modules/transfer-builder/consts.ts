export const TRANSFER_BUILDER: string = 'transferBuilder';

export enum TransferBuilderMutations {
    ADD_PACKAGE = 'ADD_PACKAGE',
    REMOVE_PACKAGE = 'REMOVE_PACKAGE',
    RESET_TRANSFER_DATA = 'RESET_TRANSFER_DATA',
    SET_PACKAGES = 'SET_PACKAGES',
    UPDATE_TRANSFER_DATA = 'UPDATE_TRANSFER_DATA',
    SET_TRANSFER_FOR_UPDATE = 'SET_TRANSFER_FOR_UPDATE'
}

export enum TransferBuilderGetters {
    ACTIVE_PACKAGE_LIST = 'ACTIVE_PACKAGE_LIST',
    IS_PACKAGE_IN_ACTIVE_LIST = 'IS_PACKAGE_IN_ACTIVE_LIST'
}

export enum TransferBuilderActions {
    ADD_PACKAGE = 'ADD_PACKAGE',
    REFRESH_PACKAGES = 'REFERSH_PACKAGES',
    REMOVE_PACKAGE = 'REMOVE_PACKAGE',
    RESET_TRANSFER_DATA = 'RESET_TRANSFER_DATA',
    UPDATE_TRANSFER_DATA = 'UPDATE_TRANSFER_DATA',
    SET_TRANSFER_FOR_UPDATE = 'SET_TRANSFER_FOR_UPDATE'
}
