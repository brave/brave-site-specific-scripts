import BATAd from '../bat-ad'
import { AdSize } from '../'

export type GetAdSizesFunction = (element: HTMLElement) => AdSize[]
export type OnAdPositionReadyFunction = (batAd: BATAd) => void