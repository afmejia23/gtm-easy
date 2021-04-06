import { canUseDOM } from 'vtex.render-runtime'
import { sendEnhancedEcommerceEvents } from './modules/enhancedEcommerceEvents'
import { sendExtraEvents } from './modules/extraEvents'
import { sendLegacyEvents } from './modules/legacyEvents'

// import { PixelMessage } from './typings/events'

// no-op for extension point
export default function() {
  return null
}

export function handleEvents(e: any, a: any) {
  sendEnhancedEcommerceEvents(e, a.location.pathname)
  sendExtraEvents(e)
  sendLegacyEvents(e)
}

if (canUseDOM) {
  window.addEventListener('message', e => {
    handleEvents(e, window)
  })
}
