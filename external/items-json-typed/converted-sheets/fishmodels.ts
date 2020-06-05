// @generated
// @eslint-disable
import json from './fishmodels.json';
export const fishmodelsSheet = json as any as IFishmodelsRoot;
export type IFishmodelsRoot = IFishmodelsRootItem[];
interface IFishmodelsRootItem {
    id: string;
    version: string;
    locale: ILocale;
}
interface ILocale {
    USen: string;
    EUen: string;
    EUde: string;
    EUes: string;
    USes: string;
    EUfr: string;
    USfr: string;
    EUit: string;
    EUnl: string;
    CNzh: string;
    TWzh: string;
    JPja: string;
    KRko: string;
    EUru: string;
}
