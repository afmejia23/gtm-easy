import push from './push'
import { PixelMessage } from '../typings/events'

export function sendExtraEvents(e: PixelMessage) {
  switch (e.data.eventName) {
    case 'vtex:pageView': {
      if (e.data.routeId === 'store.search') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page: e.data.pageUrl.replace(e.origin, ''),
          referrer: e.data.referrer,
          title: 'PLP - Search',
        })
      }

      const wordsForPDP = e.data.pageUrl.split('/')
      if (wordsForPDP[wordsForPDP.length - 1] === 'p') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page: e.data.pageUrl.replace(e.origin, ''),
          referrer: e.data.referrer,
          title: 'PDP',
        })
      }

      if (e.data.routeId === 'store.home') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page: e.data.pageUrl.replace(e.origin, ''),
          referrer: e.data.referrer,
          title: 'Home',
        })
      }

      if (e.data.routeId === 'store.search#category') {
        push({
          event: 'pageViewVirtual',
          location: e.data.pageUrl,
          page: e.data.pageUrl.replace(e.origin, ''),
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
      push({
        event: 'otherView',
      })
      return
    }
  }
}
