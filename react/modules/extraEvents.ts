import push from './push'
import { PixelMessage } from '../typings/events'

export function sendExtraEvents(e: PixelMessage) {
  switch (e.data.eventName) {
    case 'vtex:pageView': {
      const page = e.data.pageUrl.replace(e.origin, '')
      if (e.data.routeId === 'store.search') {
        if (page.includes('?q=')) {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'PLP - Search',
          })
        } else {
          push({
            event: 'pageViewVirtual',
            location: e.data.pageUrl,
            page,
            referrer: e.data.referrer,
            title: 'PLP - Category',
          })
        }
      }

      const wordsForPDP = e.data.pageUrl.split('/')
      if (wordsForPDP[wordsForPDP.length - 1] === 'p') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page,
          referrer: e.data.referrer,
          title: 'PDP',
        })
      }

      if (e.data.routeId === 'store.home') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page,
          referrer: e.data.referrer,
          title: 'Home',
        })
      }

      if (e.data.routeId === 'store.search#category') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page,
          referrer: e.data.referrer,
          title: 'PLP - Category',
        })
      }

      return
    }

    case 'vtex:userData': {
      const { data } = e

      if (!data.isAuthenticated) {
        return
      }

      push({
        event: 'userData',
        userId: data.id,
      })

      return
    }

    default: {
      return
    }
  }
}
