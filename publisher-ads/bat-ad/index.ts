import createTemplate from './createTemplate'
import { OnAdPositionReadyFunction } from '../slotTargeting'
import { AdSize } from '../'

let adTemplate: HTMLTemplateElement

// BATAd is generic - it should render an ad on any site
// When provided with required data (target ad sizes),
// it communicates with content script and backend to ask
// for an ad.
export default class BATAd {
  static get observedAttributes() { return ['responsive', 'id', 'creative-dimensions', 'creative-url'] }
  protected element: HTMLElement
  private shadowRoot: ShadowRoot
  private elementObserver: MutationObserver
  private onAdPositionReady: OnAdPositionReadyFunction
  private sizes_: AdSize[]
  private isResponsive_: boolean

  constructor(adContainer: HTMLElement, onAdPositionReady: OnAdPositionReadyFunction) {
    this.element = adContainer
    if (!adTemplate) adTemplate = createTemplate()
    this.shadowRoot = this.element.attachShadow({mode: 'open'})
    this.shadowRoot.appendChild(adTemplate.content.cloneNode(true))
    const dialogTrigger = this.shadowRoot.querySelector('.controls__header')
    const dialog = this.shadowRoot.querySelector('dialog')
    dialog?.addEventListener('click', () => {
      dialog.close()
    })
    dialogTrigger?.addEventListener('click', () => {
      dialog?.showModal()
    })
    const targetTrigger = this.shadowRoot.querySelector('.interaction-handler')
    targetTrigger?.addEventListener('click', () => {
      console.log('creative clicked')
      if (this.publisherAd) {
        this.triggerInteracted(this.publisherAd)
      }
    })

    this.elementObserver = new MutationObserver(this.elementMutatedCallback.bind(this))
    this.elementObserver.observe(this.element, { attributes: true })
    this.onAdPositionReady = onAdPositionReady
    this.broadcastReadyForContent()
  }

  get batAdId() {
    let val = this.element.getAttribute('bat-ad-id')
    return val
  }

  get sizes(): AdSize[] {
    return this.sizes_
  }

  set sizes(value: AdSize[]) {
    console.log('BATAd: received sizes for element')
    this.sizes_ = value
    this.broadcastReadyForContent()
  }

  get isResponsive() {
    return this.isResponsive_
  }

  set isResponsive(value: any) {
    console.log('Batad isR change')
    this.isResponsive_ = Boolean(value)
    this.broadcastReadyForContent()
  }

  get style() {
    return this.element.style
  }

  elementMutatedCallback (mutationsList: MutationRecord[]) {
    for(const mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName && BATAd.observedAttributes.includes(mutation.attributeName)) {
        console.log('BATAd: The ' + mutation.attributeName + ' attribute was modified.')
        this.attributeChangedCallback(
          mutation.attributeName,
          mutation.oldValue,
          this.element.getAttribute(mutation.attributeName)
        )
      }
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'responsive') {
      this.broadcastReadyForContent()
    }
    if (name === 'creative-dimensions' && newValue && newValue !== oldValue) {
      const dimensions = newValue.split('x')
      if (dimensions.length !== 2) {
        console.error('BATAd invalid dimension syntax', dimensions)
        return
      }
      this.style.width = `${dimensions[0]}px`
      this.style.height = `${dimensions[1]}px`
    }
    if (name === 'creative-url' && newValue) {
      const creativeElement = this.shadowRoot.querySelector('.creative')
      if (creativeElement)
        creativeElement.setAttribute('src', newValue)
      this.ensureVisible()
    }
  }

  ensureVisible() {
    // Override cosmetic filters
    window.requestAnimationFrame(() => {
      let element: HTMLElement | null = this.element
      while (element) {
        if (element.computedStyleMap().get('display').value === 'none') {
          element.style.setProperty('display', 'block', 'important')
        }
        element = element.parentElement
      }
    })
  }

  private broadcastReadyForContent() {
    if (!this.element.isConnected) {
      console.warn('BATAd: attempted to call broadcastReadyForContent when element not in DOM')
    }
    console.log('fetching creative', this.element, this.sizes, this.isResponsive)
    if (this.sizes && this.sizes.length) {
      console.log('performing pre-flight')
      this.element.setAttribute('bat-ad-id', '' + Math.random().toString(36).substr(2, 9))
      this.element.innerText = 'Fetching creative...'
      this.onAdPositionReady(this)
    }
  }
}